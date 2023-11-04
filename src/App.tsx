import socket from "./rpc/manager";
import { useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { Routes, Route } from "react-router-dom";
import { Main } from "./views/main";
import { Channel } from "./views/channel";

import { useNavigate } from "react-router-dom";
import { Settings } from "./views/settings";
import { Error } from "./views/error";
import { NavBar } from "./components/nav-bar";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    socket.init(navigate);
    appWindow.setAlwaysOnTop(true);
  }, []);

  return (
    <div className="container text-white">
      <NavBar />
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
