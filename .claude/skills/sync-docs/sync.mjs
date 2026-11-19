#!/usr/bin/env node
// Writes the generated pages of one language from a sync manifest.
// Used by the /sync-docs skill (see SKILL.md next to this file); not meant to be run by hand.
//
//   node .claude/skills/sync-docs/sync.mjs <manifest.json> [--dry-run]
//
// The manifest is written by the agent from what the Claude Docs connector returns:
// {
//   "lang": "en",
//   "docName": "SNT Toolbox documentation",
//   "workDir": "<folder holding the .b64 files>",
//   "tabs": [{
//     "id": "<tab id>", "name": "<tab name>", "order": "<tabs[id].order>",
//     "b64": "<file in workDir: the export's bytes_b64>", "bytes": <the export's data.bytes>,
//     "dropByline": <true when the paragraph after the title is only chips (date · @person)>,
//     "images": [{ "alt": "<media alt>", "asset": "<32-hex asset id>", "file": "<downloaded file path>" }],
//     "refs":   [{ "label": "<mention label>", "tab": "<target tab id>" }]
//   }]
// }
// `images` and `refs` are listed in document order.
//
// Images are not stored in the repo (ADR 0006): each one is uploaded to the public folder of the
// OpenHEXA workspace `snt-toolbox-docs` as `public/images/<first 16 hex of its SHA-256>.<ext>`,
// only if that file is not there yet, and pages link to its public URL. Uploaded files are never
// overwritten or deleted. The workspace API key comes from OPENHEXA_TOKEN, or else from the
// `openhexa` CLI config (~/.openhexa.ini, section [workspaces]); the API URL from OPENHEXA_URL, or
// else the CLI config, or else https://api.openhexa.org. --dry-run checks which images exist but
// uploads and writes nothing.

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SRC = path.join(REPO, "docs", "src");
const HEADER_RE = /^<!-- Generated from the Claude Doc ".*", tab ".*"\. Do not edit here\. -->/;
const WORKSPACE = "snt-toolbox-docs";
const IMAGE_DIR = "images/"; // inside the workspace's public folder
const CONTENT_TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" };

const [manifestPath, ...flags] = process.argv.slice(2);
const dryRun = flags.includes("--dry-run");
if (!manifestPath) {
  console.error("usage: sync.mjs <manifest.json> [--dry-run]");
  process.exit(2);
}

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const { lang, docName, workDir } = manifest;
if (!/^[a-z]{2}(-[a-z]{2})?$/.test(lang ?? "")) throw new Error(`Bad lang: ${lang}`);

const langDir = path.join(SRC, lang);
const assetDir = path.join(SRC, "assets", lang);
const flagsOut = []; // things that did not convert cleanly: review them
const notesOut = []; // expected changes, listed for the record
const flag = (tab, msg) => flagsOut.push(`${tab}: ${msg}`);
const note = (tab, msg) => notesOut.push(`${tab}: ${msg}`);

// "1. Data orchestration and analysis" -> "data-orchestration-and-analysis"
function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^\s*\d+[.)]\s*/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "page";
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// The export escapes Markdown-special characters ("1\. Data …", "snt\_development").
const looseRe = (label) =>
  new RegExp(
    [...label]
      .map((ch) => (/[\\`*_{}[\]()#+\-.!|<>]/.test(ch) ? `\\\\?${escapeRe(ch)}` : escapeRe(ch)))
      .join(""),
  );

// Tabs in tab order; 00 = first tab (Home).
const tabs = [...manifest.tabs].sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
const width = Math.max(2, String(tabs.length - 1).length);
const used = new Set();
for (const [i, t] of tabs.entries()) {
  t.slug = slugify(t.name);
  if (used.has(t.slug)) throw new Error(`Two tabs give the same page name: ${t.slug}`);
  used.add(t.slug);
  t.file = `${String(i).padStart(width, "0")}-${t.slug}.md`;
}
const byId = new Map(tabs.map((t) => [t.id, t]));

// --- OpenHEXA ---------------------------------------------------------------------------------

async function openhexaSettings() {
  const ini = await fs.readFile(path.join(os.homedir(), ".openhexa.ini"), "utf8").catch(() => "");
  const sections = {};
  let current = null;
  for (const line of ini.split(/\r?\n/)) {
    const sec = /^\s*\[([^\]]+)\]\s*$/.exec(line);
    if (sec) current = sections[sec[1].trim()] ??= {};
    const kv = /^\s*([^=:#;\s][^=:]*?)\s*[=:]\s*(.*?)\s*$/.exec(line);
    if (kv && current && !sec) current[kv[1]] = kv[2];
  }
  const token = process.env.OPENHEXA_TOKEN || sections.workspaces?.[WORKSPACE];
  const url = (process.env.OPENHEXA_URL || sections.openhexa?.url || "https://api.openhexa.org").replace(/\/+$/, "");
  if (!token) {
    throw new Error(
      `No API key for the OpenHEXA workspace "${WORKSPACE}". Run \`openhexa workspaces add ${WORKSPACE}\` ` +
        `(needs editor access to the workspace), or set OPENHEXA_TOKEN.`,
    );
  }
  return { token, url };
}

const hexa = await openhexaSettings();

async function gql(query, variables) {
  const res = await fetch(`${hexa.url}/graphql/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${hexa.token}` },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`OpenHEXA API: HTTP ${res.status}`);
  const body = await res.json();
  if (body.errors?.length) throw new Error(`OpenHEXA API: ${body.errors.map((e) => e.message).join("; ")}`);
  return body.data;
}

