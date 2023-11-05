import { useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Settings, Home, Eye } from "lucide-react";

import { invoke } from "@tauri-apps/api";

export const NavBar = ({ clickthrough }: { clickthrough: boolean }) => {
  const location = useLocation();
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
      className="cursor-default rounded-t-lg font-bold select-none p-2 hover:bg-zinc-800 bg-zinc-900"
    >
      overlayed
      <div className="float-right flex items-center gap-2">
        <button className="hover:text-blue-500">
          <Eye
            onClick={() => {
              invoke("toggle_clickthrough");
            }}
          />
        </button>
        <div className="hover:text-blue-500">{getNavLink()}</div>
      </div>
    </div>
  );
};
