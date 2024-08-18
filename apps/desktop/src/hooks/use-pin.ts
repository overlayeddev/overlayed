import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import Config from "../config";
import { invoke } from "@tauri-apps/api/core";

export const usePin = () => {
  const [pin, setPin] = useState(false);
  useEffect(() => {
    // sub if it changes from outside of tauri
    const unlisten = listen<boolean>("toggle_pin", async event => {
      setPin(event.payload);
      await Config.set("pin", event.payload);
    });

    // This is so we can sync the state
    invoke<boolean>("get_pin").then(pin => setPin(pin));

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  return { pin };
};
