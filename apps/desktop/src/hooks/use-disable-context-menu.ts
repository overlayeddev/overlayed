import { useEffect } from "react";

export const useDisableWebFeatures = () => {
  useEffect(() => {
    // disable forward back button
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
