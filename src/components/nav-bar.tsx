import { useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Settings, RefreshCcw, Home, Eye } from "lucide-react";

import { invoke } from "@tauri-apps/api";
import overlayedConfig from "../config";

export const NavBar = ({ clickthrough }: { clickthrough: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
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

  const opacity =
    clickthrough && location.pathname === "/channel"
      ? "opacity-0"
      : "opacity-100";

  return (
    <div
      data-tauri-drag-region
      className={`${opacity} cursor-default rounded-t-lg font-bold select-none pr-3 pl-3 p-2 bg-zinc-900`}
    >
      overlayed
      <div className="float-right flex items-center gap-3">
        <button className="hover:text-blue-500">
          <RefreshCcw
            onClick={() => window.location.reload()}
          />
        </button>
        <button className="hover:text-blue-500">
          <Eye
            onClick={() => {
              invoke("toggle_clickthrough");
              overlayedConfig.set("clickthrough", !clickthrough);
              navigate("/channel");
            }}
          />
        </button>
        <div className="hover:text-blue-500">{getNavLink()}</div>
      </div>
    </div>
  );
};
