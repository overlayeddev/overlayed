import { Artifacts, Bindings, Request, WorkflowRuns } from "../types.js";
import { GITHUB_REPO, GITHUB_USER } from "../constants.js";
import { Hono } from "hono/quick";
import { WorkflowRunEvent } from "@octokit/webhooks-types";
import { Webhooks } from "@octokit/webhooks";
import { filenameToPlatform, getLatestRelease, isProd } from "../utils.js";

const app = new Hono<{ Bindings: Bindings }>();

app.post("/webhook", async (c) => {
	const webhooks = new Webhooks({
		secret: c.env.CANARY_UPLOAD_SECRET,
	});

	const isProduction = isProd(c.req.url);
	const body = (await c.req.json()) as WorkflowRunEvent;
	const bodyAsString = JSON.stringify(body);
	const signature = c.req.header("x-hub-signature-256") || "";

	const isSuccesfulRun =
		body.action === "completed" && body.workflow_run.conclusion === "success";

	// only enable this is production!
	if (isProduction && !(await webhooks.verify(bodyAsString, signature))) {
		return c.json({ error: "Unauthorized" });
	}

	if (!isSuccesfulRun) {
		return c.json({ error: "Not a successful run" });
	}

	console.log("Webhook received", body.workflow.name);

	if (body.workflow.name === "Canary") {
		return await uploadCanaryArtifact({ c });
	}

	if (body.workflow.name === "Create Release") {
		return await uploadStableArtifact({ c, body });
	}

	return c.json({ error: "Unable to handle webhook" });
});

// TODO: we need to make this only work on a new tag create
async function uploadStableArtifact({
	c,
	body,
}: {
	c: Request;
	body: WorkflowRunEvent;
}) {
	const releases = await getLatestRelease(c.env.GITHUB_TOKEN);

	const latesetVersion = releases.tag_name;

	const versions = releases.assets
		.map((asset) => ({
			name: asset.name,
			url: asset.browser_download_url,
			platform: filenameToPlatform(asset.name),
		}))
		.filter((asset) => asset.name.match(/\.(dmg|msi|AppImage)$/));

	// upload all the files to r2 in the stable folder
	for (const asset of versions) {
		const fileData = await fetch(asset.url).then((res) => res.arrayBuffer());
		await c.env.BUCKET.put(`stable/${latesetVersion}/${asset.name}`, fileData);
	}

	return c.json(versions);
}

async function uploadCanaryArtifact({ c }: { c: Request }) {
	const canaryWorkflowRunsResponse = await fetch(
		`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/actions/workflows/canary.yaml/runs`,
		{
			cf: {
				cacheTtl: 300,
				cacheEverything: true,
			},
			headers: {
				Authorization: `token ${c.env.GITHUB_TOKEN}`,
				"User-Agent": "overlayed-updater v1",
			},
		},
	);

	// all workflow runs for canary
	const workflowRuns =
		(await canaryWorkflowRunsResponse.json()) as WorkflowRuns;

	// find the most recent successful run
	const successfulRun = workflowRuns.workflow_runs.find(
		(run) => run.conclusion === "success",
	);

	if (!successfulRun?.artifacts_url) {
		return c.json(
			{
				error: "No artifacts found",
			},
			500,
		);
	}

	const uploadedArtifacts = (await fetch(successfulRun.artifacts_url, {
		cf: {
			cacheTtl: 300,
			cacheEverything: true,
		},
		headers: {
			Authorization: `token ${c.env.GITHUB_TOKEN}`,
			"User-Agent": "overlayed-updater v1",
		},
	}).then((res) => res.json())) as Artifacts;

	const uploaded = [];
	// download all the files and upload them to r2
	for (const artifact of uploadedArtifacts.artifacts) {
		console.log(`Downloading ${artifact.name}`, artifact.archive_download_url);
		const signedUrlResponse = await fetch(artifact.archive_download_url, {
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
				"X-GitHub-Api-Version": "2022-11-28",
				"User-Agent": "overlayed-updater v1",
			},
			redirect: "follow",
		});

		if (signedUrlResponse.redirected) {
			const fileData = await fetch(signedUrlResponse.url).then((res) =>
				res.arrayBuffer(),
			);
			await c.env.BUCKET.put(`canary/${artifact.name}`, fileData);

			uploaded.push(artifact.name);
		}
	}

	// upload a manifest with the last update and "version"
	await c.env.BUCKET.put(
		"canary/latest.json",
		JSON.stringify({
			updated: new Date().toISOString(),
			latestVersion: successfulRun.head_sha,
		}),
	);

	console.log("uploaded manifest", uploaded);

	// inform discord role that we have a new canary version
	await fetch(c.env.CANARY_WEBHOOK_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			content: `<@&1266782388168560952> New Overlayed Canary version uploaded [${successfulRun.head_sha}](<https://github.com/overlayeddev/overlayed/commit/${successfulRun.head_sha}>)

You can download it on [overlayed.dev/canary](<https://overlayed.dev/canary>)
`,
		}),
	});

	return c.json(
		{
			uploaded,
			updated: new Date().toISOString(),
			latestVersion: successfulRun.head_sha,
		},
		200,
	);
}

export default app;
