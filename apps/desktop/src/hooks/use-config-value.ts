import Config, { type OverlayedConfig, type OverlayedConfigKey } from "@/config";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

export const useConfigValue = <T extends OverlayedConfigKey>(
  key: T
): {
  value: OverlayedConfig[T];
} => {
  const [value, setValue] = useState<OverlayedConfig>();

  useEffect(() => {

    const init = () =>{
      Config.get(key).then(setValue)
    }

    init();

    const listenFn = listen<OverlayedConfig>("config_update", event => {
      const { payload } = event;

      // update the latest value
      // TODO: fix
      // @ts-expect-error idk
      setValue(payload[key]);
    });

    return () => {
      (async () => {
        // remove the listener
        await listenFn;
      })();
    };
  }, []);

  // @ts-expect-error need to fix this?
  return { value };
};
