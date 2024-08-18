import { useEffect, useState } from "react";

import { getName, getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { appConfigDir } from "@tauri-apps/api/path";
import { platform as getPlatform, version as getKernalVersion, arch as getArch } from "@tauri-apps/plugin-os";

export const usePlatformInfo = () => {
  const [platformInfo, setPlatformInfo] = useState({
    appVersion: "",
    tauriVersion: "",
    os: "",
    kernalVersion: "",
    arch: "",
    name: "",
    canary: false,
    configDir: "",
  });

  useEffect(() => {
    const allPromises = [getTauriVersion(), getVersion(), appConfigDir(), getName()];

    // get all the dataz
    Promise.allSettled(allPromises).then(results => {
      const [tauriVersion = "", appVersion = "", configDir = "", name = ""] = results.map(result => {
        if (result.status === "fulfilled") {
          return result.value;
        }
        return "";
      });
      setPlatformInfo({
        tauriVersion,
        appVersion,
        os: getPlatform(),
        kernalVersion: getKernalVersion(),
        arch: getArch(),
        configDir,
        name,
        canary: name.includes("Canary"),
      });
    });
  }, []);

  return platformInfo;
};
