import { Context } from "hono";

export type Bindings = {
	DISCORD_APPLICATION_ID: string;
	DISCORD_PUBLIC_KEY: string;
};

export type Request = Context<{
	Bindings: Bindings;
}>;

export const GUILD_INSTALL = 0;
export const USER_INSTALL = 1;

export interface Command {
	name: string;
	description: string;
	// TODO: type this better
	integration_types: number[];

	// TODO: type this better
	contexts: number[];
}
