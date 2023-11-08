import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import overlayedConfig from "./config";

export const useClickthrough = () => {
  const [clickthrough, setClickthrough] = useState(false);
  useEffect(() => {
    const unlisten = listen<boolean>("toggle_clickthrough", (event) => {
      setClickthrough(event.payload);
      overlayedConfig.set("clickthrough", event.payload);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return { clickthrough };
};
