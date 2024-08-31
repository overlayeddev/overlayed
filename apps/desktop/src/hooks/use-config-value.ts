import { Store } from "@tauri-apps/plugin-store";
import { useEffect, useState } from "react";
import { DEFAULT_OVERLAYED_CONFIG, type OverlayedConfig, type OverlayedConfigKey } from "@/config";

const store = new Store("config.json");
/**
 * Let's you get the config value from disk or default for a given key
 * each rerender it should fetch the latest value from disk too
 */
export const useConfigValue = <T extends OverlayedConfigKey>(
  key: T
): {
  value: OverlayedConfig[T];
} => {
  const [value, setValue] = useState<OverlayedConfig[T]>(DEFAULT_OVERLAYED_CONFIG[key]);

  useEffect(() => {
    const init = () => {
      store.get<{ value: T }>(key).then(res => {
        if (res?.value) {
          setValue(res.value);
        }
      });
    };

    init();

    const listenFn = store.onKeyChange(key, value => {
      setValue(value);
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
