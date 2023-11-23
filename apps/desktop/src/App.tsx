import { useSocket } from "./rpc/manager";
import { Routes, Route } from "react-router-dom";
import { MainView } from "./views/main";
import { ChannelView } from "./views/channel";

import { SettingsView } from "./views/settings";
import { ErrorView } from "./views/error";
import { NavBar } from "./components/nav-bar";
import { useClickthrough } from "./use-clickthrough";
import { useDisableContextMenu } from "./use-disable-context-menu";
import { useSetWindowSize } from "./use-set-size";

function App() {
  useSocket();
  useDisableContextMenu();
  useSetWindowSize({ width: 400, height: 600 });

  const { clickthrough } = useClickthrough();

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
