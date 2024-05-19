import { writeFile, readTextFile } from "@tauri-apps/api/fs";
import { appConfigDir } from "@tauri-apps/api/path";

export type DirectionLR = "left" | "right" | "center";
export type DirectionTB = "top" | "bottom";

// TODO: this is hard to use we zzz
// NOTE: how can i handle versions updates where i add new keys
// NOTE: this looks cool https://github.com/harshkhandeparkar/tauri-settings/issues
export interface OverlayedConfig {
  clickthrough: boolean;
  horizontal: DirectionLR;
  vertical: DirectionTB;
  telemetry: boolean;
  joinHistoryNotifications: boolean;
  showOnlyTalkingUsers: boolean;
}

export type OverlayedConfigKey = keyof OverlayedConfig;

export const DEFAULT_OVERLAYED_CONFIG: OverlayedConfig = {
  clickthrough: false,
  horizontal: "right",
  // TODO: vertical alignment? i.e., if aligned to bottom, then the navbar should be at the bottom (and corner radius changes appropriately)
  vertical: "bottom",
  telemetry: true,
  joinHistoryNotifications: false,
  showOnlyTalkingUsers: false,
};

export class Config {
  private config: OverlayedConfig = DEFAULT_OVERLAYED_CONFIG;
  private configPath: string = "";
  constructor() {
    this.init();
  }

  init = async () => {
    this.configPath = `${await appConfigDir()}/config.json`;

    try {
      const config = await readTextFile(this.configPath);
      this.config = JSON.parse(config);

      // get the new keys that don't exist in the config and merge them in
      const newKeys = Object.keys(DEFAULT_OVERLAYED_CONFIG).filter(key => !Object.keys(this.config).includes(key));

      this.config = {
        ...DEFAULT_OVERLAYED_CONFIG,
        ...this.config,
        // NOTE: set new keys added to the default value
        ...newKeys.reduce((acc, key) => {
          // @ts-expect-error not sure why this errors but need to fix it
          acc[key] = DEFAULT_OVERLAYED_CONFIG[key as OverlayedConfigKey];
          return acc;
        }, {} as OverlayedConfig),
      };

      // fuck it persist it
      this.save();
    } catch (e: unknown) {
      this.config = DEFAULT_OVERLAYED_CONFIG;
      this.save();

      console.error(e);
    }
  };

  getConfig(): OverlayedConfig {
    return this.config;
  }

  get(key: OverlayedConfigKey): any | null {
    return this.config[key] || null;
  }

  set<K extends keyof OverlayedConfig>(key: K, value: OverlayedConfig[K]): void {
    this.config[key] = value;
    this.save();
  }

  async save() {
    await writeFile({
      path: this.configPath,
      contents: JSON.stringify(this.config, null, 2),
    });
  }
}

export default new Config();
