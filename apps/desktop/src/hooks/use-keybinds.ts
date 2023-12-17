import { useEffect } from "react";
import { register, isRegistered, unregister } from "@tauri-apps/api/globalShortcut";
import { useAppStore } from "@/store";

// TODO: make this configurable?
const HIDE_TOGGLE_KEYBIND = "Command+Shift+G";
export const useKeybinds = () => {
  const { setAppVisible, visible } = useAppStore();

  useEffect(() => {
    const registerKeybinds = async () => {
      if (await isRegistered(HIDE_TOGGLE_KEYBIND)) {
        await unregister(HIDE_TOGGLE_KEYBIND);
      }

      await register(HIDE_TOGGLE_KEYBIND, () => {
        const newVisible = !visible;

        // invert the current visibility
        setAppVisible(newVisible);
      });
    };

    registerKeybinds();
  }, [visible]);
};
