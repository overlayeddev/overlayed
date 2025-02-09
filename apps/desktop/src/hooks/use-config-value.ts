import { SettingContext } from "@/App";
import Config, { DEFAULT_OVERLAYED_CONFIG, type OverlayedConfig, type OverlayedConfigKey } from "@/config";
import { listen } from "@tauri-apps/api/event";
import { useContext, useEffect, useState } from "react";

// NOTE: legacy and migate all of them to useConfigValueV2, then rename v2 to useConfigValue
export const useConfigValue = <T extends OverlayedConfigKey>(
  key: T
): {
  value: OverlayedConfig[T];
} => {
  const [value, setValue] = useState<OverlayedConfig[T]>(DEFAULT_OVERLAYED_CONFIG[key]);

  useEffect(() => {
    Config.get<T>(key).then(setValue);

    const listenFn = listen<OverlayedConfig>("config_update", event => {
      const { payload } = event;

      // update the latest value
      // TODO: fix
      setValue(payload[key]);
    });

    return () => {
      listenFn.then(fn => fn()); // remove the listener
    };
  }, []);

  return { value };
};

interface ConfigUpdatePayload {
  key: OverlayedConfigKey;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

// TODO: make this work somehow
export const useConfigValueV2 = <T extends OverlayedConfigKey>(
  key: T
): {
  value: OverlayedConfig[T];
} => {
  // TODO: we have to get the inintial value from the context
  // and it's an async call 😂
  const settings = useContext(SettingContext);
  const [value, setValue] = useState<OverlayedConfig[T]>(DEFAULT_OVERLAYED_CONFIG[key]);

  useEffect(() => {
    // handle first ime load
    // TODO: fix type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings.get<any>(key).then(val => {
      setValue(val);
    });

    // handle updates
    const listenFn = listen<ConfigUpdatePayload>("store://change", event => {
      setValue(event.payload.value);
    });

    return () => {
      listenFn.then(fn => fn()); // remove the listener
    };
  }, []);

  return { value };
};
