import { useEffect, useState } from "react";

// TODO: fix imports
import type { PlatformDownload } from "types/types";
import DownloadButton from "./download-button";

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
    fetch(`${API_HOST}/latest`)
      .then((res) => res.json())
      .then((res) => setPlatformDownloads(res));
  }, []);

  return (
    <div className="relative w-full h-[100%] pb-20 overflow-hidden">
      <div className="parent-download flex flex-col items-center w-max ml-auto mr-auto sm:w-full">
        <h2 className="text-3xl pb-8">Download</h2>
        <div className="flex gap-6 relative sm:flex-row flex-col">
          <div className="" />
          {platformDownloads.map((item) => (
            <DownloadButton key={item.platform} platform={item} />
          ))}
        </div>
      </div>
    </div>
  );
};
