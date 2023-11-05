import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

export const useClickthrough = () => {
  const [clickthrough, setClickthrough] = useState(false);
  useEffect(() => {
    console.log("APP: calling socket init");

    const unlisten = listen < boolean > ("toggle_clickthrough", (event) => {
      setClickthrough(event.payload);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return { clickthrough };
};
