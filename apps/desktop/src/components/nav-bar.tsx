import { useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  Pin,
  Download,
  ArrowLeftToLine,
  ArrowRightToLine,
  ChevronsRightLeft,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePlatformInfo } from "@/hooks/use-platform-info";
import React, { useEffect } from "react";
import Config, { type DirectionLR } from "../config";
import { useAppStore } from "../store";
import { useState } from "react";
import { CHANNEL_TYPES, FTUE_PIN_TRAY_TIP_KEY } from "@/constants";
import { Metric, track } from "@/metrics";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";

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
  const { currentChannel, me } = useAppStore();

  const [channelName, setChannelName] = useState<string>();
  const [currentAlignment, setCurrentAlignment] = useState(mapping[alignDirection]);

  // keep local currentAlignment in sync when the prop changes (e.g., loaded from config)
  useEffect(() => {
    setCurrentAlignment(mapping[alignDirection] ?? mapping.right);
  }, [alignDirection]);

  const opacity = pin && location.pathname === "/channel" ? "opacity-0" : "opacity-100";
  const IconComponent = horizontalAlignments[currentAlignment]?.icon || ArrowLeftToLine;
  const showUpdateButton = location.pathname !== "/settings" && isUpdateAvailable;

  const routesToShowOn = ["/channel", "/error", "/"];
  const { canary, os } = usePlatformInfo();
  const [showFtue, setShowFtue] = useState(() => !localStorage.getItem(FTUE_PIN_TRAY_TIP_KEY));

  const dismissFtue = () => {
    localStorage.setItem(FTUE_PIN_TRAY_TIP_KEY, "true");
    setShowFtue(false);
  };

  if (!routesToShowOn.includes(location.pathname)) return null;

  useEffect(() => {
    // Listen for storage changes from other windows (e.g., settings clearing FTUE key)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === FTUE_PIN_TRAY_TIP_KEY && e.newValue === null) {
        setShowFtue(true);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (!!currentChannel && ([CHANNEL_TYPES.DM, CHANNEL_TYPES.GROUP_DM] as number[]).includes(currentChannel.type)) {
      setChannelName("Private call");
    } else {
      setChannelName(currentChannel?.name);
    }
  }, [location.pathname, currentChannel]);

  function getTrayHint(os: string): React.ReactNode {
    if (os === "windows") {
      return (
        <>
          Pinning hides this frame to only show the users in the call.
          <br />
          <br />
          Unpin or access Settings anytime via the <strong className="text-white">system tray</strong> icon in the near
          the clock in your taskbar.
        </>
      );
    }
    if (os === "macos") {
      return (
        <>
          Pinning hides this frame to only show the users in the call.
          <br />
          <br />
          Unpin or access Settings anytime via the <strong className="text-white">menu bar</strong> icon in the
          top-right of your screen.
        </>
      );
    }
    return (
      <>
        Pinning hides this frame to only show the users in the call.
        <br />
        <br />
        Unpin or access Settings anytime via the <strong className="text-white">system tray</strong> /{" "}
        <strong className="text-white">notification area</strong> icon.
      </>
    );
  }

  return (
    <div
      className={`${opacity} cursor-move rounded-t-lg font-bold select-none bg-white dark:bg-zinc-900 pr-3 pl-3 p-2`}
    >
      <div data-tauri-drag-region className="flex justify-between">
        <div className="flex items-center">
          <img
            src={canary ? "/img/32x32-canary.png" : "/img/32x32.png"}
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
              <button className="cursor-pointer">
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
            <button
              className="cursor-pointer"
              title={horizontalAlignments[currentAlignment]?.name + "-aligned. Click to toggle."}
            >
              <IconComponent
                size={20}
                onClick={async () => {
                  const newAlignment = (currentAlignment + 1) % horizontalAlignments.length;
                  setCurrentAlignment(newAlignment);
                  const dir = horizontalAlignments[newAlignment]?.direction || "center";
                  setAlignDirection(dir);
                  await Config.set("horizontal", dir);
                  await emit("config_update", await Config.getConfig());
                }}
              />
            </button>
            <div className="relative flex items-center">
              <button className="cursor-pointer" title="Enable pin">
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
              {showFtue && !!me && (
                <div className="absolute right-0 top-full z-50 mt-3 w-60 rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm font-normal shadow-xl cursor-default">
                  {/* Arrow pointing up toward the pin button */}
                  <div className="absolute -top-3 right-0 h-0 w-0 border-x-[9px] border-b-[12px] border-x-transparent border-b-zinc-500" />
                  <div className="flex items-start gap-2">
                    <p className="flex-1 leading-snug text-zinc-300">{getTrayHint(os)}</p>
                    <button
                      onClick={dismissFtue}
                      className="absolute right-2 top-2 shrink-0 cursor-pointer text-zinc-400 hover:text-white"
                      title="Dismiss"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              className="cursor-pointer"
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
