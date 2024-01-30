import { useSocket } from "./rpc/manager";
import { Routes, Route } from "react-router-dom";
import { MainView } from "./views/main";
import { ChannelView } from "./views/channel";

import { SettingsView } from "./views/settings";
import { ErrorView } from "./views/error";
import { NavBar } from "./components/nav-bar";
import { useClickthrough } from "./hooks/use-clickthrough";
import { useAlign } from "./hooks/use-align";
import { useDisableWebFeatures } from "./hooks/use-disable-context-menu";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import { useUpdate } from "./hooks/use-update";
import { useKeybinds } from "./hooks/use-keybinds";
import { useAppStore } from "./store";
import { emit } from "@tauri-apps/api/event";

function App() {
  useKeybinds();
  useSocket();
  useDisableWebFeatures();
  const { isAvailable, error, status } = useUpdate();
  const { visible } = useAppStore();

  const { clickthrough } = useClickthrough();
  const { horizontal, setHorizontalDirection } = useAlign();

  // NOTE: this is janky and wish we could do all in rust
  useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    darkThemeMq.addEventListener("change", e => {
      const value = e.matches ? "dark" : "light";
      invoke("sync_theme", { value });
    });
  }, []);

  const visibleClass = visible ? "opacity-100" : "opacity-0";
  return (
    <div className={`text-white h-screen select-none rounded-lg ${visibleClass}`}>
      <NavBar
        isUpdateAvailable={isAvailable}
        clickthrough={clickthrough}
        alignDirection={horizontal}
        setAlignDirection={setHorizontalDirection}
      />
      <Routes>
        <Route path="/" Component={MainView} />
        <Route path="/channel" element={<ChannelView alignDirection={horizontal} />} />
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
