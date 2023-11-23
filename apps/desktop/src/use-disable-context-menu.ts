import { useEffect } from "react";

export const useDisableContextMenu = () => {
  useEffect(() => {
    // diable forward back button
    document.addEventListener("keydown", e => {
      if (e.key === "Backspace" && e.target === document.body) {
        e.preventDefault();
      }
    });

    // disable context menu
    document.addEventListener("contextmenu", e => {
      e.preventDefault();
    });
  }, []);
};
