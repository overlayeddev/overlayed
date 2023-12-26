import type { Endpoints } from "@octokit/types";

export interface LatestVersion {
	version: string;
	notes: string;
	pub_date: string;
	platforms: {
		[platform: string]: {
			signature: string;
			url: string;
		};
	}[];
}

export type ReleaseResponse =
	Endpoints["GET /repos/{owner}/{repo}/releases/latest"]["response"]["data"];
