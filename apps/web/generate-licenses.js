import fs from "node:fs";
import path from "node:path";
import { execSync } from "child_process";
console.log("Generating licenses...");

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// create the __generated__ directory
fs.mkdirSync(path.join("src", "__generated__"), {
  recursive: true,
});

// run the command to generate the licenses
const dir = path.resolve(path.join(__dirname, "../../"));
console.log(__dirname);
const licenseOutput = execSync(
  `pnpm licenses --filter=desktop --prod list --json`,
  { stdio: "inherit", shell: true },
);

console.log(licenseOutput.toString());
