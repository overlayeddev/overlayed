import { LogicalSize, appWindow } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";

export const useSetWindowSize = ({ width, height }: { width: number; height: number }) => {
  const lastSizeRef = useRef<LogicalSize | null>(null);

  useEffect(() => {
    appWindow.outerSize().then(size => {
      lastSizeRef.current = size;

      // set the new
      appWindow.setSize(new LogicalSize(width, height));
    });

    // on unmount save the last size
    return () => {
      if (lastSizeRef.current) {
        appWindow.setSize(lastSizeRef.current);
      }
    };
  }, []);
};
