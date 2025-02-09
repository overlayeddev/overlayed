import { SettingContext } from "@/App";
import { DEFAULT_OVERLAYED_CONFIG, type OverlayedConfig, type OverlayedConfigKey } from "@/config";
import { listen } from "@tauri-apps/api/event";
import { useContext, useEffect, useState } from "react";

interface ConfigUpdatePayload {
  key: OverlayedConfigKey;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

export const useConfigValue = <T extends OverlayedConfigKey>(
  key: T
): {
  value: OverlayedConfig[T];
} => {
  // TODO: we have to get the inintial value from the context
  // and it's an async call 😂
  const settings = useContext(SettingContext);
  // FIXME: reading the config values is async so this can have undesired behavior where boolean values will quickly "update" to the correct value
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
      if (event.payload.key !== key) return;
      setValue(event.payload.value);
    });

    return () => {
      listenFn.then(fn => fn()); // remove the listener
    };
  }, []);

  return { value };
};
