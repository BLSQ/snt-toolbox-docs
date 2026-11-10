import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.resolve(__dirname, "..");
const SRC_ROOT = path.join(DOCS_DIR, "src");
const ASSETS_DIR = path.join(DOCS_DIR, "src", "assets");
const BUILD_DIR = path.join(DOCS_DIR, "build");
const TEMPLATES_DIR = path.join(DOCS_DIR, "templates");
const DEFAULT_LANG = "en";
// Folders under docs/src/ that are never languages or page sources.
const RESERVED_DIRS = new Set(["assets", "private"]);

function isIgnoredName(name) {
  return name.startsWith("_") || name.startsWith(".");
}

function stripFirstH1(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const idx = lines.findIndex((l) => /^#\s+/.test(l));
  if (idx === -1) return { title: null, body: markdown };

  const title = lines[idx].replace(/^#\s+/, "").trim() || null;
  const bodyLines = lines.slice(0, idx).concat(lines.slice(idx + 1));

  while (bodyLines.length && bodyLines[0].trim() === "") bodyLines.shift();
  return { title, body: bodyLines.join("\n") };
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function listMarkdownFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (isIgnoredName(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await listMarkdownFiles(p)));
    } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".md")) {
      out.push(p);
    }
  }
  return out;
}

// Languages are the folders under docs/src/ that contain at least one page.
async function detectLanguages() {
  let entries = [];
  try {
    entries = await fs.readdir(SRC_ROOT, { withFileTypes: true });
  } catch (err) {
    if (err?.code !== "ENOENT") throw err;
    return [];
  }

  const langs = [];
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    if (isIgnoredName(ent.name) || RESERVED_DIRS.has(ent.name)) continue;
    const files = await listMarkdownFiles(path.join(SRC_ROOT, ent.name));
    if (files.length > 0) langs.push(ent.name);
  }

  return langs.sort((a, b) => {
    if (a === DEFAULT_LANG) return -1;
    if (b === DEFAULT_LANG) return 1;
    return a.localeCompare(b, "en");
  });
}

async function copyDir(srcDir, destDir) {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  await ensureDir(destDir);
  for (const ent of entries) {
    const src = path.join(srcDir, ent.name);
    const dest = path.join(destDir, ent.name);
    if (ent.isDirectory()) {
      await copyDir(src, dest);
    } else if (ent.isFile()) {
      await fs.copyFile(src, dest);
    }
  }
}

