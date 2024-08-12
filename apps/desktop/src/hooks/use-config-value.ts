import { Store } from "tauri-plugin-store-api";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { DEFAULT_OVERLAYED_CONFIG } from "@/config";

const store = new Store("config.json");
/**
 * i want a single key from the config
 */
export const useConfigValue = (
  key: any
): {
  value: any;
} => {
  const [value, setValue] = useState(DEFAULT_OVERLAYED_CONFIG[key]);

  useEffect(() => {
    const init = () => {
      store.get(key).then(setValue);
    };

    init();

    const listenFn = listen("config_update", event => {
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
