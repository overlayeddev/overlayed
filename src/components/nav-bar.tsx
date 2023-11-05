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
      className="cursor-default rounded-t-lg font-bold select-none p-2 bg-zinc-900"
    >
      overlayed
      <div className="float-right flex gap-2">
        <div>
          <button>
            <Eye
              onClick={() => {
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
