// NOTE: this is from https://github.com/discord/cloudflare-sample-app/tree/main
import { Hono } from "hono";
import { InteractionResponseType, InteractionType } from "discord-interactions";
import { FEEDBACK, INFO, INSTALL } from "./commands.js";
import { Bindings } from "./types.js";
import { verifyDiscordRequest } from "./utils.js";

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
		const command = interaction.data.name.toLowerCase();

		if (command === INSTALL.name.toLowerCase()) {
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content:
						"Install the desktop client by visiting https://overlayed.dev",
				},
			});
		}

		if (command === FEEDBACK.name.toLowerCase()) {
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content:
						"Please send feedback to https://github.com/overlayeddev/overlayed/issues/new",
				},
			});
		}

		if (command === INFO.name.toLowerCase()) {
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content:
						"Overlayed is a desktop app that shows who is in your Discord voice channel and their voice status (speaking, deafened, muted). It features a movable overlay you can pin anywhere!" +
						"\n" +
						"https://x.com/OverlayedDev/status/1811448633377673374",
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

const server = {
	verifyDiscordRequest,
	fetch: app.fetch,
};

export default server;
