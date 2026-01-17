import { useEffect, useState } from "react";
import { type DirectionLR, type DirectionTB } from "../config";
import Config, { DEFAULT_OVERLAYED_CONFIG, type OverlayedConfig } from "@/config";
import { listen } from "@tauri-apps/api/event";

// TODO: make it update automatically when the window moves
export const useAlign = () => {
  const [horizontal, setHorizontalDirection] = useState<DirectionLR>(DEFAULT_OVERLAYED_CONFIG.horizontal);
  const [vertical, setVerticalDirection] = useState<DirectionTB>(DEFAULT_OVERLAYED_CONFIG.vertical);

  useEffect(() => {
    const init = async () => {
      const saved = await Config.get("horizontal");
      setHorizontalDirection(saved as DirectionLR);

      const savedV = await Config.get("vertical");
      setVerticalDirection(savedV as DirectionTB);
    };

    init();

    const listenFn = listen<OverlayedConfig>("config_update", event => {
      const { payload } = event;
      if (payload.horizontal) setHorizontalDirection(payload.horizontal as DirectionLR);
      if (payload.vertical) setVerticalDirection(payload.vertical as DirectionTB);
    });

    return () => {
      (async () => {
        await listenFn;
      })();
    };
  }, []);

  return { horizontal, vertical, setHorizontalDirection, setVerticalDirection };
};
