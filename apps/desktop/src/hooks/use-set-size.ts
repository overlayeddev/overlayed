import { PhysicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useRef } from "react";
const appWindow = getCurrentWebviewWindow();

export const useSetWindowSize = ({ width, height }: { width: number; height: number }) => {
  const lastSizeRef = useRef<PhysicalSize | null>(null);

  useEffect(() => {
    appWindow.outerSize().then(size => {
      lastSizeRef.current = size;

      // set the new
      appWindow.setSize(new PhysicalSize(width, height));
    });

    // on unmount save the last size
    return () => {
      if (lastSizeRef.current) {
        appWindow.setSize(lastSizeRef.current);
      }
    };
  }, []);
};
