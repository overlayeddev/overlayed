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
