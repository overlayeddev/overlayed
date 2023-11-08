import { useSocket } from "./rpc/manager";
import { Routes, Route } from "react-router-dom";
import { Main } from "./views/main";
import { Channel } from "./views/channel";

import { Settings } from "./views/settings";
import { Error } from "./views/error";
import { NavBar } from "./components/nav-bar";
import { useClickthrough } from "./use-clickthrough";
import { useBorder } from "./use-border";

function App() {
  useSocket();

  const { clickthrough } = useClickthrough();
  const { mouseInViewport } = useBorder();

  const border =
    !clickthrough && mouseInViewport
      ? "hover:border-blue-500"
      : "border-transparent";

  return (
    <div
      data-tauri-drag-region
      className={`text-white h-screen select-none ${border} border-transparent border-2 rounded-lg bg-zinc-900}`}
    >
      <NavBar clickthrough={clickthrough} />
      <div className="container">
        <Routes>
          <Route path="/" Component={Main} />
          <Route path="/channel" Component={Channel} />
          <Route path="/settings" Component={Settings} />
          <Route path="/error" Component={Error} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
