import { getOctokit } from "@actions/github";
import fs from "node:fs";

const { GITHUB_TOKEN } = process.env;
if (!GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN not set");
}

const releaseId = 131045109;
const octokit = getOctokit(GITHUB_TOKEN);

// read all files from the binariees dir
const files = fs.readdirSync("./binaries");

const { data } = await octokit.rest.repos.listReleases({
  owner: "Hacksore",
  repo: "overlayed",
});

const [latestRelease] = data;

for (const asset of latestRelease?.assets ?? []) {
  // skip if the asset doesnt end with msi or exe
  if (![".msi", ".exe"].some((ext) => asset.name.endsWith(ext))) {
    continue;
  }

  console.log("deleting asset", asset.name, asset.id);
  await octokit.rest.repos.deleteReleaseAsset({
    owner: "Hacksore",
    repo: "overlayed",
    release_id: releaseId,
    asset_id: asset.id,
  });
}

for (const file of files) {
  const filePath = `./binaries/${file}`;
  const fileData = fs.readFileSync(filePath);

  const { data: uploadResponse } = await octokit.rest.repos.uploadReleaseAsset({
    owner: "Hacksore",
    repo: "overlayed",
    release_id: releaseId,
    // @ts-ignore
    data: fileData,
    name: file,
  });

  console.log(uploadResponse);
}
