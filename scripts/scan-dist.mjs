/**
 * Scans the built dist/ artifact for privileged secrets and private data
 * before it is allowed to be uploaded (todo.md Task 17 hardens this further;
 * this early version covers the high-signal patterns).
 *
 * Fails (exit 1) when any pattern matches. Intentionally conservative:
 * false positives are fixed by restructuring code, not by weakening checks.
 */

import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const distDir = join(process.cwd(), "dist");

const PATTERNS = [
  {
    name: "Supabase service-role key (JWT starting with service role header)",
    re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  },
  {
    name: "Generic high-entropy secret assignment",
    re: /\b(SERVICE_ROLE|SUPABASE_SERVICE|ADMIN_KEY|PRIVATE_KEY|SECRET_KEY|API_SECRET)\s*[:=]/i,
  },
  {
    name: "Postgres connection string with credentials",
    re: /postgres(ql)?:\/\/[^\s"']*:[^\s"']*@/,
  },
];

// Private progress terms that must never be baked into the public bundle.
const PRIVATE_TERMS = ["Mohammed", "Saidul", "ivlr"];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(p)));
    else files.push(p);
  }
  return files;
}

const files = await walk(distDir);
let failures = 0;
for (const file of files) {
  const ext = extname(file);
  if (![".js", ".css", ".html", ".json", ".webmanifest", ".svg"].includes(ext)) continue;
  const content = await readFile(file, "utf8");
  for (const { name, re } of PATTERNS) {
    if (re.test(content)) {
      console.error(`FAIL: ${name} found in ${file}`);
      failures += 1;
    }
  }
  for (const term of PRIVATE_TERMS) {
    if (content.includes(term)) {
      console.error(`FAIL: private term "${term}" found in ${file}`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`scan-dist failed with ${failures} finding(s)`);
  process.exit(1);
}
console.log(`scan-dist passed (${files.length} files checked)`);
