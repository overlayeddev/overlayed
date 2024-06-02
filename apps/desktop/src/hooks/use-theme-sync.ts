import { invoke } from "@tauri-apps/api";
import { appWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";

export const useThemeSync = () => {
  useEffect(() => {
    // @ts-expect-error learn how to type this
    let unlisten;
    appWindow
      .onThemeChanged(({ payload: theme }) => {
        invoke("sync_theme", { value: theme });
      })
      .then(u => (unlisten = u));
    return () => {
      // @ts-expect-error learn how to type this
      unlisten && unlisten();
    };
  }, []);
};
