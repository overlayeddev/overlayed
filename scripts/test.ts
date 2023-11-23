// test local script
// op run --env-file .env -- npx tsx scripts/test.ts <script>
import { getOctokit, context } from "@actions/github";

// @ts-ignore
import { script as signScript } from "./actions/sign.js";
// @ts-ignore
import { script as dlScript } from "./actions/download-draft-bins.js";
// @ts-ignore
import { script as createScript } from "./actions/create-release.js";

const { GITHUB_TOKEN } = process.env;
if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not found");

// get first arg
const [arg] = process.argv.slice(2);

process.env.GITHUB_REPOSITORY = "Hacksore/overlayed";

const draftId = "131045109";

// create context
const github = getOctokit(GITHUB_TOKEN);

switch (arg) {
  case "create":
    await createScript({ github, context });
    break;
  case "dl":
    await dlScript({ github, context }, draftId);
    break;
  case "sign":
    await signScript({ github, context }, draftId);
    break;
  default:
    console.log("No script found");
}
