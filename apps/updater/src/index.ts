import { Hono } from "hono/quick";
import { getLatestVersions, getPlatformDownloads, getStars } from "./utils";
import { cors } from "hono/cors";

type Bindings = {
	GITHUB_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

app.get("/stars", async (c) => {
	const stars = await getStars({
		authToken: c.env.GITHUB_TOKEN,
	});

	return c.body(JSON.stringify({ stars }), 200, {
		"Content-Type": "application/json",
	});
});

app.get("/latest", async (c) => {
	return c.body(
		JSON.stringify(
			await getPlatformDownloads({
				authToken: c.env.GITHUB_TOKEN,
			}),
		),
		200,

		{
			"Content-Type": "application/json",
		},
	);
});

app.get("/:target/:arch/:currentVersion", async (c) => {
	// TODO: updater metrics maybe?
	const target = c.req.param("target");
	const arch = c.req.param("arch");
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
