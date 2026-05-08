import fs from "fs";

const RELEASE_ARTIFACTS_DIR = "./release-artifacts";

/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export const script = async ({ context, github }, releaseId) => {
  console.log("📦 Uploading release artifacts for release id", releaseId);
  console.log({ cwd: process.cwd() });

  if (!fs.existsSync(RELEASE_ARTIFACTS_DIR)) {
    console.log("No release artifacts found");
    return;
  }

  const files = fs.readdirSync(RELEASE_ARTIFACTS_DIR);
  console.log("Files to upload:", files);

  const errors = [];

  for (const file of files) {
    const filePath = `${RELEASE_ARTIFACTS_DIR}/${file}`;
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      continue;
    }

    const fileData = fs.readFileSync(filePath);
    console.log("uploading asset", file, filePath);

    try {
      const { data: uploadResponse } = await github.rest.repos.uploadReleaseAsset({
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: releaseId,
        data: fileData,
        name: file,
      });

      console.log("uploaded asset", uploadResponse.name, uploadResponse.id);
    } catch (error) {
      console.error("error uploading asset", file, error.message);
      errors.push(`${file}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Failed to upload ${errors.length} asset(s):\n${errors.join("\n")}`);
  }
};
