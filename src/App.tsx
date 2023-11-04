import socket from "./rpc/manager";
import { useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { Routes, Route } from "react-router-dom";
import { Main } from "./views/main";
import { Channel } from "./views/channel";

import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    socket.init(navigate);
    appWindow.setAlwaysOnTop(true);
  }, []);

  return (
    <div className="container">
      <div
        data-tauri-drag-region
        className="cursor-default rounded-t-md font-bold select-none p-2 bg-zinc-900 text-white"
      >
        overlayed
      </div>
      <Routes>
        <Route path="/" Component={Main} />
        <Route path="/channel" Component={Channel} />
      </Routes>
      {/* <pre className="text-white">{JSON.stringify({ currentChannel }, null, 2)}</pre> */}
    </div>
  );
}

export default App;
