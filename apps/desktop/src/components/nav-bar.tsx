import { Link, useLocation, useNavigate } from "react-router-dom";
import { Settings, Pin } from "lucide-react";

import { invoke } from "@tauri-apps/api";
import overlayedConfig from "../config";
import { Button } from "./ui/button";

export const NavBar = ({ clickthrough }: { clickthrough: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const opacity =
    clickthrough && location.pathname === "/channel"
      ? "opacity-0"
      : "opacity-100";

  return (
    <div
      data-tauri-drag-region
      className={`${opacity} cursor-default rounded-t-lg font-bold select-none pr-3 pl-3 p-2 bg-zinc-900`}
    >
      <div className="inline">
        <div data-tauri-drag-region className="hidden md:inline">overlayed</div>
        <div data-tauri-drag-region className="md:hidden">
          <img
            src="/img/32x32.png"
            alt="logo"
            data-tauri-drag-region
            className="w-8 h-8"
          />
        </div>
      </div>

      <div className="float-right hidden md:flex items-center gap-3">
        <Button intent="secondary" size="small">
          <Pin
            size={20}
            onClick={() => {
              invoke("toggle_clickthrough");
              overlayedConfig.set("clickthrough", !clickthrough);
              navigate("/channel");
            }}
          />
        </Button>
        <Button intent="secondary" size="small">
          <Link to="/settings">
            <Settings size={20} />
          </Link>
        </Button>
      </div>
    </div>
  );
};
