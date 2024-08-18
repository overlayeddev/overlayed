import { BaseDirectory, createDir, exists, readTextFile, writeFile } from "@tauri-apps/plugin-fs";

export async function completeMigration(name: string) {
  try {
    if (!(await exists("migrations", { dir: BaseDirectory.AppConfig }))) {
      await createDir("migrations", { dir: BaseDirectory.AppConfig });
    }

    await writeFile(`migrations/${name}.json`, JSON.stringify({ completed: true }), { dir: BaseDirectory.AppConfig });
  } catch (e) {
    console.error(e);
  }
}

export async function isMigrationComplete(name: string): Promise<boolean> {
  try {
    const contents = await readTextFile(`migrations/${name}.json`, {
      dir: BaseDirectory.AppConfig,
    });

    return JSON.parse(contents).completed;
  } catch (e) {
    return false;
  }
}
