import type { ComponentPropsWithoutRef } from "react";
import { Platforms } from "./download";
import type { PlatformDownload } from "types/types";
import { Mac } from "../react/icons/mac";
import { Windows } from "../react/icons/windows";
import { Linux } from "../react/icons/linux";

type DownloadButtonParams = {
  platform: PlatformDownload;
  props?: ComponentPropsWithoutRef<"a">;
};

const PlatformIcons = {
  mac: Mac,
  windows: Windows,
  linux: Linux,
};

export default function DownloadButton({
  platform,
  ...props
}: DownloadButtonParams) {
  const Image = PlatformIcons[platform.platform];
  return (
    <div
      className="fill-white hover:fill-primary ease-in-out duration-300 transition-all flex flex-col items-center justify-center gap-2 p-4 hover:bg-gray-700 bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
      {...props}
    >
      <a
        target="_blank"
        href={platform.url}
        className="flex flex-col items-center justify-center gap-2 w-20"
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
