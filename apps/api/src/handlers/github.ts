import { Bindings, ReleaseResponse } from "../types.js";
import { Hono } from "hono/quick";
import { getLatestRelease } from "../utils.js";

const app = new Hono<{ Bindings: Bindings }>();

const FILE_NAME_TO_PLATFORM = {
	windows: "msi",
	mac: "dmg",
	linux: "AppImage",
} as const;

type Platform = keyof typeof FILE_NAME_TO_PLATFORM;

// TODO: we should cache thsee release objects in R2 like we do with canary
// then we won't have to wait for the function to download it first!
app.get("/download/:platform", async (c) => {
	const { platform } = c.req.param() as { platform: Platform };
	// get download from github
	const latestRelease = await getLatestRelease(c.env.GITHUB_TOKEN);

	// download the correct platform based on the platform
	const assetToDownload = latestRelease.assets.find((asset) => {
		const platformName = FILE_NAME_TO_PLATFORM[platform];
		return asset.name.includes(platformName);
	});

	if (!assetToDownload) {
		return c.json({ error: "No asset found" });
	}

	// download the asset in memory then send it to the user
	const fileBlob = await fetch(assetToDownload.browser_download_url).then(
		(res) => res.blob(),
	);

	// send it to them
	c.header("Content-Type", "application/octet-stream");
	c.header("Content-Disposition", "attachment");

	return c.body(await fileBlob.arrayBuffer());
});

export default app;
