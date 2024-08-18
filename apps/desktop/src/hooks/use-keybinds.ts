import { useEffect } from "react";
import { register, isRegistered, unregister } from "@tauri-apps/plugin-global-shortcut";
import { useAppStore } from "@/store";
import { invoke } from "@tauri-apps/api/core";

// TODO: make these configurable?
const HIDE_TOGGLE_KEYBIND = "Command+Shift+G";
const TOGGLE_PIN_KEYBIND = "Command+Shift+H";

// BUG: this is happening on the settings page!!!
// TODO: this might need some rework to be better
export const useKeybinds = () => {
  const { setAppVisible, visible } = useAppStore();

  useEffect(() => {
    const registerKeybind = async () => {
      if (await isRegistered(HIDE_TOGGLE_KEYBIND)) {
        await unregister(HIDE_TOGGLE_KEYBIND);
      }

      await register(HIDE_TOGGLE_KEYBIND, () => {
        const newVisible = !visible;

        // invert the current visibility
        setAppVisible(newVisible);
      });
    };

    registerKeybind();
  }, [visible]);

  useEffect(() => {
    const registerKeybind = async () => {
      if (await isRegistered(TOGGLE_PIN_KEYBIND)) {
        await unregister(TOGGLE_PIN_KEYBIND);
      }

      await register(TOGGLE_PIN_KEYBIND, () => {
        invoke("toggle_pin");
      });
    };

    registerKeybind();
  }, []);
};
