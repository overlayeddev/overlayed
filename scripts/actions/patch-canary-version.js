import fs from "node:fs";

/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export const script = async ({ context, github }) => {
  // get the current commit sha
  const commitSha = context?.sha || "dev";

  // read the apps/desktop/src-tauri/tauri.conf.canary.json
  const currentFileJson = JSON.parse(fs.readFileSync("apps/desktop/src-tauri/tauri.conf.canary.json", "utf8"));

  // patched version
  const patchVersionName = `0.0.0-canary.${commitSha.slice(0, 7)}`;

  // patch it with the new version
  currentFileJson["package"]["version"] = patchVersionName;

  // write it back to the file
  fs.writeFileSync("apps/desktop/src-tauri/tauri.conf.canary.json", JSON.stringify(currentFileJson, null, 2));
};
