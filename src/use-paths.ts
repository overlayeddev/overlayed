import {
  appConfigDir,
  appLogDir,
  appCacheDir,
  appLocalDataDir,
} from "@tauri-apps/api/path";
import { useEffect, useState } from "react";
export const usePaths = () => {
  const [configDir, setConfigDir] = useState<string | null>(null);
  const [logDir, setLogDir] = useState<string | null>(null);
  const [cacheDir, setCacheDir] = useState<string | null>(null);
  const [localDataDir, setLocalDataDir] = useState<string | null>(null);

  useEffect(() => {
    const getPaths = async () => {
      const promises = await Promise.allSettled([
        appConfigDir(),
        appLogDir(),
        appCacheDir(),
        appLocalDataDir(),
      ]);

      const [configDir, logDir, cacheDir, localDataDir] = promises.map(
        (promise) => {
          if (promise.status === "fulfilled") {
            return promise.value;
          }

          return null;
        },
      );
      setConfigDir(configDir);
      setLogDir(logDir);
      setCacheDir(cacheDir);
      setLocalDataDir(localDataDir);
    };

    getPaths();
  }, []);

  return { configDir, logDir, cacheDir, localDataDir };
};
