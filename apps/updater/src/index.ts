import { Hono } from "hono/quick";
import { getLatestVersions } from "./utils";
import { cors } from "hono/cors";

type Bindings = {
	GITHUB_TOKEN: string;
};

const app = new Hono < { Bindings: Bindings } > ();

const GIT_USER = "Hacksore";
const GIT_REPO = "overlayed";

app.use("*", cors());

app.get("/latest", async (c) => {
	return c.body(
		JSON.stringify(
			await getLatestVersions({
				user: GIT_USER,
				repo: GIT_REPO,
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
			user: GIT_USER,
			repo: GIT_REPO,
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
