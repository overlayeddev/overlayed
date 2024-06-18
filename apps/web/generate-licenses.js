import fs from "node:fs";
import path from "node:path";
import { execSync } from "child_process";
console.log("Attempting to generate licenses...");

try {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);

  console.log("creating __generated__ directory if not exists...");
  // create the __generated__ directory
  fs.mkdirSync(path.join("src", "__generated__"), {
    recursive: true,
  });

  console.log(
    "Running command to generate licenses: pnpm licenses --filter=desktop --prod list --json",
  );
  // run the command to generate the licenses
  const licenseOutput = execSync(
    "pnpm licenses --filter=desktop --prod list --json",
    { encoding: "utf-8" },
  );

  console.log("writing all the license information to licenses.json file...");
  // write the string to the licenses.json file
  fs.writeFileSync(
    path.join(__dirname, "src", "__generated__", "licenses.json"),
    licenseOutput,
  );

  console.log("🥳 Licenses generated successfully!");
} catch (error) {
  console.error("Failed to generate licenses:", error);
}
