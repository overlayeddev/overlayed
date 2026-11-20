import { PhysicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
const appWindow = getCurrentWebviewWindow();

// `setSize`, except on a Wayland layer surface where the size has to be a
// size request on the content (see src-tauri/src/layer.rs)
const setSize = (size: PhysicalSize) => invoke("layer_set_size", { width: size.width, height: size.height });

export const useSetWindowSize = ({
  width,
  height,
  enabled = true,
}: {
  width: number;
  height: number;
  enabled?: boolean;
}) => {
  const lastSizeRef = useRef<PhysicalSize | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    lastSizeRef.current = null;
    appWindow.outerSize().then(size => {
      if (disposed) return;
      lastSizeRef.current = size;

      // set the new
      void setSize(new PhysicalSize(width, height));
    });

    // on unmount save the last size
    return () => {
      disposed = true;
      if (enabledRef.current && lastSizeRef.current) {
        void setSize(lastSizeRef.current);
      }
    };
  }, [enabled]);
};
