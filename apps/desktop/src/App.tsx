import { useSocket } from "./rpc/manager";
import { Routes, Route } from "react-router-dom";
import { Main } from "./views/main";
import { Channel } from "./views/channel";

import { Settings } from "./views/settings";
import { Error } from "./views/error";
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
    <div className={`text-white h-screen select-none rounded-lg bg-zinc-900}`}>
      <NavBar clickthrough={clickthrough} />
      <Routes>
        <Route path="/" Component={Main} />
        <Route path="/channel" Component={Channel} />
        <Route path="/settings" Component={Settings} />
        <Route path="/error" Component={Error} />
      </Routes>
    </div>
  );
}

export default App;