const { workspace } = await gql(
  `query($s: String!) { workspace(slug: $s) { publicFiles { url folderExists } permissions { managePublicFiles } } }`,
  { s: WORKSPACE },
);
if (!workspace) throw new Error(`OpenHEXA workspace "${WORKSPACE}" not found, or the API key has no access to it.`);
if (!workspace.publicFiles?.folderExists) throw new Error(`The public folder of "${WORKSPACE}" is not enabled.`);
const publicBase = workspace.publicFiles.url.replace(/\/?$/, "/");

async function remoteSize(key) {
  const d = await gql(`query($s: String!, $k: String!) { workspace(slug: $s) { bucket { object(key: $k) { size } } } }`, {
    s: WORKSPACE,
    k: key,
  });
  const o = d.workspace.bucket.object;
  return o ? Number(o.size) : null;
}

async function upload(key, bytes, contentType) {
  const d = await gql(
    `mutation($i: PrepareObjectUploadInput!) { prepareObjectUpload(input: $i) { success errors uploadUrl headers } }`,
    { i: { workspaceSlug: WORKSPACE, objectKey: key, contentType } },
  );
  const r = d.prepareObjectUpload;
  if (!r.success) throw new Error(`Cannot upload ${key}: ${r.errors.join(", ")}`);
  const res = await fetch(r.uploadUrl, { method: "PUT", headers: { ...(r.headers ?? {}), "Content-Type": contentType }, body: bytes });
  if (!res.ok) throw new Error(`Upload of ${key} failed: HTTP ${res.status}`);
  if ((await remoteSize(key)) !== bytes.length) throw new Error(`Upload of ${key}: size check failed`);
}

// Name each image by its content, before the pages are converted.
for (const t of tabs) {
  for (const img of t.images ?? []) {
    const ext = path.extname(img.file).toLowerCase() || ".png";
    if (!CONTENT_TYPES[ext]) throw new Error(`${t.name}: unsupported image type ${ext} (${img.file})`);
    img.bytes = await fs.readFile(img.file);
    img.name = createHash("sha256").update(img.bytes).digest("hex").slice(0, 16) + ext;
    img.contentType = CONTENT_TYPES[ext];
  }
}

// --- Pages ------------------------------------------------------------------------------------

const pages = new Map(); // file -> content
const images = new Map(); // image name -> { bytes, contentType }

