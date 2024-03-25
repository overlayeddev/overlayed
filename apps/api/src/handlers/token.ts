import { Hono } from "hono/quick";
import { fetchAuthToken } from "../utils.js";

type Bindings = {
	CLIENT_ID: string;
	CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// allow our app to request a token
app.post("/token", async (c) => {
	const body = (await c.req.parseBody()) as { code: string };
	if (!body.code) {
		return c.body(
			JSON.stringify({
				error: "No code provided",
			}),
			400,
			{
				"Content-Type": "application/json",
			},
		);
	}

	const response = await fetchAuthToken(body.code, {
		CLIENT_SECRET: c.env.CLIENT_SECRET,
		CLIENT_ID: c.env.CLIENT_ID,
	});
	const payload = await response.json();

	return new Response(JSON.stringify(payload), {
		headers: {
			Accept: "application/json",
		},
	});
});

export default app;
