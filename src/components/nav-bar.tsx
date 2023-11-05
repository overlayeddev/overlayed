import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Settings, Home, Eye, EyeOff } from "lucide-react";

import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api";

export const NavBar = () => {
  const location = useLocation();
  const [clickthrough, setClickthrough] = useState(false);

  useEffect(() => {
    const unlisten = listen < boolean > ("toggle_clickthrough", (event) => {
      // event.event is the event name (useful if you want to use a single callback fn for multiple event types)
      // event.payload is the payload object
      console.log(event);
      setClickthrough(event.payload);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const getNavLink = useCallback(() => {
    if (["/channel", "/"].includes(location.pathname)) {
      return (
        <Link to="/settings">
          <Settings size={20} />
        </Link>
      );
    }

    if (location.pathname === "/error") {
      return null;
    }

    if (location.pathname === "/settings") {
      return (
        <Link to="/channel">
          <Home size={20} />
        </Link>
      );
    }
  }, [location.pathname]);

  if (clickthrough && location.pathname === "/channel") return null;

  return (
    <div
      data-tauri-drag-region
      className="cursor-default rounded-t-lg font-bold select-none p-2 bg-zinc-900"
    >
      overlayed
      <div className="float-right flex gap-2">
        <div>
          <button>
            <Eye
              onClick={() => {
                setClickthrough(!clickthrough);
                invoke("toggle_clickthrough", { enabled: !clickthrough });
              }}
            />
          </button>
        </div>
        <div>{getNavLink()}</div>
      </div>
    </div>
  );
};
