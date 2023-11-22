import fs from "fs";
const releaseId = "${{ needs.create-release.outputs.release_id }}";

const SIGNED_BINARIES_DIR = "binaries/signed";

/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export const script = async ({ context, github }) => {
  console.log("🔍 Start sign of windows binaries...");

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

    const { data: uploadResponse } = await github.rest.repos.uploadReleaseAsset(
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: releaseId,
        // @ts-ignore
        data: fileData,
        name: file,
      },
    );

    console.log(uploadResponse);
  }
};
