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

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SRC = path.join(REPO, "docs", "src");
const HEADER_RE = /^<!-- Generated from the Claude Doc ".*", tab ".*"\. Do not edit here\. -->/;

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

const pages = new Map(); // file -> content
const images = new Map(); // asset file name -> source path

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

  // Images: placeholders come in document order, like the <media> blocks.
  let n = 0;
  md = md.replace(/&#91;image: (.*?)\\\]/g, (all, alt) => {
    const img = t.images?.[n++];
    if (!img) return all;
    const ext = path.extname(img.file).toLowerCase() || ".png";
    const name = `${t.slug}-${img.asset.slice(0, 8)}${ext}`;
    images.set(name, img.file);
    if (/\.(png|jpe?g|gif|webp)$/i.test(alt.trim())) flag(t.name, `image alt text is a file name: "${alt}" (write a description in the doc)`);
    return `![${alt}](../assets/${lang}/${name})`;
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

// Compare with what is on disk, then write.
const report = { written: [], unchanged: [], deleted: [], images: { written: [], unchanged: [], deleted: [] } };
const readOr = (p) => fs.readFile(p).catch(() => null);

if (!dryRun) await fs.mkdir(assetDir, { recursive: true });

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

for (const [name, from] of images) {
  const p = path.join(assetDir, name);
  const [src, old] = [await fs.readFile(from), await readOr(p)];
  if (old && Buffer.compare(src, old) === 0) report.images.unchanged.push(name);
  else {
    report.images.written.push(name);
    if (!dryRun) await fs.writeFile(p, src);
  }
}
// docs/src/assets/<lang>/ belongs to the sync: anything no page uses goes.
for (const ent of await fs.readdir(assetDir, { withFileTypes: true }).catch(() => [])) {
  if (ent.isFile() && !images.has(ent.name)) {
    report.images.deleted.push(ent.name);
    if (!dryRun) await fs.unlink(path.join(assetDir, ent.name));
  }
}

const list = (label, xs) => console.log(`${label} (${xs.length})${xs.length ? ":\n  " + xs.join("\n  ") : ""}`);
console.log(`${dryRun ? "[dry run] " : ""}Synced ${pages.size} tabs of "${docName}" into docs/src/${lang}/`);
list("Pages written", report.written);
list("Pages unchanged", report.unchanged);
list("Pages deleted", report.deleted);
list("Images written", report.images.written);
list("Images unchanged", report.images.unchanged);
list("Images deleted", report.images.deleted);
list("Notes", notesOut);
list("Did not convert cleanly", flagsOut);
