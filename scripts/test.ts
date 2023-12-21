// test local script
// op run --env-file .env -- npx tsx scripts/test.ts <script>
import { getOctokit, context } from "@actions/github";

// @ts-ignore
import { script as uploadSignedBins } from "./actions/upload-signed-bins.js";
// @ts-ignore
import { script as downloadDraftBins } from "./actions/download-draft-bins.js";

const { GITHUB_TOKEN } = process.env;
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not found");

// get first arg
const [arg] = process.argv.slice(2);

process.env.GITHUB_REPOSITORY = "Hacksore/overlayed";

// create context mock
const github = getOctokit(GITHUB_TOKEN);

// get the latest draftId from releases
const releases = await github.rest.repos.listReleases({
  owner: context.repo.owner,
  repo: context.repo.repo,
});

const draft = releases.data.find((release) => release.draft);
if (!draft) throw new Error("No draft found");
const draftId = draft.id;

switch (arg) {
  case "upload":
    await uploadSignedBins({ github, context }, draftId);
    break;
  default:
    console.log("No script found, accepted answers are: create, download, upload");
}
