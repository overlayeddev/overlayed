import { Hono } from "hono/quick";
import { getLatestVersions } from "./utils";

type Bindings = {
	GITHUB_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const GIT_USER = "Hacksore";
const GIT_REPO = "overlayed";

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
	const target = c.req.param("target");
	const arch = c.req.param("arch");
	const currentVersion = c.req.param("currentVersion");

	return c.body(JSON.stringify({ error: "Failed to fetch releases" }), 204, {
		"Content-Type": "application/json",
	});
});

export default app;
