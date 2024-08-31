import { Hono } from "hono/quick";
import { getLatestVersions, getPlatformDownloads, getStars } from "../utils.js";
import { Bindings } from "../types.js";

const app = new Hono<{ Bindings: Bindings }>();
// TODO: either use a github client or make a wrapper to simplify the rest call

app.get("/stars", async (c) => {
	const response = await getStars({
		authToken: c.env.GITHUB_TOKEN,
	});

	return c.json(response, 200, {
		"Cache-Control": "max-age=300",
	});
});

app.get("/latest/stable", async (c) => {
	const response = await getPlatformDownloads({
		authToken: c.env.GITHUB_TOKEN,
	});

	if (!response) {
		return c.json(
			{
				downloads: [],
				latestVersion: "",
			},
			500,
		);
	}

	return c.json(
		{
			downloads: response.versions,
			latestVersion: response.latestVersion,
		},
		200,
	);
});

// TODO: support local loading of canary artifacts somehow?
app.get("/latest/canary", async (c) => {
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

	return c.json(
		{
			downloads,
			...latest,
		},
		200,
	);
});

// NOTE: THIS SHOULD HAVE BEEN PREFIXED 😂
app.get("/:target/:arch/:currentVersion", async (c) => {
	const currentVersion = c.req.param("currentVersion");

	try {
		const latestVersion = await getLatestVersions({
			authToken: c.env.GITHUB_TOKEN,
		});

		if (currentVersion === latestVersion?.version) {
			return c.json({}, 204);
		}

		return c.json(latestVersion);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (e: any) {
		console.error(e);
		return c.json(
			{
				error: e.message,
			},
			500,
		);
	}
});

export default app;