function sanitizeSegment(seg) {
  return seg
    .trim()
    .replaceAll(" ", "-")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Order prefix such as "00-" or "03-" is used for sorting only, never in URLs.
function stripOrderPrefix(seg) {
  return seg.replace(/^\d+-/, "");
}

function toOutputRelPath(langSrcDir, inputPath) {
  const rel = path.relative(langSrcDir, inputPath);
  const dir = path.dirname(rel);
  const base = path.basename(rel, path.extname(rel));

  const outDir =
    dir && dir !== "."
      ? dir
          .split(path.sep)
          .map((seg) => sanitizeSegment(stripOrderPrefix(seg)))
          .join(path.sep)
      : "";

  const outFile = `${sanitizeSegment(stripOrderPrefix(base)) || "page"}.html`;
  return outDir ? path.join(outDir, outFile) : outFile;
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function folderTitleFromDir(dirName) {
  if (!dirName || dirName === ".") return "";
  return dirName;
}

function toHref(fromRelPath, toRelPath) {
  const fromDir = path.dirname(fromRelPath);
  const rel = path.relative(fromDir === "." ? "" : fromDir, toRelPath);
  return rel.startsWith(".") ? rel : `./${rel}`;
}

function renderLanguageSwitch({ langs, currentLang, langToHref }) {
  // Only show the switcher when there is something to switch to.
  if (langs.length < 2) return "";

  const options = langs
    .map((lang) => {
      const href = langToHref[lang] ?? "./index.html";
      const selected = lang === currentLang ? " selected" : "";
      return `<option value="${escapeHtml(href)}"${selected}>${escapeHtml(
        lang.toUpperCase(),
      )}</option>`;
    })
    .join("");

  return `<div class="lang-float" aria-label="Language">
<select class="lang-switch" aria-label="Language" onchange="location.href=this.value">
${options}
</select>
</div>`;
}

function redirectPage(url) {
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${url}">`;
}

async function main() {
  await fs.rm(BUILD_DIR, { recursive: true, force: true });
  await ensureDir(BUILD_DIR);

  const [template, css] = await Promise.all([
    fs.readFile(path.join(TEMPLATES_DIR, "page.html"), "utf8"),
    fs.readFile(path.join(TEMPLATES_DIR, "styles.css"), "utf8"),
  ]);

  await fs.writeFile(path.join(BUILD_DIR, "styles.css"), css, "utf8");

  // Copy static assets (e.g. images) into the build output.
  try {
    await copyDir(ASSETS_DIR, path.join(BUILD_DIR, "assets"));
  } catch (err) {
    if (err?.code !== "ENOENT") throw err;
  }

  const langs = await detectLanguages();
  const pagesByLang = new Map(); // lang -> pages[] (sorted, first = home)
  const pagesByLangAndSourceRel = new Map(); // `${lang}:${sourceRel}` -> page

  for (const lang of langs) {
    const langSrcDir = path.join(SRC_ROOT, lang);
    const mdFiles = await listMarkdownFiles(langSrcDir);

    const pages = [];
    for (const file of mdFiles) {
      const raw = await fs.readFile(file, "utf8");
      const { title, body } = stripFirstH1(raw);
      const fallbackTitle = path.basename(file, path.extname(file));
      const sourceRel = path.relative(langSrcDir, file);
      const relDir = path.dirname(sourceRel);
      const topLevelDir = relDir === "." ? null : relDir.split(path.sep)[0];

      pages.push({
        lang,
        inputPath: file,
        sourceRel,
        outputRelPath: toOutputRelPath(langSrcDir, file),
        title: title ?? fallbackTitle,
        markdownBody: body,
        topLevelDir,
      });
    }

    // Order comes from the filename (numeric prefix), not from the title.
    pages.sort((a, b) =>
      a.sourceRel.localeCompare(b.sourceRel, "en", { numeric: true }),
    );

    const outputs = new Set();
    for (const p of pages) {
      if (outputs.has(p.outputRelPath)) {
        throw new Error(
          `Two pages in "${lang}" map to the same output file: ${p.outputRelPath}`,
        );
      }
      outputs.add(p.outputRelPath);
    }

    pagesByLang.set(lang, pages);
    for (const p of pages) {
      pagesByLangAndSourceRel.set(`${lang}:${p.sourceRel}`, p);
    }
  }

  // Build each language into docs/build/<lang>/
  for (const lang of langs) {
    const pages = pagesByLang.get(lang);
    const langOutDir = path.join(BUILD_DIR, lang);
    await ensureDir(langOutDir);

    // The first page in sort order is the home page.
    const homeRelPath = pages[0].outputRelPath;

    // Sidebar groups in order of first appearance (i.e. sort order).
    const groups = new Map(); // dir -> pages[]
    for (const p of pages) {
      const key = p.topLevelDir ?? "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }
    const sortedGroupKeys = Array.from(groups.keys());

    for (const page of pages) {
      const sidebar = sortedGroupKeys
        .map((groupKey) => {
          const sectionTitle = folderTitleFromDir(groupKey);
          const header = sectionTitle
            ? `<div class="nav__section">${escapeHtml(sectionTitle)}</div>`
            : "";

          const items = groups
            .get(groupKey)
            .map((p) => {
              const current = p.outputRelPath === page.outputRelPath;
              const ariaCurrent = current ? ` aria-current="page"` : "";
              const href = toHref(page.outputRelPath, p.outputRelPath);
              return `  <li><a href="${escapeHtml(href)}"${ariaCurrent}>${escapeHtml(
                p.title,
              )}</a></li>`;
            })
            .join("\n");

          return `${header}<ul>\n${items}\n</ul>`;
        })
        .join("\n");

      const langToHref = {};
      for (const otherLang of langs) {
        const other = pagesByLangAndSourceRel.get(
          `${otherLang}:${page.sourceRel}`,
        );
        const otherHome = pagesByLang.get(otherLang)[0].outputRelPath;
        const targetRel = other?.outputRelPath ?? otherHome;

        const fromLangPage = path.join(lang, page.outputRelPath);
        const toLangPage = path.join(otherLang, targetRel);
        langToHref[otherLang] = toHref(fromLangPage, toLangPage);
      }

      const languageSwitch = renderLanguageSwitch({
        langs,
        currentLang: lang,
        langToHref,
      });

      const contentHtml = marked.parse(page.markdownBody);

      const outFileAbs = path.join(langOutDir, page.outputRelPath);
      await ensureDir(path.dirname(outFileAbs));

      const cssHref = toHref(path.join(lang, page.outputRelPath), "styles.css");

      const html = template
        .replaceAll("{{htmlLang}}", escapeHtml(lang))
        .replaceAll("{{title}}", escapeHtml(page.title))
        .replaceAll("{{sidebar}}", sidebar)
        .replaceAll("{{content}}", contentHtml)
        .replaceAll(
          "{{homeHref}}",
          escapeHtml(toHref(page.outputRelPath, homeRelPath)),
        )
        .replaceAll("{{cssHref}}", escapeHtml(cssHref))
        .replaceAll("{{languageSwitch}}", languageSwitch);

      await fs.writeFile(outFileAbs, html, "utf8");
    }

    // Language index.html redirects to the home page (avoids relative-path issues).
    const homeUrl = `./${encodeURI(homeRelPath.split(path.sep).join("/"))}`;
    await fs.writeFile(
      path.join(langOutDir, "index.html"),
      redirectPage(homeUrl),
      "utf8",
    );
  }

  // Root index.html redirects to the default language, or the first one that exists.
  const rootIndex =
    langs.length === 0
      ? `<!doctype html><meta charset="utf-8"><title>SNT Explorer Documentation</title><p>No pages yet.</p>`
      : redirectPage(`./${langs.includes(DEFAULT_LANG) ? DEFAULT_LANG : langs[0]}/index.html`);
  await fs.writeFile(path.join(BUILD_DIR, "index.html"), rootIndex, "utf8");

  process.stdout.write(
    `Built docs into ${path.relative(process.cwd(), BUILD_DIR)} ` +
      `(languages: ${langs.join(", ") || "none"}; pages: ${Array.from(
        pagesByLang.values(),
      ).reduce((n, p) => n + p.length, 0)})\n`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
