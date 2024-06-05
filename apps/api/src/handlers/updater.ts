import { Hono } from "hono/quick";
import { getLatestVersions, getPlatformDownloads, getStars } from "../utils.js";
import { Artifacts, WorkflowRuns } from "../types.js";

type Bindings = {
	GITHUB_TOKEN: string;
	BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();
// TODO: either use a github client or make a wrapper to simplify the rest call

app.get("/stars", async (c) => {
	const response = await getStars({
		authToken: c.env.GITHUB_TOKEN,
	});

	return c.body(JSON.stringify(response), 200, {
		"Content-Type": "application/json",
		"Cache-Control": "max-age=300",
	});
});

app.get("/latest", async (c) => {
	const response = await getPlatformDownloads({
		authToken: c.env.GITHUB_TOKEN,
	});

	if (!response) {
		return c.body(
			JSON.stringify({
				downloads: [],
				latestVersion: "",
			}),
			500,
			{
				"Content-Type": "application/json",
			},
		);
	}

	return c.body(
		JSON.stringify({
			downloads: response.versions,
			latestVersion: response.latestVersion,
		}),
		200,
		{
			"Content-Type": "application/json",
		},
	);
});

app.get("/canary", async (c) => {
	const files = await c.env.BUCKET.list({
		prefix: "mac/",
	});

	// get the latest canary build for each platform

	return c.body(
		JSON.stringify({
			downloads: [],
			latestVersion: "v0.0.0",
		}),
		200,
		{
			"Content-Type": "application/json",
		},
	);
});

// TODO: error handle this
app.get("/upload-canary-artifacts", async (c) => {
	const canaryWorkflowRunsResponse = await fetch(
		"https://api.github.com/repos/Hacksore/overlayed/actions/workflows/canary.yaml/runs",
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
		return c.body(
			JSON.stringify({
				error: "No artifacts found",
			}),
			500,
			{
				"Content-Type": "application/json",
			},
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

	// return them like the other endpoints
	const canaryArtifacts = uploadedArtifacts.artifacts.map((artifact) => {
		return {
			name: artifact.name,
			url: artifact.archive_download_url,
			platform: artifact.name.split("-")[1],
		};
	});

	console.log(canaryArtifacts, JSON.stringify(c.env.GITHUB_TOKEN.split("")));

	// download all the files and upload them to r2
	for (const artifact of canaryArtifacts) {
		const file = await fetch(artifact.url, {
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
				"X-GitHub-Api-Version": "2022-11-28",
				"User-Agent": "overlayed-updater v1",
			},
		}).then((res) => res.text());

		console.log(file)

		console.log(`Uploading ${artifact.name} to r2`);
		await c.env.BUCKET.put(`canary/${artifact.name}`, file);
	}

	return c.body(JSON.stringify(canaryArtifacts), 200, {
		"Content-Type": "application/json",
	});
});

app.get("/:target/:arch/:currentVersion", async (c) => {
	// TODO: updater metrics maybe?
	const currentVersion = c.req.param("currentVersion");

	try {
		const latestVersion = await getLatestVersions({
			authToken: c.env.GITHUB_TOKEN,
		});

		if (currentVersion === latestVersion?.version) {
			return c.body("", 204, {
				"Content-Type": "application/json",
			});
		}

		return c.body(JSON.stringify(latestVersion), 200, {
			"Content-Type": "application/json",
		});
	} catch (e) {
		return c.body(JSON.stringify(e), 500, {
			"Content-Type": "application/json",
		});
	}
});

export default app;
