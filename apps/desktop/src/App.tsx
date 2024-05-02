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
import { useKeybinds } from "./hooks/use-keybinds";
import { useAppStore } from "./store";
import { useThemeSync } from "./hooks/use-theme-sync";
import { Toaster } from "./components/ui/toaster";
import { Suspense, useEffect, useRef } from "react";
import { migrate } from "./migrations/new-app-id";
("./migrations/new-app-id");

function App() {

  const migrateRef = useRef(false);

  useKeybinds();
  useSocket();
  useThemeSync();
  useDisableWebFeatures();

  useEffect(() => {
    const styleForLog = "font-size: 20px; color: #00dffd";
    console.log(`%cOverlayed ${document.title} Window`, styleForLog);
  }, []);

  const { isAvailable, error, status } = useUpdate();
  const { visible } = useAppStore();

  const { clickthrough } = useClickthrough();
  const { horizontal, setHorizontalDirection } = useAlign();

  const visibleClass = visible ? "opacity-100" : "opacity-0";

  // run migrations and show loading spinner if doing them
  useEffect(() => {
    if (migrateRef.current) return;
    
    migrate().then(() => console.log("Migrations complete"))

    // mark it done
    migrateRef.current = true;

  }, []);

  return (
    <Suspense fallback={<h2>Running..</h2>}>
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
    </Suspense>
  );
}

export default App;

