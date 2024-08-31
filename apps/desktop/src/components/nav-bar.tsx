import { useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  Pin,
  Download,
  ArrowLeftToLine,
  ArrowRightToLine,
  ChevronsRightLeft,
  type LucideIcon,
} from "lucide-react";
import { usePlatformInfo } from "@/hooks/use-platform-info";
import React, { useEffect } from "react";
import Config, { type DirectionLR } from "../config";
import { useAppStore } from "../store";
import { useState } from "react";
import { CHANNEL_TYPES } from "@/constants";
import { Metric, track } from "@/metrics";
import { invoke } from "@tauri-apps/api/core";
const mapping = {
  left: 0,
  center: 1,
  right: 2,
};

interface Alignment {
  direction: DirectionLR;
  name: string;
  icon: LucideIcon;
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
  pin,
  alignDirection,
  setAlignDirection,
  isUpdateAvailable,
}: {
  pin: boolean;
  alignDirection: DirectionLR;
  setAlignDirection: React.Dispatch<React.SetStateAction<DirectionLR>>;
  isUpdateAvailable: boolean;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentChannel } = useAppStore();

  const [channelName, setChannelName] = useState<string>();
  const [currentAlignment, setCurrentAlignment] = useState(mapping[alignDirection]);

  const opacity = pin && location.pathname === "/channel" ? "opacity-0" : "opacity-100";
  const IconComponent = horizontalAlignments[currentAlignment]?.icon || ArrowLeftToLine;
  const showUpdateButton = location.pathname !== "/settings" && isUpdateAvailable;

  const routesToShowOn = ["/channel", "/error", "/"];
  const { canary } = usePlatformInfo();
  if (!routesToShowOn.includes(location.pathname)) return null;

  useEffect(() => {
    if (!!currentChannel && ([CHANNEL_TYPES.DM, CHANNEL_TYPES.GROUP_DM] as number[]).includes(currentChannel.type)) {
      setChannelName("Private call");
    } else {
      setChannelName(currentChannel?.name);
    }
  }, [location.pathname, currentChannel]);

  return (
    <div
      className={`${opacity} cursor-move rounded-t-lg font-bold select-none bg-white dark:bg-zinc-900 pr-3 pl-3 p-2`}
    >
      <div data-tauri-drag-region className="flex justify-between">
        <div className="flex items-center">
          <img
            src={canary ? "/img/32x32-canary.png " : "/img/32x32.png"}
            alt="logo"
            data-tauri-drag-region
            className="w-8 h-8 mr-2"
          />

          {channelName ? (
            <div data-tauri-drag-region className="hidden md:inline">
              {channelName}
            </div>
          ) : (
            <div data-tauri-drag-region>Overlayed</div>
          )}
        </div>
        {location.pathname !== "/settings" && (
          <div className="hidden gap-4 md:flex">
            {!canary && showUpdateButton && (
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
                onClick={async () => {
                  const newAlignment = (currentAlignment + 1) % horizontalAlignments.length;
                  setCurrentAlignment(newAlignment);
                  setAlignDirection(horizontalAlignments[newAlignment]?.direction || "center");
                  await Config.set("horizontal", horizontalAlignments[newAlignment]?.direction || "center");
                }}
              />
            </button>
            <button title="Enable pin">
              <Pin
                size={20}
                onClick={async () => {
                  await invoke("toggle_pin");
                  await Config.set("pin", !pin);
                  // track if it gets pinned
                  track(Metric.Pin, 1);
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
