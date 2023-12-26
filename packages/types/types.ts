export interface LatestVersion {
	version: string;
	notes: string;
	platforms: {
		[platform: string]: {
			signature: string;
			url: string;
		};
	}[];
}

export interface PlatformDownload {
	name: string;
	url: string;
	platform: "windows" | "mac" | "linux";
}