for (const t of tabs) {
  const raw = Buffer.from((await fs.readFile(path.join(workDir, t.b64), "utf8")).replace(/\s+/g, ""), "base64");
  if (raw.length !== t.bytes) {
    throw new Error(`${t.name}: decoded ${raw.length} bytes, export said ${t.bytes}. Copy the base64 again.`);
  }
  let md = raw.toString("utf8").replace(/\r\n/g, "\n");

  // The tab's own H1 is replaced by "# <tab name>".
  md = md.replace(/^\s*# (.*)\n+/, (_, h1) => {
    if (h1.trim() !== t.name.replace(/^\d+[.)]\s*/, "")) note(t.name, `title "${h1.trim()}" replaced by the tab name`);
    return "";
  });
  if (t.dropByline) {
    md = md.replace(/^(.*)\n+/, (_, line) => {
      note(t.name, `byline dropped: "${line}"`);
      return "";
    });
  }

  // Bold applied in two goes is stored as two adjacent bold runs; the export writes them as
  // "**a ****b**", which Markdown renders with stray asterisks. Join the runs: "**a b**".
  // Escaped asterisks (\*) never match: they are not four in a row.
  let joined = 0;
  md = md.replace(/(?<![\\*\n])\*\*\*\*(?=[^\s*])/g, () => (joined++, ""));
  if (joined) note(t.name, `joined ${joined} split bold run(s)`);

  // Images: placeholders come in document order, like the <media> blocks.
  let n = 0;
  md = md.replace(/&#91;image: (.*?)\\\]/g, (all, alt) => {
    const img = t.images?.[n++];
    if (!img) return all;
    images.set(img.name, img);
    if (/\.(png|jpe?g|gif|webp)$/i.test(alt.trim())) flag(t.name, `image alt text is a file name: "${alt}" (write a description in the doc)`);
    return `![${alt}](${publicBase}${IMAGE_DIR}${img.name})`;
  });
  if (n !== (t.images?.length ?? 0)) {
    throw new Error(`${t.name}: ${n} image placeholders in the export, ${t.images?.length ?? 0} in the manifest`);
  }

  // Embedded widgets (charts, diagrams) cannot be exported.
  md = md.replace(/&#91;embedded content: (.*?)\\\]/g, (_, caption) => {
    flag(t.name, `embedded content not synced: "${caption}"`);
    return `<!-- Not synced: embedded content "${caption.replace(/--/g, "-")}" (see the Claude Doc). -->`;
  });

  // Links to other tabs: the export keeps only the chip label; link it to the generated page.
  let cursor = 0;
  for (const ref of t.refs ?? []) {
    const target = byId.get(ref.tab);
    const m = looseRe(ref.label).exec(md.slice(cursor));
    if (!target || !m) {
      flag(t.name, `tab link "${ref.label}" not converted (${target ? "label not found" : "unknown tab"})`);
      continue;
    }
    const start = cursor + m.index;
    const link = `[${ref.label}](./${target.slug}.html)`;
    md = md.slice(0, start) + link + md.slice(start + m[0].length);
    cursor = start + link.length;
  }

  for (const m of md.matchAll(/\]\((https?:\/\/[^)]*claude\.ai[^)]*)\)/g)) flag(t.name, `link to claude.ai left as is: ${m[1]}`);
  for (const m of md.matchAll(/&#91;[^\n]*?\\\]/g)) flag(t.name, `unconverted placeholder: ${m[0]}`);

  const header = `<!-- Generated from the Claude Doc "${docName}", tab "${t.name}". Do not edit here. -->`;
  pages.set(t.file, `${header}\n\n# ${t.name}\n\n${md.trim()}\n`);
}

const report = { written: [], unchanged: [], deleted: [], images: { uploaded: [], present: [], localRemoved: [] } };
const readOr = (p) => fs.readFile(p).catch(() => null);

// Upload missing images first, so no page ever links to an image that is not there.
for (const [name, img] of images) {
  const key = `public/${IMAGE_DIR}${name}`;
  const size = await remoteSize(key);
  if (size === img.bytes.length) report.images.present.push(name);
  else if (size !== null) throw new Error(`${key} exists with another size (${size} bytes, expected ${img.bytes.length}). Not overwriting it.`);
  else {
    report.images.uploaded.push(name);
    if (!dryRun) await upload(key, img.bytes, img.contentType);
  }
}

// Compare pages with what is on disk, then write.
for (const [file, content] of pages) {
  const p = path.join(langDir, file);
  const old = await readOr(p);
  if (old && old.toString("utf8") === content) report.unchanged.push(file);
  else {
    report.written.push(file);
    if (!dryRun) await fs.writeFile(p, content, "utf8");
  }
}
// Generated pages whose tab is gone (hand-made pages, without the header, are left alone).
for (const ent of await fs.readdir(langDir, { withFileTypes: true })) {
  if (!ent.isFile() || !ent.name.endsWith(".md") || pages.has(ent.name)) continue;
  const p = path.join(langDir, ent.name);
  if (HEADER_RE.test((await fs.readFile(p, "utf8")).trimStart())) {
    report.deleted.push(ent.name);
    if (!dryRun) await fs.unlink(p);
  }
}

// docs/src/assets/<lang>/ belongs to the sync. Images used to be copied there; pages no longer
// link to it, so anything left over goes.
for (const ent of await fs.readdir(assetDir, { withFileTypes: true }).catch(() => [])) {
  if (ent.isFile()) {
    report.images.localRemoved.push(ent.name);
    if (!dryRun) await fs.unlink(path.join(assetDir, ent.name));
  }
}

const list = (label, xs) => console.log(`${label} (${xs.length})${xs.length ? ":\n  " + xs.join("\n  ") : ""}`);
console.log(`${dryRun ? "[dry run] " : ""}Synced ${pages.size} tabs of "${docName}" into docs/src/${lang}/`);
list("Pages written", report.written);
list("Pages unchanged", report.unchanged);
list("Pages deleted", report.deleted);
list(`Images ${dryRun ? "to upload" : "uploaded"} to ${publicBase}${IMAGE_DIR}`, report.images.uploaded);
list("Images already there", report.images.present);
list(`Local images removed from docs/src/assets/${lang}/`, report.images.localRemoved);
list("Notes", notesOut);
list("Did not convert cleanly", flagsOut);
