import { checkUpdate, onUpdaterEvent } from "@tauri-apps/api/updater";
import { useEffect, useState } from "react";

export const useUpdate = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    const setupUpdater = async () => {
      const unlisten = await onUpdaterEvent(({ error, status }) => {
        // This will log all updater events, including status updates and errors.
        console.log("Updater event", error, status);
      });

      try {
        const { shouldUpdate } = await checkUpdate();

        setIsUpdateAvailable(shouldUpdate);
      } catch (error) {
        console.error(error);
      }

      return unlisten;
    };

    setupUpdater();
  }, []);

  return { isUpdateAvailable };
};
