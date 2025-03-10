import { Routes, Route, useLocation } from "react-router-dom";
import { MainView } from "./views/main";
import { ChannelView } from "./views/channel";

import { SettingsView } from "./views/settings";
import { ErrorView } from "./views/error";
import { NavBar } from "./components/nav-bar";
import { useDisableWebFeatures } from "./hooks/use-disable-context-menu";
import { useUpdate } from "./hooks/use-update";
import { useAppStore } from "./store";
import { Toaster } from "./components/ui/toaster";
import { useEffect, useState } from "react";
import { useSocket } from "./rpc/manager";
import { cn } from "./utils/tw";
import { LazyStore } from "@tauri-apps/plugin-store";
import { twMerge } from "tailwind-merge";
import { useSettings } from "./hooks/use-settings";

export const settings = new LazyStore("config.json");

function App() {
  useDisableWebFeatures();
  useSocket();

  useEffect(() => {
    const styleForLog = "font-size: 20px; color: #00dffd";
    console.log(`%cOverlayed ${window.location.hash} Window`, styleForLog);
  }, []);

  const allSettings = useSettings();
  const { update } = useUpdate();
  const store = useAppStore();
  const location = useLocation();

  const { pinned, horizontal } = store.settings;
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!allSettings) return;
    console.log("all settings", allSettings);
    setIsLoading(true);
    store.loadSettings(allSettings);
    setIsLoading(false);
  }, [allSettings]);

  if (isLoading) <p>loading...</p>;

  return (
    <div
      className={twMerge(
        cn("text-white h-screen select-none rounded-lg"),
        !pinned && location.pathname === "/channel" ? "border border-accent" : ""
      )}
    >
      {!pinned && <NavBar isUpdateAvailable={update?.available ?? false} pin={pinned} alignDirection={horizontal} />}
      <Toaster />
      <Routes>
        <Route path="/" Component={MainView} />
        <Route path="/channel" element={<ChannelView alignDirection={horizontal} />} />
        <Route path="/settings" element={<SettingsView update={update} />} />
        <Route path="/error" Component={ErrorView} />
      </Routes>
    </div>
  );
}

export default App;
