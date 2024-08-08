import { useEffect, useState } from "react";
import type { PlatformDownload } from "types";
import DownloadButton from "./download-button.js";
import { API_HOST } from "../../constants.js";
import { getRelativeTime } from "../../time-utils.js";
import { isMobile } from "react-device-detect";
import { Button } from "./button.jsx";
import { GithubIcon } from "../icons";

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
        const userAgent = window?.navigator?.userAgent.toLowerCase();

        if (userAgent.indexOf("win") !== -1) {
          setPlatformDownloads({
            downloads: [res.downloads[2]],
            latestVersion: res.latestVersion,
          });
        } else if (userAgent.indexOf("mac") !== -1) {
          setPlatformDownloads({
            downloads: [res.downloads[1]],
            latestVersion: res.latestVersion,
          });
        } else if (
          userAgent.indexOf("linux") !== -1 &&
          userAgent.indexOf("android") === -1
        ) {
          setPlatformDownloads({
            downloads: [res.downloads[0]],
            latestVersion: res.latestVersion,
          });
        } else {
          setPlatformDownloads(res);
        }
        setIsLoading(false);
      });
  }, []);

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
      </h2>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex flex-col items-center justify-center">
        {isLoading ? (
          <Button>Loading...</Button>
        ) : (
          <>
            {isMobile ? null : (
              <div className="flex gap-2 sm:gap-6">
                {platformDownloads.downloads.map((platform) => (
                  <DownloadButton key={platform.platform} platform={platform} />
                ))}
              </div>
            )}
            {canary && (
              <p className="text-sm pt-2 font-bold">
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
