import fs from "node:fs";
import path from "node:path";

/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export const script = async ({ context, github }) => {
  // get the current commit sha
  const commitSha = context?.sha || "dev";

  // make the file path work on all platforms
  const tauriConfig = path.join("apps", "desktop", "src-tauri", "tauri.conf.canary.json");

  // read the apps/desktop/src-tauri/tauri.conf.canary.json
  const currentFileJson = JSON.parse(fs.readFileSync(tauriConfig, "utf8"));

  // patched version
  const patchVersionName = `0.0.0-canary.${commitSha.slice(0, 7)}`;

  // patch it with the new version
  currentFileJson["version"] = patchVersionName;

  // write it back to the file
  fs.writeFileSync(tauriConfig, JSON.stringify(currentFileJson, null, 2));
};
