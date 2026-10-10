import { Routes, Route, useLocation } from "react-router-dom";
import { MainView } from "./views/main";
import { ChannelView } from "./views/channel";

import { SettingsView } from "./views/settings";
import { ErrorView } from "./views/error";
import { NavBar } from "./components/nav-bar";
import { usePin } from "./hooks/use-pin";
import { usePlacement } from "./hooks/use-placement";
import { useStartPinned } from "./hooks/use-start-pinned";
import { useHotkeys } from "./hooks/use-hotkeys";
import { useAlign } from "./hooks/use-align";
import { useDisableWebFeatures } from "./hooks/use-disable-context-menu";
import { useUpdate } from "./hooks/use-update";
import { useAppStore } from "./store";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";
import { useSocket } from "./rpc/manager";
import { cn } from "./utils/tw";
import Config from "./config";
import { invoke } from "@tauri-apps/api/core";

function App() {
  useDisableWebFeatures();
  useSocket();

  useEffect(() => {
    const styleForLog = "font-size: 20px; color: #00dffd";
    console.log(`%cOverlayed ${window.location.hash} Window`, styleForLog);
  }, []);

  useEffect(() => {
    (async () => {
      const config = await Config.getConfig();
      await invoke("set_hide_taskbar_when_pinned", {
        hideTaskbarWhenPinned: config.hideTaskbarWhenPinned,
      });
    })();
  }, []);

  const { update } = useUpdate();
  const { visible } = useAppStore();

  const { pin } = usePin();
  useStartPinned();
  useHotkeys();
  const { horizontal, setHorizontalDirection } = useAlign();
  const visibleClass = visible ? "opacity-100" : "opacity-0";
  const location = useLocation();
  const { anchored, channelPlacement, displayOnly, rootRef } = usePlacement(pin, location.pathname);
  const isSettingsWindow = location.pathname === "/settings";

  return (
    <div
      ref={rootRef}
      className={cn(
        `text-white h-screen select-none rounded-lg flex flex-col ${visibleClass}`,
        channelPlacement && "overflow-hidden bg-transparent",
        // Only show the border on the overlay (main) window when not pinned.
        pin || isSettingsWindow ? null : "border border-zinc-600"
      )}
    >
      {!displayOnly && (
        <>
          <NavBar
            isUpdateAvailable={update?.available ?? false}
            pin={pin}
            anchored={anchored}
            alignDirection={horizontal}
            setAlignDirection={setHorizontalDirection}
          />
          <Toaster />
        </>
      )}
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route
          path="/channel"
          element={<ChannelView alignDirection={horizontal} anchored={anchored} displayOnly={displayOnly} />}
        />
        <Route path="/settings" element={<SettingsView update={update} />} />
        <Route path="/error" element={<ErrorView anchored={anchored} />} />
      </Routes>
    </div>
  );
}

export default App;
