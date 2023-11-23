import { Link, useLocation, useNavigate } from "react-router-dom";
import { Settings, Pin } from "lucide-react";

import { invoke } from "@tauri-apps/api";
import overlayedConfig from "../config";
import { useAppStore } from "../store";

export const NavBar = ({ clickthrough }: { clickthrough: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentChannel } = useAppStore();
  const opacity = clickthrough && location.pathname === "/channel" ? "opacity-0" : "opacity-100";

  return (
    <div
      data-tauri-drag-region
      className={`${opacity} cursor-default rounded-t-lg font-bold select-none pr-3 pl-3 p-2 bg-zinc-900`}
    >
      <div data-tauri-drag-region className="flex justify-between">
        <div className="flex items-center">
          <img src="/img/32x32.png" alt="logo" data-tauri-drag-region className="w-8 h-8 mr-2" />
          {location.pathname === "/channel" ? (
            <div data-tauri-drag-region className="hidden md:inline">
              {currentChannel?.name}
            </div>
          ) : (
            <div data-tauri-drag-region>Overlayed</div>
          )}
        </div>
        <div className="hidden md:flex">
          <button className="px-4">
            <Pin
              size={20}
              onClick={() => {
                invoke("toggle_clickthrough");
                overlayedConfig.set("clickthrough", !clickthrough);
                navigate("/channel");
              }}
            />
          </button>
          <button>
            <Link to="/settings">
              <Settings size={20} />
            </Link>
          </button>
        </div>
      </div>
    </div>
  );
};
