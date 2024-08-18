import { check, type Update } from "@tauri-apps/plugin-updater";
import { useEffect, useState } from "react";

export const useUpdate = () => {
  const [update, setUpdate] = useState<Update | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const setupUpdater = async () => {
      try {
        const update = await check();

        setUpdate(update);
      } catch (error) {
        console.error(error);
        setError(JSON.stringify(error));
      }
    };

    setupUpdater();
  }, []);

  return { update, error };
};
