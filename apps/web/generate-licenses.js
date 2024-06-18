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
console.log(__dirname);
const licenseOutput = execSync(
  `pnpm licenses --filter=desktop --prod list --json`,
  { encoding: 'utf-8' }
);

console.log(licenseOutput);

// write the string to the licenses.json file
fs.writeFileSync(
  path.join(__dirname, "src", "__generated__", "licenses.json"),
  licenseOutput
);