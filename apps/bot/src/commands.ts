import { GUILD_INSTALL, USER_INSTALL } from "./types.js";
import { defineCommand } from "./utils.js";

// details here https://discord.com/developers/docs/interactions/application-commands#edit-global-application-command

export const INSTALL = defineCommand({
	name: "install",
	description: "How to install the Overlayed desktop app",
	integration_types: [USER_INSTALL, GUILD_INSTALL],
	contexts: [0, 1, 2],
});

export const FEEDBACK = defineCommand({
	name: "feedback",
	description: "Send feedback to the Overlayed team",
	integration_types: [USER_INSTALL, GUILD_INSTALL],
	contexts: [0, 1, 2],
});

export const INFO = defineCommand({
	name: "info",
	description: "Overlayed app iformation",
	integration_types: [USER_INSTALL, GUILD_INSTALL],
	contexts: [0, 1, 2],
});
