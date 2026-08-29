/**
 * Verifies the production build works under a simulated GitHub Pages
 * repository subpath (todo.md Task 1).
 *
 * Usage: npm run build && npm run verify:subpath
 *
 * Checks:
 *  1. dist/index.html references assets under the configured base path.
 *  2. Serving dist/ at the /<base>/ prefix serves index.html and its assets
 *     with HTTP 200.
 *  3. No asset references leak outside the subpath prefix.
 *
 * Exit code 0 means the Pages subpath build contract holds.
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const distDir = join(root, "dist");
const basePath = process.env.VITE_BASE_PATH ?? "/ml-prep/";
const port = Number(process.env.VERIFY_SUBPATH_PORT ?? 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

let failures = 0;
function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}
function pass(message) {
  console.log(`ok:  ${message}`);
}

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://localhost:${port}`);
      let pathname = decodeURIComponent(url.pathname);
      if (!pathname.startsWith(basePath)) {
        res.writeHead(404).end("not under subpath");
        return;
      }
      pathname = pathname.slice(basePath.length) || "/";
      const filePath = normalize(join(distDir, pathname));
      if (!filePath.startsWith(distDir + sep) && filePath !== distDir) {
        res.writeHead(403).end("forbidden");
        return;
      }
      let target = filePath;
      try {
        const s = await stat(target);
        if (s.isDirectory()) target = join(target, "index.html");
      } catch {
        res.writeHead(404).end("not found");
        return;
      }
      const body = await readFile(target);
      res.writeHead(200, { "content-type": MIME[extname(target)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(500).end("server error");
    }
  });
  return new Promise((resolvePromise) => {
    server.listen(port, "127.0.0.1", () => resolvePromise(server));
  });
}

async function fetchText(path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  return { res, text: await res.text() };
}

const server = await startServer();
try {
  // 1. index.html served under the subpath.
  const index = await fetchText(basePath);
  if (index.res.status !== 200) {
    fail(`GET ${basePath} returned ${index.res.status}, expected 200`);
  } else {
    pass(`GET ${basePath} returns 200`);
  }

  // 2. Every referenced local asset resolves under the subpath.
  const assetRefs = [...index.text.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1]);
  if (assetRefs.length === 0) {
    fail("index.html references no root-relative assets; base may be wrong");
  } else {
    pass(`index.html references ${assetRefs.length} root-relative asset(s)`);
  }
  for (const ref of assetRefs) {
    if (!ref.startsWith(basePath)) {
      fail(`asset reference ${ref} is outside the subpath base ${basePath}`);
      continue;
    }
    const asset = await fetchText(ref);
    if (asset.res.status !== 200) {
      fail(`asset ${ref} returned ${asset.res.status}, expected 200`);
    } else {
      pass(`asset ${ref} served with 200`);
    }
  }

  const worker = await fetchText(`${basePath}sw.js`);
  for (const ref of assetRefs.filter((ref) => ref.includes("/assets/"))) {
    const relative = `./${ref.slice(ref.indexOf("assets/"))}`;
    if (!worker.text.includes(relative)) fail(`service worker does not precache ${relative}`);
  }
  if (worker.text.includes('var SHELL_URLS = ["./", "./manifest.webmanifest", "./icon.svg"]')) {
    fail("service worker still contains the unexpanded development shell list");
  } else {
    pass("service worker precaches generated application assets");
  }

  // 3. Deep-link with hash routing needs only the root document; assert the
  // server does not 404 on the root path (the SPA contract for hash routing).
  const deep = await fetchText(`${basePath}?direct=${encodeURIComponent("#/plan")}`);
  if (deep.res.status !== 200) {
    fail(`GET ${basePath} (deep link target) returned ${deep.res.status}, expected 200`);
  } else {
    pass("deep-link root document served with 200");
  }
} finally {
  server.close();
}

if (failures > 0) {
  console.error(`verify:subpath failed with ${failures} failure(s)`);
  process.exit(1);
}
console.log("verify:subpath passed");
