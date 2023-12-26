import { ReleaseResponse } from "./types";
import { LatestVersion } from "types/types";

export async function getLatestVersions({
	user,
	repo,
	authToken,
}: {
	user: string;
	repo: string;
	authToken: string;
}) {
	// fetch all releases from github
	try {
		const releases: ReleaseResponse = await fetch(
			`https://api.github.com/repos/${user}/${repo}/releases/latest`,
			{
				cf: {
					cacheTtl: 300,
					cacheEverything: true,
				},
				headers: {
					Authorization: `token ${authToken}`,
					"User-Agent": "overlayed-updater v1",
				},
			},
		).then((res) => res.json());

		// get the assets that is called latest.json
		const latest = releases.assets.find(
			(asset) => asset.name === "latest.json",
		);

		if (!latest) {
			console.error("No latest.json found in releases");
			return null;
		}

		// download the latest.json and return it's response
		try {
			const latestVersion: LatestVersion = await fetch(
				latest.browser_download_url,
			).then((res) => res.json());

			return latestVersion;
		} catch (err) {
			console.log(err);
			return null;
		}
	} catch (err) {
		console.log(err);
		return null;
	}
}
