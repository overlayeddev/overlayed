import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "node:fs";
import path from "node:path";

// get r2 credentials
const { R2_BUCKET, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export const script = async ({ context, github }, paths, os = "mac") => {
  if (typeof paths === "string") {
    paths = paths.split(",");
  }

  // parse the paths
  const files = paths.map(path => path.trim());

  console.log("Files:", files);
  for (const f of files) {
    const fileData = await fs.readFile(f);
    const fileName = f.split(path.sep).pop();

    // TODO: zip the .app and upload to r2 but for now skip it so we can cook
    if (fileName.endsWith(".app")) {
      console.log(`Skipping ${fileName} as we need to add support for zipping .app files.`);
      continue;
    }

    console.log(`Uploading ${fileName} to ${R2_BUCKET}`);
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: `${os}/${fileName}`,
      Body: fileData,
    });

    try {
      await S3.send(command);
    } catch (e) {
      console.error(`Failed to upload ${fileName} to ${R2_BUCKET}: ${e}`);
    }
  }
};
