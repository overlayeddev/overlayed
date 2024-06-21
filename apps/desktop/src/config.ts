import { writeFile, readTextFile, createDir } from "@tauri-apps/api/fs";
import { appConfigDir } from "@tauri-apps/api/path";
import * as Sentry from "@sentry/react";

export type DirectionLR = "left" | "right" | "center";
export type DirectionTB = "top" | "bottom";

// TODO: this is hard to use we zzz
// NOTE: how can i handle versions updates where i add new keys
// NOTE: this looks cool https://github.com/harshkhandeparkar/tauri-settings/issues
export interface OverlayedConfig {
  pin: boolean;
  horizontal: DirectionLR;
  vertical: DirectionTB;
  telemetry: boolean;
  joinHistoryNotifications: boolean;
  showOnlyTalkingUsers: boolean;
}

export type OverlayedConfigKey = keyof OverlayedConfig;

export const DEFAULT_OVERLAYED_CONFIG: OverlayedConfig = {
  pin: false,
  horizontal: "right",
  // TODO: vertical alignment? i.e., if aligned to bottom, then the navbar should be at the bottom (and corner radius changes appropriately)
  vertical: "bottom",
  telemetry: true,
  joinHistoryNotifications: false,
  showOnlyTalkingUsers: false,
};

const CONFIG_FILE_NAME = "config.json";

export class Config {
  private config: OverlayedConfig = DEFAULT_OVERLAYED_CONFIG;
  private configPath: string = "";
  private loaded = false;
  constructor() {
    this.load();
  }

  load = async () => {
    if (this.loaded) return;

    this.configPath = await appConfigDir();
    try {
      const config = await readTextFile(this.configPath + "/" + CONFIG_FILE_NAME);
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

      // make sure to disable sentry if they have disabled telemetry
      if (!this.config.telemetry) {
        console.warn("[TELEMETRY] Disabling sentry.io telemetry because the user has disabled it");
        Sentry.close();
      } else {
        console.log("[TELEMETRY] sentry.io telemetry is enabled!");
      }

      // fuck it persist it
      this.save();
    } catch (e: unknown) {
      this.config = DEFAULT_OVERLAYED_CONFIG;
      this.save();

      // we don't need to raise an error cause it's the first time they have used overlayed probably?
    }

    this.loaded = true;
  };

  async getConfig(): Promise<OverlayedConfig> {
    await this.load();
    return this.config;
  }

  async get<K extends keyof OverlayedConfig>(key: K): Promise<OverlayedConfig[K]> {
    await this.load();

    return this.config[key];
  }

  async set<K extends keyof OverlayedConfig>(key: K, value: OverlayedConfig[K]): Promise<void> {
    await this.load();

    this.config[key] = value;
    this.save();
  }

  async save() {
    // create the config dir if it's not there
    try {
      await createDir(this.configPath, {
        recursive: true,
      });
    } catch (err: unknown) {
      // noop
    }

    await writeFile({
      path: this.configPath + CONFIG_FILE_NAME,
      contents: JSON.stringify(this.config, null, 2),
    });
  }
}

const config = new Config();

export default config;
