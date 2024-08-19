import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const { R2_BUCKET, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;

// TODO: expand this to support the stable version too
export const script = async ({ context, assetDir }) => {
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
        Key: `canary/${file.replace(".zip", "")}`,
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
