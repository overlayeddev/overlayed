import { GITHUB_REPO, GITHUB_USER } from "./constants.js";
import { ReleaseResponse, RepoResponse } from "./types.js";

// @ts-expect-error something is wrong with types here
import { LatestVersion } from "types";

export async function getLatestRelease(authToken: string) {
	const releases = (await fetch(
		`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/latest`,
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
	).then((res) => res.json())) as ReleaseResponse;

	return releases;
}

export const filenameToPlatform = (filename: string) => {
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
}): Promise<{ stars: number; updateAt: string } | null> {
	// fetch all releases from github
	try {
		const releases = (await fetch(
			`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}`,
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
		).then((res) => res.json())) as RepoResponse;

		return {
			stars: releases.stargazers_count,
			updateAt: releases.updated_at,
		};
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
		const releases = await getLatestRelease(authToken);

		const versions = releases.assets
			.map((asset) => ({
				name: asset.name,
				url: asset.browser_download_url,
				platform: filenameToPlatform(asset.name),
			}))
			.filter((asset) => asset.name.match(/\.(dmg|msi|AppImage)$/));

		return { versions, latestVersion: releases.tag_name };
	} catch (err) {
		console.log(err);
		return null;
	}
}

interface LatestVersionInput {
	authToken: string;
}

export async function getLatestVersions({ authToken }: LatestVersionInput) {
	// fetch all releases from github
	try {
		const releases = await getLatestRelease(authToken);

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

// auth stuffz
export const fetchAuthToken = (
	code: string,
	env: {
		CLIENT_ID: string;
		CLIENT_SECRET: string;
	},
	// TODO: find a better way
	isProd: boolean,
) => {
	const form = new URLSearchParams();
	const baseUrl = getApiUrl(isProd);

	form.append("client_id", env.CLIENT_ID);
	form.append("client_secret", env.CLIENT_SECRET);
	form.append("grant_type", "authorization_code");
	form.append("redirect_uri", `${baseUrl}/oauth/callback`);
	form.append("code", code);

	console.log("formdata:", form.toString());

	return fetch("https://discord.com/api/oauth2/token", {
		method: "POST",
		body: form.toString(),
		headers: {
			"User-Agent": "overlayed-auth-api",
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});
};

export function isProd(url: string) {
	return url.startsWith("https://api.");
}

export function getApiUrl(isProd: boolean) {
	const baseUrl = isProd
		? "https://api.overlayed.dev"
		: "http://localhost:8787";

	return baseUrl;
}
