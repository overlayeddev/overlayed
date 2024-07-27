import { Hono } from "hono/quick";
import {
	fetchAuthToken,
	getUserProfile,
	isProd,
	refreshAuthToken,
} from "../utils.js";
import { Bindings } from "../types.js";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/oauth/callback", async (c) => {
	const code = c.req.query("code");

	if (!code) {
		return c.json(
			{
				error: "No code provided",
			},
			400,
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

	// TODO: fix types
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

	// TODO: fix types
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const payload: any = await response.json();

	return c.json(payload);
});

// allow our app to request a token
app.post("/v2/token", async (c) => {
	console.log("Getting token...");
	const body = (await c.req.json()) as { code: string };
	if (!body.code) {
		return c.json(
			{
				error: "No code provided",
			},
			400,
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

	// TODO: fix types
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const authdata: any = await response.json();

	console.log("got authdata", authdata);

	// fetch the users profile
	const userdata = await getUserProfile(authdata.access_token);
	console.log("got userdata", userdata);

	return c.json({
		authdata: {
			accessToken: authdata.access_token,
			refreshToken: authdata.refresh_token,
			accessTokenExpiry: new Date(Date.now() + authdata.expires_in * 1000),
		},
		userdata,
	});
});

export default app;
