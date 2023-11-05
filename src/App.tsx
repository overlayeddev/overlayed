import socket from "./rpc/manager";
import { useEffect, useState } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Main } from "./views/main";
import { Channel } from "./views/channel";

import { Settings } from "./views/settings";
import { Error } from "./views/error";
import { NavBar } from "./components/nav-bar";
import { invalidateWindowShadows } from "./utils";
import { listen } from "@tauri-apps/api/event";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [clickthrough, setClickthrough] = useState(false);
  const [mouseInViewport, setMouseInViewport] = useState(false);

  useEffect(() => {
    console.log("APP: calling socket init");
    socket.init(navigate);
    appWindow.setAlwaysOnTop(true);

    const unlisten = listen < boolean > ("toggle_clickthrough", (event) => {
      // event.event is the event name (useful if you want to use a single callback fn for multiple event types)
      // event.payload is the payload object
      console.log(event);
      setClickthrough(event.payload);
    });

    const mouseOutFn = () => {
      setMouseInViewport(false);
    };
    window.addEventListener("mouseout", mouseOutFn);

    const mouseOverFn = () => {
      setMouseInViewport(true);
    };
    window.addEventListener("mouseover", mouseOverFn);

    return () => {
      mouseOutFn();
      mouseOverFn();
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    invalidateWindowShadows();
  }, [location]);

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
