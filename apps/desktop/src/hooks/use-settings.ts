import { useEffect, useRef } from "react";
import { settings } from "../App";
import { useAppStore, type AppSettings } from "../store";
import { listen } from "@tauri-apps/api/event";

interface StoreUpdatePayload {
  path: string;
  resourceId: number;
  key: keyof AppSettings;
  // TODO: how to fix this?
  value: never;
  exists: boolean;
}

export const useSettings = () => {
  const store = useAppStore();
  const initialSettingsRef = useRef<AppSettings | null>(null);

  useEffect(() => {
    // NOTE: we wonly load settings once
    if (initialSettingsRef.current) return;
    const loadSettings = async () => {
      try {
        const keys = await settings.keys();
        const loadedSettings: Partial<AppSettings> = {};

        for (const key of keys) {
          try {
            const value = await settings.get(key);

            console.log("loaded setting", key, value);
            // Type assertion to handle potential type mismatches.  Important!
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            loadedSettings[key as keyof AppSettings] = value as AppSettings[keyof AppSettings];
          } catch (error) {
            console.error(`Error loading setting for key ${key}:`, error);
          }
        }

        console.log("loaded settings", loadedSettings);
        initialSettingsRef.current = loadedSettings as AppSettings; // Store in ref
      } catch (error) {
        console.error("Error loading settings keys:", error);
      }
    };

    loadSettings();

    // listen for backend changes from the rust side
    const fn = listen<StoreUpdatePayload>("store://change", event => {
      const { key, value } = event.payload;
      console.log("store change", key, value);
      store.setSettingValue(key, value, true);
    });

    return () => {
      fn.then(unsub => unsub());
    };
  }, []);

  return initialSettingsRef.current;
};
