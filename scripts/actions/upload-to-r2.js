import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const { R2_BUCKET, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;

/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export const script = async ({ github, context }, assetDir) => {
  // make the artifact directory if it doesn't exist
  fs.mkdirSync(assetDir, { recursive: true });
  
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

    fs.writeFileSync(path.join(assetDir, `${artifact.name}`), Buffer.from(data));
  }

  console.log("Starting upload to R2...");
  const client = new S3Client({
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    region: "auto",
  });

  try {
    for (const file of fs.readdirSync(assetDir)) {
      const assetFilePath = path.join(assetDir, file);
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
};
