// NOTE: this is from https://github.com/discord/cloudflare-sample-app/tree/main
import { Hono } from "hono";
import { InteractionResponseType, InteractionType } from "discord-interactions";
import {
	SMART_SCREEN,
	CONTRIBUTING,
	FEEDBACK,
	INSTALL,
	CANARY,
	HELP,
	INFO,
} from "./commands.js";
import { Bindings } from "./types.js";
import { verifyDiscordRequest } from "./utils.js";

const app = new Hono<{ Bindings: Bindings }>();

// https://discord.com/developers/applications/905987126099836938/emojis
const LOGO_MOJI = "<:overlayed:1263836954789806154>";

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
					content: `${LOGO_MOJI} Install the desktop app by visiting https://overlayed.dev`,
				},
			});
		}

		if (command === CONTRIBUTING.name.toLowerCase()) {
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `${LOGO_MOJI} If you want to help out, please check out **[Contributing](https://github.com/overlayeddev/overlayed/blob/main/CONTRIBUTING.md)** to get started.`,
				},
			});
		}

		if (command === FEEDBACK.name.toLowerCase()) {
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `${LOGO_MOJI} Please send feedback to https://github.com/overlayeddev/overlayed/issues/new`,
				},
			});
		}

		if (command === INFO.name.toLowerCase()) {
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `${LOGO_MOJI} https://overlayed.dev/about`,
				},
			});
		}

		if (command === CANARY.name.toLowerCase()) {
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `${LOGO_MOJI} Install the canary desktop app by visiting https://overlayed.dev/canary`,
				},
			});
		}

		if (command === SMART_SCREEN.name.toLowerCase()) {
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `${LOGO_MOJI} Learn more about Windows SmartScreen by visiting https://overlayed.dev/blog/windows-smartscreen-and-overlayed`,
				},
			});
		}

		if (command === HELP.name.toLowerCase()) {
			return c.json({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: `${LOGO_MOJI} Overlayed App Commands`,
					embeds: [
						{
							id: 652627557,
							title: "",
							description:
								"`/info` - Learn more about about Overlayed\n\n`/install` - Where to install Overlayed stable\n\n`/canary` - Where to install Overlayed canary\n\n`/feedback` - Where to report bugs and suggest ideas for Overlayed\n\n`/smartscreen` - Learn about why SmartScreen shows up on windows for Overlayed\n\n`/help` -  Show the commands available for Overlayed\n\n`/contributing` - Learn how to contribute to Overlayed\n</help:905987126099836938>",
							color: 2326507,
							fields: [],
						},
					],
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
