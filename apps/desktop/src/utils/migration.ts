import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export async function completeMigration(name: string) {
  try {
    await writeTextFile(`migrations/${name}.json`, JSON.stringify({ completed: true }), {
      baseDir: BaseDirectory.AppConfig,
    });
  } catch (e) {
    console.error(e);
  }
}

export async function isMigrationComplete(name: string): Promise<boolean> {
  try {
    const contents = await readTextFile(`migrations/${name}.json`, {
      baseDir: BaseDirectory.AppConfig,
    });

    return JSON.parse(contents).completed;
  } catch (e) {
    return false;
  }
}
