import { useEffect, useState } from "react";
import { settings } from "../App";
import { useAppStore, type AppSettings } from "../store";
import { listen } from "@tauri-apps/api/event";

interface StoreUpdatePayload {
  path: string;
  resourceId: number;
  key: keyof AppSettings;
  // TODO: how to fix this?
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  value: any;
  exists: boolean;
}

export const useSettings = () => {
  const store = useAppStore();
  const [initialSettings, setInitialSettings] = useState<AppSettings | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const keys = await settings.keys();
        const loadedSettings: Partial<AppSettings> = {};

        for (const key of keys) {
          try {
            const value = await settings.get(key);

            // Type assertion to handle potential type mismatches.  Important!
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            loadedSettings[key as keyof AppSettings] = value as AppSettings[keyof AppSettings];
          } catch (error) {
            console.error(`Error loading setting for key ${key}:`, error);
          }
        }

        setInitialSettings(loadedSettings as AppSettings); // Cast to AppSettings
      } catch (error) {
        console.error("Error loading settings keys:", error);
      }
    };

    loadSettings();

    // listen for backend changes from the rust side
    const fn = listen<StoreUpdatePayload>("store://change", event => {
      const { key, value } = event.payload;
      store.setSettingValue(key, value, true);
    });

    return () => {
      fn.then(unsub => unsub());
    };
  }, []);

  return initialSettings;
};
