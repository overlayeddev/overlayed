import { useEffect, useState } from "react";

// TODO: fix imports
import type { PlatformDownload } from "types/types";

const Platforms = {
  linux: "Linux",
  windows: "Windows",
  mac: "macOS",
};

const API_HOST =
  process.env.NODE_ENV === "production" ? "https://update.overlayed.dev" : "";

export const Download = () => {
  const [platformDownloads, setPlatformDownloads] = useState<PlatformDownload[]>([]);

  useEffect(() => {
    fetch(`${API_HOST}/latest`)
      .then((res) => res.json())
      .then((res) => setPlatformDownloads(res));
  }, []);

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl pb-8">Download</h2>
      <div className="flex gap-2">
        {platformDownloads.map(item => (
          <a
            key={item.platform}
            target="_blank"
            href={item.url}
            className="hover:bg-primary bg-primary py-2 px-4 rounded-lg"
          >
            {Platforms[item.platform]}
          </a>
        ))}
      </div>
    </div>
  );
};
