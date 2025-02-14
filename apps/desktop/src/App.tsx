import { Routes, Route, useLocation } from "react-router-dom";
import { MainView } from "./views/main";
import { ChannelView } from "./views/channel";

import { SettingsView } from "./views/settings";
import { ErrorView } from "./views/error";
import { NavBar } from "./components/nav-bar";
import { useAlign } from "./hooks/use-align";
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

  const { update } = useUpdate();
  const { settings } = useAppStore();

  const pin = settings.pinned;

  const { horizontal, setHorizontalDirection } = useAlign();
  const location = useLocation();

  return (
    <div
      className={twMerge(
        cn("text-white h-screen select-none rounded-lg"),
        !pin && location.pathname === "/channel" ? "border border-accent" : ""
      )}
    >
      {!pin && (
        <NavBar
          isUpdateAvailable={update?.available ?? false}
          pin={pin}
          alignDirection={horizontal}
          setAlignDirection={setHorizontalDirection}
        />
      )}
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

function AppWrapper() {
  const store = useAppStore();
  const allSettings = useSettings();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!allSettings) return;
    setIsLoading(true);
    store.loadSettings(allSettings);
    setIsLoading(false);
  }, [allSettings]);

  if (isLoading) <p>loading...</p>;

  return <App />;
}

export default AppWrapper;
