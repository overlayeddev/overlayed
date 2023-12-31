import type { ComponentPropsWithoutRef } from "react";
import { Platforms } from "./download";
import type { PlatformDownload } from "types/types";

type DownloadButtonParams = {
  platform: PlatformDownload;
  props?: ComponentPropsWithoutRef<"a">;
};

export default function DownloadButton({
  platform,
  ...props
}: DownloadButtonParams) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
      {...props}
    >

      <a
        target="_blank"
        href={platform.url}
        className="flex flex-col items-center justify-center gap-2 w-20"
      >
        <img
          src={`/${platform.platform}_inverse.svg`}
          width={48}
          height={48}
          alt={`${platform.platform}'s image`}
        />
        <span className={"platform-button-text z-30"}>
          {Platforms[platform.platform]}
        </span>
      </a>
    </div>
  );
}
