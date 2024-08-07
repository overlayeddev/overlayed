import { useEffect, useState } from "react";
import { osName } from "react-device-detect";

import type { PlatformDownload } from "types";
import DownloadButton from "./download-button.js";
import { API_HOST } from "../../constants.js";
import { getRelativeTime } from "../../time-utils.js";
import { Button } from "./button.jsx";

export const Platforms = {
  linux: "Linux",
  windows: "Windows",
  mac: "Mac",
};

export const Download = ({
  canary = true,
  renderVersionOnly = false,
}: {
  canary?: boolean;
  renderVersionOnly?: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [formattedTime, setFormattedTime] = useState("");
  const [platformDownloads, setPlatformDownloads] = useState<{
    downloads: PlatformDownload[];
    latestVersion: string;
    updated?: string;
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
        getRelativeTime(platformDownloads.updated || new Date()),
      );
    }, 1000);

    setFormattedTime(getRelativeTime(platformDownloads.updated || new Date()));

    return () => clearInterval(timerId);
  }, [platformDownloads.updated]);

  const commitSha = platformDownloads.latestVersion.substring(0, 7);
  const shortCommitSha = commitSha.substring(0, 7);

  const downloadPath = canary
    ? `tree/${commitSha}`
    : `releases/tag/${commitSha}`;

  let currentPlatformBtn = platformDownloads.downloads.find(
    (download) => download.platform === osName.toLowerCase(),
  );

  if (!currentPlatformBtn) currentPlatformBtn = platformDownloads.downloads[0];

  if (renderVersionOnly) {
    return (
      <h2 className="text-xl text-slate-50/80">
        <a
          className="hover:underline"
          target="_blank"
          href={`https://github.com/overlayeddev/overlayed/${downloadPath}`}
        >
          {canary ? `Canary ${shortCommitSha}` : `Stable ${shortCommitSha}`}
        </a>
        <span>
          {" | "} {osName}
        </span>
      </h2>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex flex-col items-center justify-center">
        {isLoading ? (
          <>
            <Button>Loading...</Button>
          </>
        ) : (
          <>
            {/* if canary show last update */}
            <div className="flex flex-row gap-2 sm:gap-6">
              <DownloadButton
                key={currentPlatformBtn.platform}
                platform={currentPlatformBtn}
              />
            </div>
            {canary && (
              <p className="text-sm mt-4 font-bold">
                Last update {formattedTime}
              </p>
            )}
            {renderVersionOnly}
          </>
        )}
      </div>
    </div>
  );
};
