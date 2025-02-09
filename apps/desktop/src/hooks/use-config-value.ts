import Config, { DEFAULT_OVERLAYED_CONFIG, type OverlayedConfig, type OverlayedConfigKey } from "@/config";
import { StoreContext } from "@/main";
import { listen } from "@tauri-apps/api/event";
import { useContext, useEffect, useState } from "react";

interface StoreChangePayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  key: string;
  exists: boolean;
}

export const useConfigValue = <T extends OverlayedConfigKey>(
  key: T
): {
  value: OverlayedConfig[T];
  setValue: (value: OverlayedConfig[T]) => void;
} => {
  const store = useContext(StoreContext);
  const [value, setValue] = useState<OverlayedConfig[T]>(DEFAULT_OVERLAYED_CONFIG[key]);

  useEffect(() => {
    (async () => {
      await store.set(key, value);
      await store.save();
    })();
  }, [value]);

  useEffect(() => {
    const init = () => {
      // Config.get<T>(key).then(setValue);
      console.log("key", key);
      store.get<T>(key).then(event => console.log("event", event));
    };

    init();

    // TODO: fix types
    const listenFn = listen<StoreChangePayload>("store://change", event => {
      setValue(event.payload.value);
    });

    return () => {
      (async () => {
        // remove the listener
        await listenFn;
      })();
    };
  }, []);

  return { value, setValue };
};
