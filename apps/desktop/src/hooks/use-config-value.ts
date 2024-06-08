import Config, { DEFAULT_OVERLAYED_CONFIG, type OverlayedConfig, type OverlayedConfigKey } from "@/config";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

export const useConfigValue = <T extends OverlayedConfigKey>(
  key: T
): {
  value: OverlayedConfig[T];
} => {
  const [value, setValue] = useState<OverlayedConfig>(DEFAULT_OVERLAYED_CONFIG);

  useEffect(() => {
    const init = () => {
      Config.get<T>(key).then(val =>
        setValue(oldVal => ({
          ...oldVal,
          [key]: val,
        }))
      );
    };

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
