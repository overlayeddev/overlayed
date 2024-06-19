import fs from "node:fs";
import path from "node:path";
import { execSync } from "child_process";
console.log("Attempting to generate licenses...");

// it might work now
try {
  // root monorepo dir
  const __dirname = path.dirname(new URL(import.meta.url).pathname);

  console.log("Monorepo dir:", __dirname);

  console.log("Creating __generated__ directory if not exists...");
  // create the __generated__ directory
  fs.mkdirSync(path.join("src", "__generated__"), {
    recursive: true,
  });

  console.log(
    "Running command to generate licenses: pnpm licenses",
  );
  // run the command to generate the licenses
  const licenseOutput = execSync(
    "pnpm licenses --filter=desktop --prod --no-optional list --json",
    { encoding: "utf-8" },
  );

  const parsedLicensesMap = JSON.parse(licenseOutput || "{}");
  console.log(Object.keys(parsedLicensesMap));

  console.log("Writing all the license information to licenses.json file...");
  // write the string to the licenses.json file
  fs.writeFileSync(
    path.join(__dirname, "src", "__generated__", "licenses.json"),
    licenseOutput,
  );

  console.log("🥳 Licenses generated successfully!");
} catch (error) {
  console.error("Failed to generate licenses:", error);
}
