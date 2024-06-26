import { Artifacts, Bindings, WorkflowRuns } from "../types.js";
import { GITHUB_REPO, GITHUB_USER } from "../constants.js";
import { Hono } from "hono/quick";
import { WorkflowRunEvent } from "@octokit/webhooks-types";
import { Webhooks } from "@octokit/webhooks";
import { isProd } from "../utils.js";

const app = new Hono<{ Bindings: Bindings }>();

app.post("/upload-canary-artifacts", async (c) => {
	const webhooks = new Webhooks({
		secret: c.env.CANARY_UPLOAD_SECRET,
	});

	const isProduction = isProd(c.req.url);
	const body = (await c.req.json()) as WorkflowRunEvent;
	const bodyAsString = JSON.stringify(body);

	const signature = c.req.header("x-hub-signature-256") || "";

	const isCanaryJob = body.workflow.name === "Canary";
	const isSuccesfulRun =
		body.action === "completed" && body.workflow_run.conclusion === "success";

	// only enable this is production!
	if (isProduction) {
		if (!(await webhooks.verify(bodyAsString, signature))) {
			return c.json({ error: "Unauthorized" });
		}
	}

	if (!isSuccesfulRun || !isCanaryJob) {
		return c.json({
			messge: "either the run was not successful or it was not a canary job",
			job: body.workflow.name,
			conclusion: body.workflow_run.conclusion,
		});
	}

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
	const workflowRuns: WorkflowRuns = await canaryWorkflowRunsResponse.json();

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

	const uploadedArtifacts: Artifacts = await fetch(
		successfulRun.artifacts_url,
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
	).then((res) => res.json());

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

	return c.json(
		{
			uploaded,
			updated: new Date().toISOString(),
			latestVersion: successfulRun.head_sha,
		},
		200,
	);
});

export default app;
