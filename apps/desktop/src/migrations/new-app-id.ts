import { APP_ID } from "@/rpc/manager";
import { isMigrationComplete, completeMigration } from "@/utils/migration";

const MIGRATION_NAME = "newAppId";

// run this migration if the user is going from 0.3.0 to 0.4.0
export async function migrate() {
  let needsMigration = true;
  if (await isMigrationComplete(MIGRATION_NAME)) {
    needsMigration = false;
    console.log("this migration has already been ran");
  }

  const existingId = localStorage.getItem("discord_access_token");
  if (existingId === null) {
    console.log("No old app id found");
    needsMigration = false;
  }

  if (existingId === APP_ID) {
    console.log("New appid is already");
    needsMigration = false;
  }

  if (needsMigration) {
    console.log("Running migration to the new app id cause we found the old app id");
    localStorage.removeItem("discord_access_token");
    localStorage.removeItem("discord_access_token_expiry");
    localStorage.removeItem("user_data");

    console.log("Migration complete");
  } else {
    console.log("Migration skipped");
  }

  await completeMigration(MIGRATION_NAME);
}
