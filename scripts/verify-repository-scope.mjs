import { existsSync } from "node:fs";

if (existsSync(".agents")) {
  console.error(
    "Repository scope failed: .agents is a vendored tool payload, not application code.",
  );
  process.exit(1);
}

console.log("REPOSITORY SCOPE OK");
