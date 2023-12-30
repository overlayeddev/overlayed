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
      className={`parent-button relative w-[100%] h-[100%] mr-auto ml-auto flex gap-6`}
      {...props}
    >
      <img
        className={`standard-image sm:absolute sm:-bottom-[58px] sm:left-[50%] sm:-translate-x-1/2 will-change-auto transition-all duration-200`}
        src={`/${platform.platform}.svg`}
        width={48}
        height={48}
        alt={`${platform.platform}'s image`}
      />

      <a
        target="_blank"
        href={platform.url}
        className="platform-button hover:bg-white hover:text-primary bg-primary py-2 px-4 rounded-lg z-10 w-[116px] flex justify-center overflow-hidden relative transition-all duration-300 font-bold"
      >
        <img
          className="absolute inverse-image -bottom-[58px] left-[50%] transform -translate-x-1/2 will-change-auto transition-all duration-200 z-10"
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
