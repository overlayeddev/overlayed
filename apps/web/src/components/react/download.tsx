import { useEffect, useState } from "react";

// TODO: fix imports
import type { PlatformDownload } from "types/types";
import DownloadButton from "./download-button";
import { API_HOST } from "../../constants";

export const Platforms = {
  linux: "Linux",
  windows: "Windows",
  mac: "Mac",
};

export const Download = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [platformDownloads, setPlatformDownloads] = useState<{
    downloads: PlatformDownload[];
    latestVersion: string;
  }>({
    downloads: [],
    latestVersion: "",
  });

  useEffect(() => {
    fetch(`${API_HOST}/latest`)
      .then((res) => res.json())
      .then((res) => {
        setPlatformDownloads(res);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex flex-col items-center">
        {isLoading ? (
          <>
            <h2 className="text-2xl pb-8">
              Loading...
            </h2>
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
          </>
        ) : (
          <>
            <h2 className="text-2xl pb-8">
              Download ({platformDownloads.latestVersion})
            </h2>
            <div className="flex gap-2 sm:gap-6">
              {platformDownloads.downloads.map((item) => (
                <DownloadButton key={item.platform} platform={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
