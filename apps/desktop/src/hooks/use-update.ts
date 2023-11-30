import { checkUpdate, onUpdaterEvent } from "@tauri-apps/api/updater";
import type { UpdateStatus } from "@tauri-apps/api/updater";
import { useEffect, useState } from "react";

export const useUpdate = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [status, setStatus] = useState<UpdateStatus|null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const setupUpdater = async () => {
      const unlisten = await onUpdaterEvent(({ error, status }) => {
        setStatus(status);

        if (error) {
          setError(error);
        }
      });

      try {
        const { shouldUpdate, manifest } = await checkUpdate();
        console.log(manifest);

        setIsAvailable(shouldUpdate);
      } catch (error) {
        console.error(error);
      }

      return unlisten;
    };

    setupUpdater();
  }, []);

  return { isAvailable, error, status };
};
