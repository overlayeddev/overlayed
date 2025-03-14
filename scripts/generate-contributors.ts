import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Octokit } from "octokit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getOcto() {
  if (!process.env.GITHUB_TOKEN) {
    console.error("No GitHub token provided. Please set GITHUB_TOKEN env var.");
    process.exit(1);
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  // get paginated contributors
  const res = await octokit.paginate(octokit.rest.repos.listContributors, {
    owner: "overlayeddev",
    repo: "overlayed",
    per_page: 100,
  });

  const contributors = res.map(contributor => contributor).filter(contributor => contributor.type !== "Bot");
  return contributors;
}

async function start() {
  const contributors = await getOcto();

  const text = [
    "// prettier-ignore",
    "// eslint-disable",
    `export const contributors = ${JSON.stringify(contributors, null, 4)}`,
    "",
  ].join("\n");

  const dir = path.join(__dirname, "../apps/web/src");
  await fs.writeFile(`${dir}/contributors.ts`, text);

  // download all the avatars as well
  const avatarsDir = path.join(dir, "assets", "avatars");
  await fs.mkdir(avatarsDir, { recursive: true });

  for (const contributor of contributors) {
    if (contributor.avatar_url) {
      const avatar = await fetch(contributor.avatar_url).then(res => res.blob());
      const arrayBuffer = await new Response(avatar).arrayBuffer();
      await fs.writeFile(`${avatarsDir}/${contributor.login?.toLowerCase()}.png`, Buffer.from(arrayBuffer));
    }
  }
}

start();
