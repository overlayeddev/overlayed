import { useEffect, useState } from "react";

import type { PlatformDownload } from "types";
import DownloadButton from "./download-button.js";
import { API_HOST } from "../../constants.js";
import { getRelativeTime } from "../../time-utils.js";

export const Platforms = {
  linux: "Linux",
  windows: "Windows",
  mac: "Mac",
};

export const Download = ({ canary = true }: { canary?: boolean }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [formattedTime, setFormattedTime] = useState("");
  const [platformDownloads, setPlatformDownloads] = useState<{
    downloads: PlatformDownload[];
    latestVersion: string;
    updatedAt?: string;
  }>({
    downloads: [],
    latestVersion: "",
  });

  const buildType = canary ? "canary" : "stable";

  useEffect(() => {
    fetch(`${API_HOST}/latest/${buildType}`)
      .then((res) => res.json())
      .then((res) => {
        setPlatformDownloads(res);
        setIsLoading(false);
      });
  }, []);

  // Allow it to keep time updated based on the second
  useEffect(() => {
    const timerId = setInterval(() => {
      setFormattedTime(
        getRelativeTime(platformDownloads.updatedAt || new Date()),
      );
    }, 1000);

    setFormattedTime(
      getRelativeTime(platformDownloads.updatedAt || new Date()),
    );

    return () => clearInterval(timerId);
  }, [platformDownloads.updatedAt]);

  const commitSha = platformDownloads.latestVersion.substring(0, 7);
  const shortCommitSha = commitSha.substring(0, 7);

  const downloadPath = canary
    ? `tree/${commitSha}`
    : `releases/tag/${commitSha}`;

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex flex-col items-center">
        {isLoading ? (
          <>
            <h2 className="text-2xl pb-2">Loading...</h2>
            <div className="flex gap-2 sm:gap-6">
              {Array(3)
                .fill("")
                .map((_, i) => (
                  <div
                    key={`skeleton-loader-${i}`}
                    className="w-28 h-28 bg-slate-800 rounded-lg animate-pulse"
                  />
                ))}
            </div>
            {canary && <p className="text-sm pt-2 font-bold">Loading...</p>}
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl pb-2">
              Download (
              <a
                className="hover:underline"
                target="_blank"
                href={`https://github.com/overlayeddev/overlayed/${downloadPath}`}
              >
                {shortCommitSha}
              </a>
              )
            </h2>
            {/* if canary show last update */}
            <div className="flex gap-2 sm:gap-6">
              {platformDownloads.downloads.map((item) => (
                <DownloadButton key={item.platform} platform={item} />
              ))}
            </div>
            {canary && (
              <p className="text-sm pt-2 font-bold">
                Last update {formattedTime}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
