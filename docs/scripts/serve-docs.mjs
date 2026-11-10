// Tiny static server for the generated site (docs/build/). Local preview only.
import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = path.resolve(__dirname, "..", "build");
const PORT = Number(process.env.PORT) || 8000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let filePath = path.join(BUILD_DIR, path.normalize(urlPath));
    if (!filePath.startsWith(BUILD_DIR + path.sep) && filePath !== BUILD_DIR) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    let stat = await fs.stat(filePath).catch(() => null);
    if (stat?.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      stat = await fs.stat(filePath).catch(() => null);
    }
    if (!stat?.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }

    const body = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
      "Content-Length": body.length,
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500).end("Server error");
    console.error(err);
  }
});

// Bind to localhost only: this is a preview, not a public server.
server.listen(PORT, "127.0.0.1", () => {
  process.stdout.write(`Serving docs/build/ at http://localhost:${PORT}/ (Ctrl+C to stop)\n`);
});
