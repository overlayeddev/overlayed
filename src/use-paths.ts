import { appConfigDir, appLogDir } from "@tauri-apps/api/path";
import { useEffect, useState } from "react";
export const usePaths = () => {
  const [configDir, setConfigDir] = useState < string | null > (null);
  const [logDir, setLogDir] = useState < string | null > (null);

  useEffect(() => {
    const getPaths = async () => {
      const promises = await Promise.allSettled([appConfigDir(), appLogDir()]);

      const [configDir, logDir] = promises.map((promise) => {
        if (promise.status === "fulfilled") {
          return promise.value;
        }

        return null;
      });
      setConfigDir(configDir);
      setLogDir(logDir);
    };

    getPaths();
  }, []);

  return { configDir, logDir };
};
