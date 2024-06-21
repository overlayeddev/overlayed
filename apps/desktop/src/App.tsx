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
import { useUpdate } from "./hooks/use-update";
import { useAppStore } from "./store";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";

function App() {
  useSocket();
  useDisableWebFeatures();

  useEffect(() => {
    const styleForLog = "font-size: 20px; color: #00dffd";
    console.log(`%cOverlayed ${window.location.hash} Window`, styleForLog);
  }, []);

  const { isAvailable, error, status } = useUpdate();
  const { visible } = useAppStore();

  const { clickthrough } = useClickthrough();
  const { horizontal, setHorizontalDirection } = useAlign();

  const visibleClass = visible ? "opacity-100" : "opacity-0";

  return (
    <div className={`text-white h-screen select-none rounded-lg ${visibleClass}`}>
      {!clickthrough && (
        <NavBar
          isUpdateAvailable={isAvailable}
          clickthrough={clickthrough}
          alignDirection={horizontal}
          setAlignDirection={setHorizontalDirection}
        />
      )}

      <Toaster />
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
