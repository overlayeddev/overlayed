import { verifyKey } from "discord-interactions";

import { Command, Request } from "./types.js";

export async function verifyDiscordRequest(c: Request) {
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

export const defineCommand = (input: Command) => input;
