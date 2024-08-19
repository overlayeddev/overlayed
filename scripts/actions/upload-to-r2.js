import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const { R2_BUCKET, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;

const client = new S3Client({
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  region: "auto",
});

const ASSET_DIR = "assets";

/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export const script = async ({ github, context }, channel) => {
  // make the artifact directory if it doesn't exist
  fs.mkdirSync(ASSET_DIR, { recursive: true });

  if (channel === "canary") {
    await uploadCanaryArtifacts({ github, context });
  }

  if (channel === "stable") {
    await uploadStableArtifacts({ github, context });
  }
};

/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
async function uploadStableArtifacts({ github, context }) {
  console.log(`[${context.ref}] Fetching release...`);
  const release = await github.rest.repos.getReleaseByTag({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag: context.ref,
  });

  const artifacts = release.data.assets;

  console.log(`[${context.ref}] Found ${artifacts.length} artifacts in the release`);

  const releaseBinDir = path.join(ASSET_DIR, context.ref);

  // make the dir for version
  fs.mkdirSync(releaseBinDir, { recursive: true });

  // // download all the artifacts from the build
  for (const artifact of artifacts) {
    console.log(`[${context.ref}] Downloading stable artifact ${artifact.name}`);
    fetch(artifact.browser_download_url)
      .then(res => res.arrayBuffer())
      .then(data => {
        fs.writeFileSync(path.join(releaseBinDir, `${artifact.name}`), Buffer.from(data));
      });
  }

  // upload to r2
  for (const file of fs.readdirSync(releaseBinDir)) {
    const assetFilePath = path.join(releaseBinDir, file);
    const fileStream = fs.createReadStream(assetFilePath);

    const uploadBinsCommand = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: `stable/${context.ref}/${file}`,
      Body: fileStream,
    });

    await client.send(uploadBinsCommand);

    console.log(`[${context.ref}] ${file} uploaded successfully`);
  }
}

/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
async function uploadCanaryArtifacts({ github, context }) {
  const artifacts = await github.rest.actions.listWorkflowRunArtifacts({
    owner: context.repo.owner,
    repo: context.repo.repo,
    run_id: context.runId || "10445719576",
  });

  // download all the artifacts from the build
  for (const artifact of artifacts.data.artifacts) {
    console.log(`Downloading ${artifact.name}...`);
    const { data } = await github.rest.actions.downloadArtifact({
      owner: context.repo.owner,
      repo: context.repo.repo,
      artifact_id: artifact.id,
      archive_format: "zip",
    });

    fs.writeFileSync(path.join(ASSET_DIR, `${artifact.name}`), Buffer.from(data));
  }

  console.log("Starting upload to R2...");

  try {
    for (const file of fs.readdirSync(ASSET_DIR)) {
      const assetFilePath = path.join(ASSET_DIR, file);
      const fileStream = fs.createReadStream(assetFilePath);

      const uploadBinsCommand = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: `canary/${file}`,
        Body: fileStream,
      });

      await client.send(uploadBinsCommand);

      console.log(`${assetFilePath} uploaded successfully`);
    }

    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: `canary/latest.json`,
        Body: JSON.stringify({ latestVersion: context.sha, updatedAt: new Date().toISOString() }),
      })
    );
  } catch (err) {
    console.log(err);
  }
}
