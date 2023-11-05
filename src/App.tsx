import socket from "./rpc/manager";
import { useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Main } from "./views/main";
import { Channel } from "./views/channel";

import { Settings } from "./views/settings";
import { Error } from "./views/error";
import { NavBar } from "./components/nav-bar";
import { invalidateWindowShadows } from "./utils";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    console.log("APP: calling socket init");
    socket.init(navigate);
    appWindow.setAlwaysOnTop(true);
  }, []);

  useEffect(() => { 
    invalidateWindowShadows()
  }, [location]);

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
