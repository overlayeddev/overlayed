import fs from "fs";
const SIGNED_BINARIES_DIR = "./binaries/signed";

/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export const script = async ({ context, github }, releaseId) => {
  console.log("🔍 Start sign of windows binaries for release id", releaseId);
  console.log({ cwd: process.cwd() });

  if (!fs.existsSync(SIGNED_BINARIES_DIR)) {
    console.log("No signed binaries found");
    return;
  }

  const files = fs.readdirSync(SIGNED_BINARIES_DIR);

  const { data } = await github.rest.repos.listReleases({
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  const [latestRelease] = data;

  for (const asset of latestRelease?.assets ?? []) {
    // skip if the asset doesnt end with msi or exe
    if (![".msi", ".exe"].some((ext) => asset.name.endsWith(ext))) {
      continue;
    }

    console.log("deleting asset", asset.name, asset.id);
    await github.rest.repos.deleteReleaseAsset({
      owner: context.repo.owner,
      repo: context.repo.repo,
      release_id: releaseId,
      asset_id: asset.id,
    });
  }

  for (const file of files) {
    const filePath = `${SIGNED_BINARIES_DIR}/${file}`;
    const fileData = fs.readFileSync(filePath);

    console.log("uploading asset", file, filePath);

    try {
      const { data: uploadResponse } =
        await github.rest.repos.uploadReleaseAsset({
          owner: context.repo.owner,
          repo: context.repo.repo,
          release_id: releaseId,
          data: fileData,
          name: file,
        });

      console.log("uploaded asset", uploadResponse.name, uploadResponse.id);
    } catch (error) {
      console.log("error uploading asset", error.message);
    }
  }
};
