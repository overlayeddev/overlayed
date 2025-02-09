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
import { useEffect } from "react";
import { useSocket } from "./rpc/manager";
import { cn } from "./utils/tw";
import React from "react";
import { LazyStore } from "@tauri-apps/plugin-store";
import { useConfigValueV2 } from "./hooks/use-config-value";
import { twMerge } from "tailwind-merge";

export const settings = new LazyStore("config.json");
export const SettingContext = React.createContext(settings);

function App() {
  useDisableWebFeatures();
  useSocket();

  useEffect(() => {
    const styleForLog = "font-size: 20px; color: #00dffd";
    console.log(`%cOverlayed ${window.location.hash} Window`, styleForLog);
  }, []);

  const { update } = useUpdate();
  const { visible } = useAppStore();
  const { value: pin } = useConfigValueV2("pin");

  const { horizontal, setHorizontalDirection } = useAlign();
  const visibleClass = visible ? "opacity-100" : "opacity-0";
  const location = useLocation();

  return (
    <div
      className={twMerge(
        cn("text-white h-screen select-none rounded-lg", visibleClass),
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
  return (
    <SettingContext.Provider value={settings}>
      <App />
    </SettingContext.Provider>
  );
}

export default AppWrapper;
