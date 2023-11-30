import { useSocket } from "./rpc/manager";
import { Routes, Route } from "react-router-dom";
import { MainView } from "./views/main";
import { ChannelView } from "./views/channel";

import { SettingsView } from "./views/settings";
import { ErrorView } from "./views/error";
import { NavBar } from "./components/nav-bar";
import { useClickthrough } from "./hooks/use-clickthrough";
import { useDisableWebFeatures } from "./hooks/use-disable-context-menu";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import { useUpdate } from "./hooks/use-update";

function App() {
  useSocket();
  useDisableWebFeatures();
  const { isAvailable, error, status } = useUpdate();

  const { clickthrough } = useClickthrough();

  // NOTE: this is janky and wish we could do all in rust
  useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    darkThemeMq.addEventListener("change", e => {
      const value = e.matches ? "dark" : "light";
      invoke("sync_theme", { value });
    });
  }, []);

  return (
    <div className="text-white h-screen select-none rounded-lg">
      <NavBar isUpdateAvailable={isAvailable} clickthrough={clickthrough} />
      <Routes>
        <Route path="/" Component={MainView} />
        <Route path="/channel" Component={ChannelView} />
        <Route
          path="/settings"
          element={
            <SettingsView
              update={{
                isAvailable,
                error,
                status,
              }}
            />
          }
        />
        <Route path="/error" Component={ErrorView} />
      </Routes>
    </div>
  );
}

export default App;
