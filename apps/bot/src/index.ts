// NOTE: this is from https://github.com/discord/cloudflare-sample-app/tree/main
import { Context, Hono } from "hono";
import {
	InteractionResponseType,
	InteractionType,
	verifyKey,
} from "discord-interactions";
import { FEEDBACK, INSTALL } from "./commands.js";

type Bindings = {
	DISCORD_APPLICATION_ID: string;
	DISCORD_PUBLIC_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
	return new Response(`👋 ${c.env.DISCORD_APPLICATION_ID}`);
});

app.post("/", async (c) => {
	const { isValid, interaction } = await server.verifyDiscordRequest(c);

	if (!isValid || !interaction) {
		return new Response("Bad request signature.", { status: 401 });
	}

	if (interaction.type === InteractionType.PING) {
		return c.json({
			type: InteractionResponseType.PONG,
		});
	}

	if (interaction.type === InteractionType.APPLICATION_COMMAND) {
		// Most user commands will come as `APPLICATION_COMMAND`.
		if (interaction.data.name.toLowerCase() === INSTALL.name.toLowerCase()) {
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content:
						"Install the desktop client by visiting https://overlayed.dev",
				},
			});
		}
		if (interaction.data.name.toLowerCase() === FEEDBACK.name.toLowerCase()) {
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content:
						"Please send feedback to https://github.com/overlayeddev/overlayed/issues/new",
				},
			});
		}

		return c.json({
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: "Sorry, I don't know that command.",
			},
		});
	}

	console.error("Unknown Type");
	return c.json({ error: "Unknown Type" }, { status: 400 });
});

app.all("*", () => new Response("Not Found.", { status: 404 }));

type Request = Context<{
	Bindings: Bindings;
}>;

async function verifyDiscordRequest(c: Request) {
	const signature = c.req.header("x-signature-ed25519");
	const timestamp = c.req.header("x-signature-timestamp");
	const body = await c.req.text();

	const isValidRequest =
		signature &&
		timestamp &&
		(await verifyKey(body, signature, timestamp, c.env.DISCORD_PUBLIC_KEY));

	if (!isValidRequest) {
		return { isValid: false };
	}

	return { interaction: JSON.parse(body), isValid: true };
}

const server = {
	verifyDiscordRequest,
	fetch: app.fetch,
};

export default server;
