import Config from "@/config";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";

export const useStartPinned = () => {
  useEffect(() => {
    if (getCurrentWebviewWindow().label !== "main") return;
    let disposed = false;
    Config.get("startPinned")
      .then(async startPinned => {
        if (startPinned && !disposed) await invoke("set_pin", { value: true });
      })
      .catch(error => console.warn("Could not start the overlay pinned", error));
    return () => {
      disposed = true;
    };
  }, []);
};
