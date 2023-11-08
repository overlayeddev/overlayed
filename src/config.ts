import { writeFile, readTextFile } from "@tauri-apps/api/fs";
import { appConfigDir } from "@tauri-apps/api/path";

// TODO: this is hard to use we zzz
interface OverlayedConfig {
  clickthrough: boolean;
}

type OverlayedConfigKey = keyof OverlayedConfig;

export const DEFAULT_OVERLAYED_CONFIG: OverlayedConfig = {
  clickthrough: false,
};

export class Config {
  private config: OverlayedConfig = DEFAULT_OVERLAYED_CONFIG;
  private configPath: string = "";
  constructor() {
    this.init();
  }

  init = async () => {
    this.configPath = `${await appConfigDir()}config.json`;

    try {
      const config = await readTextFile(this.configPath);
      this.config = JSON.parse(config);
    } catch (e) {
      console.log(e);
      this.config = DEFAULT_OVERLAYED_CONFIG;
      this.save();
    }
  };

  getConfig(): OverlayedConfig {
    return this.config;
  }

  get(key: OverlayedConfigKey): any | null {
    return this.config[key] || null;
  }

  set(key: OverlayedConfigKey, value: any): void {
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
