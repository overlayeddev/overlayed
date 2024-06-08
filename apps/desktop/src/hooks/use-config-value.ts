import Config, { DEFAULT_OVERLAYED_CONFIG, type OverlayedConfig, type OverlayedConfigKey } from "@/config";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

/**
 * i want a single key from the config
 */
export const useConfigValue = <T extends OverlayedConfigKey>(
  key: T
): {
  value: OverlayedConfig[T];
} => {
  const [value, setValue] = useState<OverlayedConfig[T]>(DEFAULT_OVERLAYED_CONFIG[key]);

  useEffect(() => {
    const init = () => {
      Config.get<T>(key).then(setValue)
    };

    init();

    const listenFn = listen<OverlayedConfig>("config_update", event => {
      const { payload } = event;

      // update the latest value
      // TODO: fix
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
