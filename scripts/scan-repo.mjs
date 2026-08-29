/**
 * Repository secret scan (todo.md Task 17): scans every git-tracked file for
 * privileged-secret patterns and private progress data. The synchronized
 * spec/plan documents intentionally describe the plan's owner in the third
 * person; personal *progress* (tasks, notes, evidence) must never appear.
 *
 * Usage: node scripts/scan-repo.mjs
 */

import { execSync } from "node:child_process";

const tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean);

const SECRET_PATTERNS = [
  {
    name: "Supabase service-role style JWT",
    re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  },
  // Values like "env(SOME_NAME)" are indirections, not secrets.
  {
    name: "Secret key variable",
    re: /\b(SERVICE_ROLE_KEY|SUPABASE_SERVICE|SECRET_KEY|API_SECRET|PRIVATE_KEY)\s*[:=]\s*["'](?!env\()[^"']+["']/i,
  },
  { name: "Postgres connection string with password", re: /postgres(ql)?:\/\/[^\s"']*:[^\s"']*@/ },
  { name: "sb_secret_ key", re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
];

let failures = 0;
for (const file of tracked) {
  let content;
  try {
    content = execSync(`git show "HEAD:${file.replace(/"/g, '\\"')}"`, {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch {
    continue; // binary or unavailable
  }
  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(content)) {
      console.error(`FAIL: ${name} found in ${file}`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`scan-repo failed with ${failures} finding(s)`);
  process.exit(1);
}
console.log(`scan-repo passed (${tracked.length} tracked files checked)`);
