import { useLocation, useNavigate } from "react-router-dom";
import { Settings, Pin, Download, ArrowLeftToLine, ArrowRightToLine, ChevronsRightLeft } from "lucide-react";

import React from "react";
import { invoke } from "@tauri-apps/api";
import overlayedConfig, { type DirectionLR } from "../config";
import { useAppStore } from "../store";
import { useState } from "react";

const mapping = {
  left: 0,
  center: 1,
  right: 2,
};

interface Alignment {
  direction: DirectionLR;
  name: string;
  icon: React.FC<any>;
}

const horizontalAlignments: Alignment[] = [
  {
    direction: "left",
    name: "Left",
    icon: ArrowLeftToLine,
  },
  {
    direction: "center",
    name: "Center",
    icon: ChevronsRightLeft,
  },
  {
    direction: "right",
    name: "Right",
    icon: ArrowRightToLine,
  },
];

export const NavBar = ({
  clickthrough,
  alignDirection,
  setAlignDirection,
  isUpdateAvailable,
}: {
  clickthrough: boolean;
  alignDirection: DirectionLR;
  setAlignDirection: React.Dispatch<React.SetStateAction<DirectionLR>>;
  isUpdateAvailable: boolean;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentChannel } = useAppStore();
  const [currentAlignment, setCurrentAlignment] = useState(mapping[alignDirection]);

  const opacity = clickthrough && location.pathname === "/channel" ? "opacity-0" : "opacity-100";
  const IconComponent = horizontalAlignments[currentAlignment]?.icon || ArrowLeftToLine;
  const showUpdateButton = location.pathname !== "/settings" && isUpdateAvailable;

  const routesToShowOn = ["/channel", "/error", "/"];
  if (!routesToShowOn.includes(location.pathname)) return null;

  return (
    <div
      data-tauri-drag-region
      className={`${opacity} cursor-default rounded-t-lg font-bold select-none bg-white dark:bg-zinc-900 pr-3 pl-3 p-2`}
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
        {location.pathname !== "/settings" && (
          <div className="hidden gap-4 md:flex">
            {showUpdateButton && (
              <button>
                <Download
                  className="text-green-500"
                  size={20}
                  onClick={() => {
                    invoke("open_settings", {
                      update: true,
                    });
                  }}
                />
              </button>
            )}
            <button title={horizontalAlignments[currentAlignment]?.name + "-aligned. Click to toggle."}>
              <IconComponent
                size={20}
                onClick={() => {
                  const newAlignment = (currentAlignment + 1) % horizontalAlignments.length;
                  setCurrentAlignment(newAlignment);
                  setAlignDirection(horizontalAlignments[newAlignment]?.direction || "center");
                  overlayedConfig.set("horizontal", horizontalAlignments[newAlignment]?.direction || "center");
                }}
              />
            </button>
            <button title="Enable clickthrough">
              <Pin
                size={20}
                onClick={() => {
                  invoke("toggle_clickthrough");
                  overlayedConfig.set("clickthrough", !clickthrough);
                  navigate("/channel");
                }}
              />
            </button>
            <button
              title="Settings"
              onClick={() => {
                invoke("open_settings", { update: false });
              }}
            >
              <Settings size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
