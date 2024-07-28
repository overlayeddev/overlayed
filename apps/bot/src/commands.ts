import { GUILD_INSTALL, USER_INSTALL } from "./types.js";
import { defineCommand } from "./utils.js";

// details here https://discord.com/developers/docs/interactions/application-commands#edit-global-application-command

export const INSTALL = defineCommand({
	name: "install",
	description: "How to install the Overlayed desktop app",
	integration_types: [USER_INSTALL, GUILD_INSTALL],
	contexts: [0, 1, 2],
});

export const CONTRIBUTING = defineCommand({
	name: "contributing",
	description: "How to contribute to the Overlayed app",
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

export const CANARY = defineCommand({
	name: "canary",
	description: "Overlayed canary app information",
	integration_types: [USER_INSTALL, GUILD_INSTALL],
	contexts: [0, 1, 2],
});

export const SMART_SCREEN = defineCommand({
	name: "smartscreen",
	description: "Overlayed smartscreen information",
	integration_types: [USER_INSTALL, GUILD_INSTALL],
	contexts: [0, 1, 2],
});

export const HELP = defineCommand({
	name: "help",
	description: "Overlayed app commands",
	integration_types: [USER_INSTALL, GUILD_INSTALL],
	contexts: [0, 1, 2],
});
