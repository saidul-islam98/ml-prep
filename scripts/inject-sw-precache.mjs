import { readFile, writeFile } from "node:fs/promises";

const dist = new URL("../dist/", import.meta.url);
const index = await readFile(new URL("index.html", dist), "utf8");
const swPath = new URL("sw.js", dist);
const sw = await readFile(swPath, "utf8");

const urls = new Set(["./", "./manifest.webmanifest", "./icon.svg", "./sw-rules.js"]);
for (const match of index.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const value = match[1];
  if (/^(?:https?:|data:|#)/.test(value)) continue;
  const assetIndex = value.indexOf("assets/");
  if (assetIndex >= 0) urls.add(`./${value.slice(assetIndex)}`);
}

const marker = /\/\* __ML_PREP_PRECACHE__ \*\/ \[[^\]]*\]/;
if (!marker.test(sw)) throw new Error("service-worker precache marker is missing");
await writeFile(
  swPath,
  sw.replace(marker, `/* __ML_PREP_PRECACHE__ */ ${JSON.stringify([...urls])}`),
);
console.log(`Injected ${urls.size} service-worker precache URLs into dist/sw.js`);
