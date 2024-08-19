// test local script
// op run --env-file .env -- npx tsx scripts/test.ts <script>
import { getOctokit, context } from "@actions/github";

// @ts-ignore
import { script as uploadSignedBins } from "./actions/upload-signed-bins.js";
// @ts-ignore
import { script as downloadDraftBins } from "./actions/download-draft-bins.js";
// @ts-ignore
import { script as createRelease } from "./actions/create-release.js";
// @ts-ignore
import { script as patchCanaryVersion } from "./actions/patch-canary-version.js";
// @ts-ignore
import { script as uploadBinsToR2 } from "./actions/upload-to-r2.js";

const { GITHUB_TOKEN } = process.env;
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not found");

// all args as an array
const args = process.argv.slice(2);

// get first arg
const [arg] = args;

process.env.GITHUB_REPOSITORY = "overlayeddev/overlayed";

// create context mock
const github = getOctokit(GITHUB_TOKEN);

// get the latest draftId from releases
const releases = await github.rest.repos.listReleases({
  owner: context.repo.owner,
  repo: context.repo.repo,
});

const draft = releases.data.find(release => release.draft);
if (!draft) throw new Error("No draft found");
const draftId = draft.id;

switch (arg) {
  case "create":
    await createRelease({ github, context });
    break;
  case "download":
    await downloadDraftBins({ github, context }, draftId);
    break;
  case "upload":
    await uploadSignedBins({ github, context }, draftId);
    break;
  case "canary":
    await patchCanaryVersion({ github, context });
    break;
  case "upload-canary":
    await uploadBinsToR2({ github, context }, "canary");
    break;
  case "upload-stable":
    context.ref = "v0.5.0";
    await uploadBinsToR2({ github, context }, "stable");
    break;
  default:
    console.log("No script found, accepted answers are: create, download, upload, upload-stable, upload-canary");
}
