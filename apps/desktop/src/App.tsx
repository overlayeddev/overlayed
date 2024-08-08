import { useSocket } from "./rpc/manager";
import { Routes, Route } from "react-router-dom";
import { MainView } from "./views/main";
import { ChannelView } from "./views/channel";

import { SettingsView } from "./views/settings";
import { ErrorView } from "./views/error";
import { NavBar } from "./components/nav-bar";
import { usePin } from "./hooks/use-pin";
import { useAlign } from "./hooks/use-align";
import { useDisableWebFeatures } from "./hooks/use-disable-context-menu";
import { useUpdate } from "./hooks/use-update";
import { useAppStore } from "./store";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";
import { Button } from "./components/ui/button";
import { RPCCommand } from "./rpc/command";

function App() {
  const socket = useSocket();
  useDisableWebFeatures();

  useEffect(() => {
    const styleForLog = "font-size: 20px; color: #00dffd";
    console.log(`%cOverlayed ${window.location.hash} Window`, styleForLog);
  }, []);

  const { isAvailable, error, status } = useUpdate();
  const { visible } = useAppStore();

  const { pin } = usePin();
  const { horizontal, setHorizontalDirection } = useAlign();

  const visibleClass = visible ? "opacity-100" : "opacity-0";

  return (
    <div className={`text-white h-screen select-none rounded-lg ${visibleClass}`}>
      {!pin && (
        <NavBar
          isUpdateAvailable={isAvailable}
          pin={pin}
          alignDirection={horizontal}
          setAlignDirection={setHorizontalDirection}
        />
      )}

      <Button
        onClick={async () => {
          const allSounds = await socket?.getSoundBoardItems();
          console.log({ allSounds });

          // play ahh
          socket?.send({
            cmd: RPCCommand.PLAY_SOUNDBOARD_SOUND,
            args: {
              name: "cricket",
              sound_id: "3",
              guild_id: "DEFAULT",
            },
          });
        }}
      >
        Test soundbard
      </Button>
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
