import { Hono } from "hono/quick";

type Bindings = {};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/:target/:arch/:currentVersion", async c => {
	const target = c.req.param("target");
	const arch = c.req.param("arch");
	const currentVersion = c.req.param("currentVersion");

	return c.body(
		JSON.stringify({
			target,
			arch,
			currentVersion,
		}),
		200,
		{
			"Content-Type": "application/json",
		}
	);
});

export default app;
