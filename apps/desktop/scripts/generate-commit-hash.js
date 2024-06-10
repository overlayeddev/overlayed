// generate the commit hash for the current git commit
// and write it to a file in src/__generated__/commit-hash.ts
import fs from "fs";
import { execSync } from "child_process";

const barGeneratedDir = "src/__generated__";

const commitHash = execSync("git rev-parse HEAD").toString().trim();
const commitHashFile = "src/__generated__/commit-hash.ts";

// make sure the directory exists
if (!fs.existsSync(barGeneratedDir)) {
  fs.mkdirSync(barGeneratedDir);
}

fs.writeFileSync(`${commitHashFile}`, `export const commitHash = "${commitHash}";`);
