import { useEffect, useState } from "react";

// TODO: fix imports
import type { PlatformDownload } from "types/types";
import DownloadButton from "./DownloadButton";

export const Platforms = {
  linux: "Linux",
  windows: "Windows",
  mac: "macOS",
};

const API_HOST =
  process.env.NODE_ENV === "production" ? "https://update.overlayed.dev" : "";

export const Download = () => {
  const [platformDownloads, setPlatformDownloads] = useState<
    PlatformDownload[]
  >([]);

  useEffect(() => {
    // fetch(`${API_HOST}/latest`)
    //   .then((res) => res.json())
    //   .then((res) => setPlatformDownloads(res));
    setPlatformDownloads([
      {
        name: "Linux",
        url: "https://linuxurl",
        platform: "linux",
      },
      {
        name: "Windows",
        url: "https://linuxurl",
        platform: "windows",
      },
      {
        name: "macOS",
        url: "https://linuxurl",
        platform: "mac",
      },
    ]);
  }, []);

  return (
    <div className="relative w-full h-[100%] pb-20 overflow-hidden">
      <div className="parent-download flex flex-col items-center w-max ml-auto mr-auto sm:w-full">
        <h2 className="text-3xl pb-8">Download</h2>
        <div className="flex gap-6 relative sm:flex-row flex-col">
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 sm:h-[18vh] h-[60vh] w-[588px] bg-radial-1 will-change-transform transition-all duration-200" />
          {platformDownloads.map((item) => (
            <DownloadButton key={item.platform} platform={item} />
          ))}
        </div>
      </div>
    </div>
  );
};
