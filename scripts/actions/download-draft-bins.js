import fs from "fs";

const { GITHUB_TOKEN } = process.env;

async function downloadFile(url, filepath = "./download") {
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

/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
/** @param id {String} */
export const script = async ({ context, github }, id) => {

  console.log(`📦 downloading release artifacts for ${id}`);

  try {
    const { data: draftData } = await github.rest.repos.getRelease({
      owner: context.repo.owner,
      repo: context.repo.repo,
      release_id: id,
    });

    console.log(draftData);

    // download all the assets to the current directory
    const assets = draftData.assets;

    // make binaries dir if it doesn't exist
    if (!fs.existsSync(BINARIES_DIR)) {
      fs.mkdirSync(BINARIES_DIR);
    }

    for (const asset of assets) {
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
