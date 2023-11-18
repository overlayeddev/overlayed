import { useEffect } from "react";

export const useDisableContextMenu = () => {
  useEffect(() => {
    // disable context menu
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }, []);
};
