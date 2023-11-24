import { useSocket } from "./rpc/manager";
import { Routes, Route } from "react-router-dom";
import { MainView } from "./views/main";
import { ChannelView } from "./views/channel";

import { SettingsView } from "./views/settings";
import { ErrorView } from "./views/error";
import { NavBar } from "./components/nav-bar";
import { useClickthrough } from "./use-clickthrough";
import { useDisableWebFeatures } from "./use-disable-context-menu";
import { useSetWindowSize } from "./use-set-size";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api";

function App() {
  useSocket();
  useDisableWebFeatures();
  useSetWindowSize({ width: 400, height: 600 });

  const { clickthrough } = useClickthrough();

  // NOTE: this is janky and wish we could do all in rust
  useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    darkThemeMq.addEventListener("change", e => {
      const value = e.matches ? "dark" : "light";
      console.log("Theme changed to", value);
      invoke("sync_theme", { value });
    });
  }, []);

  return (
    <div className="text-white h-screen select-none rounded-lg">
      <NavBar clickthrough={clickthrough} />
      <Routes>
        <Route path="/" Component={MainView} />
        <Route path="/channel" Component={ChannelView} />
        <Route path="/settings" Component={SettingsView} />
        <Route path="/error" Component={ErrorView} />
      </Routes>
    </div>
  );
}

export default App;
