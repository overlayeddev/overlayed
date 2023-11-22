// local testing:
// op run --env-file .env -- npx tsx scripts/download-draft-bins.ts 131013514
import fs from "node:fs";

import { Readable } from "stream";
import { finished } from "stream/promises";

const { GITHUB_TOKEN } = process.env;

if(!GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN not set")
}

async function downloadFile(url: string, filepath = "./download") {
  const response = await fetch(url, {
    headers: {
      Accept: "application/octet-stream",
      Authorization: `token ${GITHUB_TOKEN}`,
    },
  });
  // @ts-ignore
  const body = Readable.fromWeb(response.body);
  const downloadWriteStream = fs.createWriteStream(filepath);
  await finished(body.pipe(downloadWriteStream));
}

const BINARIES_DIR = "binaries";
const main = async () => {
  // get first param to script
  const id = process.argv[2];

  console.log(`📦 downloading release artifacts for ${id}`);

  try {
    const draftData = await fetch(
      `https://api.github.com/repos/Hacksore/overlayed/releases/${id}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `token ${GITHUB_TOKEN}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    ).then((res) => res.json());

    console.log(draftData);

    // download all the assets to the current directory
    const assets = draftData.assets;

    // make binaries dir if it doesn't exist
    if (!fs.existsSync(BINARIES_DIR)) {
      fs.mkdirSync(BINARIES_DIR);
    }

    for (const asset of assets) {
      const url = asset.browser_download_url;
      const filename = asset.name;
      // skip non windows bins
      if (![".msi", ".exe"].some((ext) => filename.endsWith(ext))) {
        continue;
      }

      console.log(`Downloading ${filename}`);
      // download the file to the binaries folder
      downloadFile(
        `https://api.github.com/repos/Hacksore/overlayed/releases/assets/${asset.id}`,
        `./${BINARIES_DIR}/${filename}`,
      );
    }
  } catch (err) {
    console.log(err);
  }
};

main();
