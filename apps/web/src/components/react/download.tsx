import { useEffect, useState } from "react";

// TODO: fix imports
import type { LatestVersion } from "types/types";

const Platforms = {
  "linux-x86_64": "Linux",
  "windows-x86_64": "Windows",
  "darwin-aarch64": "Mac M1",
  "darwin-x86_64": "Mac x86",
};

const API_HOST = process.env.NODE_ENV === "production" ? "https://update.overlayed.dev" : ""; 

export const Download = () => {
  const [metadata, setMetadata] = useState<LatestVersion | null>(null);

  useEffect(() => {
    fetch(`${API_HOST}/latest`)
      .then((res) => res.json())
      .then((res) => setMetadata(res));
  }, []);

  const items = Object.entries(metadata?.platforms ?? {});
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl pb-8">Download</h2>
      <div className="flex gap-2">
        {items.map(([key, value]) => (
          <a
            target="_blank"
            href={value.url}
            className="hover:bg-primary bg-primary py-2 px-4 rounded-lg"
          >
            {Platforms[key]}
          </a>
        ))}
      </div>
    </div>
  );
};
