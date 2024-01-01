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
  const [isLoading, setIsLoading] = useState(true);
  const [platformDownloads, setPlatformDownloads] = useState<
    PlatformDownload[]
  >([]);

  useEffect(() => {
    fetch(`${API_HOST}/latest`)
      .then((res) => res.json())
      .then((res) => {
        setPlatformDownloads(res);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="relative w-full pb-20 overflow-hidden">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl pb-8">Download</h2>
        {isLoading ? (
          <div className="flex gap-2 sm:gap-6">
            {Array(3)
              .fill("")
              .map((_, i) => (
                <div
                  key={`skeleton-loader-${i}`}
                  className="w-28 h-28 bg-slate-800 rounded-lg animate-pulse"
                ></div>
              ))}
          </div>
        ) : (
          <div className="flex gap-2 sm:gap-6">
            {platformDownloads.map((item) => (
              <DownloadButton key={item.platform} platform={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
