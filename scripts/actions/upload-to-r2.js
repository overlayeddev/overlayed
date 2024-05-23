// TODO: upload the nightly bins to r2
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
export const script = async ({ context, github }, paths) => {
  console.log("TODO: impl this");
  console.log("Paths:", paths);

  // add something to the bucket
  await S3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: "test.txt",
    Body: "Hello World!",
  }));
};
