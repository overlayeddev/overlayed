import { Hono } from "hono/quick";
import { fetchAuthToken, isProd } from "../utils.js";

type Bindings = {
	CLIENT_ID: string;
	CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/oauth/callback", async (c) => {
	const code = c.req.query("code");

	if (!code) {
		return c.json(
			{
				error: "No code provided",
			},
			400,
			{
				"Content-Type": "application/json",
			},
		);
	}

	const response = await fetchAuthToken(
		code,
		{
			CLIENT_SECRET: c.env.CLIENT_SECRET,
			CLIENT_ID: c.env.CLIENT_ID,
		},
		// TODO: THIH find another way to do this
		isProd(c.req.url),
	);

	const payload: any = await response.json();

	return c.json(payload);
});

// allow our app to request a token
app.post("/token", async (c) => {
	const body = (await c.req.json()) as { code: string };
	if (!body.code) {
		return c.json(
			{
				error: "No code provided",
			},
			400,
			{
				"Content-Type": "application/json",
			},
		);
	}

	const response = await fetchAuthToken(
		body.code,
		{
			CLIENT_SECRET: c.env.CLIENT_SECRET,
			CLIENT_ID: c.env.CLIENT_ID,
		},
		// TODO: THIH find another way to do this
		isProd(c.req.url),
	);
	const payload = await response.json();

	return new Response(JSON.stringify(payload), {
		headers: {
			Accept: "application/json",
		},
	});
});

export default app;
