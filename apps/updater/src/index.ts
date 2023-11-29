import { Hono } from "hono/quick";
import type { Endpoints } from "@octokit/types";

type ReleaseResponse =
	Endpoints["GET /repos/{owner}/{repo}/releases/latest"]["response"]["data"];

type Bindings = {
	GITHUB_TOKEN: string;
};

interface LatestVersion {
	version: string;
	notes: string;
	pub_date: string;
	platforms: {
		[platform: string]: {
			signature: string;
			url: string;
		};
	}[];
}

const app = new Hono<{ Bindings: Bindings }>();

const GIT_USER = "Hacksore";
const GIT_REPO = "overlayed";

app.get("/:target/:arch/:currentVersion", async (c) => {
	const target = c.req.param("target");
	const arch = c.req.param("arch");
	const currentVersion = c.req.param("currentVersion");

	console.log(`Fetching releases for ${target}/${arch}`);

	// fetch all releases from github
	try {
		const releases: ReleaseResponse = await fetch(
			`https://api.github.com/repos/${GIT_USER}/${GIT_REPO}/releases/latest`,
			{
				headers: {
					Authorization: `token ${c.env.GITHUB_TOKEN}`,
					"User-Agent": "overlayed-updater v1",
				},
			},
		).then((res) => res.json());

		// get the assets that is called latest.json
		const latest = releases.assets.find(
			(asset) => asset.name === "latest.json",
		);

		if (!latest) {
			return c.body(
				"",
				204,

				{
					"Content-Type": "application/json",
				},
			);
		}

		// download the latest.json and return it's response
		try {
			const latestVersion: LatestVersion = await fetch(
				latest.browser_download_url,
			).then((res) => res.json());

			return c.body(JSON.stringify(latestVersion), 200, {
				contentType: "application/json",
			});
		} catch (err) {
			console.log(err);
			return c.body("", 204);
		}
	} catch (err) {
		console.log(err);
		return c.body(
			JSON.stringify({ error: "Failed to fetch releases" }),
			500,

			{
				"Content-Type": "application/json",
			},
		);
	}
});

export default app;
