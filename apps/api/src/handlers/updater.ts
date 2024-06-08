import { Hono } from "hono/quick";
import { getLatestVersions, getPlatformDownloads, getStars } from "../utils.js";
import { Artifacts, WorkflowRuns } from "../types.js";

type Bindings = {
	GITHUB_TOKEN: string;
	CANARY_UPLOAD_SECRET: string;
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
		prefix: "canary/",
	});

	// fetch the latest version form the bucket
	const latestFile = await c.env.BUCKET.get("canary/latest.json");
	const latest = (await latestFile?.json()) as {
		updated: string;
		latestVersion: string;
	};

	// get the latest canary build for each platform
	const downloads = files.objects
		.map((file) => {
			const platform = file.key.split("/")[1].split("-")[2];
			return {
				name: file.key,
				url: `https://artifacts.overlayed.dev/${file.key}`,
				platform,
			};
		})
		.filter((file) => file.name !== "canary/latest.json");

	return c.body(
		JSON.stringify({
			downloads,
			...latest,
		}),
		200,
		{
			"Content-Type": "application/json",
		},
	);
});

// TODO: error handle this
app.post("/upload-canary-artifacts", async (c) => {
	// check if they send the secret
	const { secret } = (await c.req.json()) as { secret: string };

	if (secret !== c.env.CANARY_UPLOAD_SECRET) {
		return c.body(
			JSON.stringify({
				error: "Invalid secret",
			}),
			403,
			{
				"Content-Type": "application/json",
			},
		);
	}

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

	return c.body(
		JSON.stringify({
			uploaded,
		}),
		200,
		{
			"Content-Type": "application/json",
		},
	);
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
