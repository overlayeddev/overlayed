import type { ComponentPropsWithoutRef } from "react";
import { Platforms } from "./download.js";
import type { PlatformDownload } from "types";
import { MacIcon, WindowsIcon, LinuxIcon } from "./icons/index.js";
import { track } from "@vercel/analytics";

type DownloadButtonParams = {
  platform: PlatformDownload;
  props?: ComponentPropsWithoutRef<"a">;
};

const PlatformIcons = {
  mac: MacIcon,
  windows: WindowsIcon,
  linux: LinuxIcon,
};

export default function DownloadButton({
  platform,
  ...props
}: DownloadButtonParams) {
  const Image = PlatformIcons[platform.platform];
  return (
    <div
      className="fill-white hover:fill-primary ease-in-out duration-300 transition-all flex flex-col items-center justify-center gap-2 p-4 bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
      {...props}
    >
      <a
        target="_blank"
        href={platform.url}
        className="flex flex-col items-center justify-center gap-2 h-20 w-20"
        onClick={() => {
          const name = platform.name.includes("canary")
            ? "download-canary"
            : "download";
          track(name, {
            platform: platform.platform,
          });
        }}
      >
        <div className="w-10 h-10">
          <Image />
        </div>
        <span className="platform-button-text font-bold z-30">
          {Platforms[platform.platform]}
        </span>
      </a>
    </div>
  );
}
