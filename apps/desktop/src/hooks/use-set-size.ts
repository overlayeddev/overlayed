import { PhysicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useRef } from "react";
const appWindow = getCurrentWebviewWindow();

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
      appWindow.setSize(new PhysicalSize(width, height));
    });

    // on unmount save the last size
    return () => {
      disposed = true;
      if (enabledRef.current && lastSizeRef.current) {
        appWindow.setSize(lastSizeRef.current);
      }
    };
  }, [enabled]);
};
