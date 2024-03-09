import Config, { type OverlayedConfig, type OverlayedConfigKey } from "@/config";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

export const useConfigValue = <T>(
  key: OverlayedConfigKey
): {
  value: T;
} => {
  const [value, setValue] = useState(Config.get(key));

  useEffect(() => {
    const listenFn = listen<OverlayedConfig>("config_update", event => {
      const { payload } = event;

      // update the latest value
      setValue(payload[key]);
    });

    return () => {
      (async () => {
        // remove the listener
        await listenFn;
      })();
    };
  }, []);

  return { value };
};
