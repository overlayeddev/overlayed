import { ReleaseResponse, RepoResponse } from "./types";
import { LatestVersion } from "types/types";

const GIT_USER = "Hacksore";
const GIT_REPO = "overlayed";

const filenameToPlatform = (filename: string) => {
	if (filename.includes("msi")) {
		return "windows";
	}
	if (filename.includes("dmg")) {
		return "mac";
	}
	if (filename.includes("AppImage")) {
		return "linux";
	}
};

export async function getStars({
	authToken,
}: {
	authToken: string;
}): Promise<number | null> {
	// fetch all releases from github
	try {
		const releases: RepoResponse = await fetch(
			`https://api.github.com/repos/${GIT_USER}/${GIT_REPO}`,
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

		return releases.stargazers_count;
	} catch (err) {
		console.log(err);
		return null;
	}
}

export async function getPlatformDownloads({
	authToken,
}: {
	authToken: string;
}) {
	// fetch all releases from github
	try {
		const releases: ReleaseResponse = await fetch(
			`https://api.github.com/repos/${GIT_USER}/${GIT_REPO}/releases/latest`,
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

		return releases.assets
			.map((asset) => ({
				name: asset.name,
				url: asset.browser_download_url,
				platform: filenameToPlatform(asset.name),
			}))
			.filter((asset) => asset.name.match(/\.(dmg|msi|AppImage)$/));
	} catch (err) {
		console.log(err);
		return null;
	}
}

export async function getLatestVersions({ authToken }: { authToken: string }) {
	// fetch all releases from github
	try {
		const releases: ReleaseResponse = await fetch(
			`https://api.github.com/repos/${GIT_USER}/${GIT_REPO}/releases/latest`,
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
