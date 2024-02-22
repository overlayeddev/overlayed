import { invoke } from "@tauri-apps/api";
import { useEffect } from "react";

export const useThemeSync = () => {
  // NOTE: this is janky and wish we could do all in rust
  useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    darkThemeMq.addEventListener("change", e => {
      const value = e.matches ? "dark" : "light";
      invoke("sync_theme", { value });
    });
  }, []);
};
