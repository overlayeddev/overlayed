import type { Endpoints } from "@octokit/types";

export type RepoResponse =
	Endpoints["GET /repos/{owner}/{repo}"]["response"]["data"];

export type ReleaseResponse =
	Endpoints["GET /repos/{owner}/{repo}/releases/latest"]["response"]["data"];

export type WorkflowRuns =
	Endpoints["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs"]["response"]["data"];

export type Artifacts =
	Endpoints["GET /repos/{owner}/{repo}/actions/artifacts"]["response"]["data"];

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
