import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import Config from "../config";
import { invoke } from "@tauri-apps/api/core";

export const usePin = () => {
  const [pin, setPin] = useState(false);
  useEffect(() => {
    let gotEvent = false;
    // sub if it changes from outside of tauri
    const unlisten = listen<boolean>("toggle_pin", async event => {
      gotEvent = true;
      setPin(event.payload);
      await Config.set("pin", event.payload);
    });

    // Sync the state once the listener is registered, without overriding
    // a newer value that already arrived as an event (e.g. from startPinned)
    unlisten
      .then(() => invoke<boolean>("get_pin"))
      .then(pin => {
        if (!gotEvent) setPin(pin);
      });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  return { pin };
};
