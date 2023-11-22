import { execSync } from "node:child_process";
import path from "node:path";
import fs from "fs";

import { glob } from "glob";

const { ES_TOTP_SECRET, ES_USERNAME, ES_PASSWORD, ES_CREDENTIAL_ID } =
  process.env;

// the base path of the tauri build
const BASE_PATH = "apps/desktop/src-tauri";

type BinType = {
  bin: string;
  bundle: string;
  target: string;
};

type AllowedPlatforms = "darwin" | "win32" | "linux";
const BINS: Record<AllowedPlatforms, BinType> = {
  darwin: {
    bin: "overlayed.app",
    bundle: "macos",
    target: "aarch64-apple-darwin",
  },
  win32: {
    bin: "overlayed_*.exe",
    bundle: "nsis",
    target: "x86_64-pc-windows-msvc",
  },
  linux: {
    bin: "overlayed",
    bundle: "deb",
    target: "x86_64-unknown-linux-gnu",
  },
} as const;

// sign the windows bin with the docker image
export const signWindowsBinary = async () => {
  const { bundle, target } = BINS.win32;
  const binBasePath = `${BASE_PATH}/target/${target}/release/bundle/${bundle}`;

  // CI path:   apps\desktop\src-tauri\target\x86_64-pc-windows-msvc\release\bundle\nsis\overlayed_0.0.0_x64-setup.exe
  // CI input:  apps/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis

  const globPath = `${binBasePath}/*.exe`;
  console.log("base path:", binBasePath);
  console.log("glob path:", globPath);

  const [foundBinary] = await glob(globPath);

  if (!foundBinary) {
    throw new Error(`No binary found at ${binBasePath}`);
  }

  console.log("found bin:", foundBinary);
  // exe name of last part of the path
  const exeName = foundBinary.split(path.sep).pop();

  console.log("found exe:", exeName);
  return;

  const commandArray = [
    "docker",
    "run",
    "-it",
    "--rm",
    "-v",
    `"${binBasePath}:/code"`,
    "ghcr.io/sslcom/codesigner:latest",
    "sign",
    `-username=${ES_USERNAME}`,
    `-password=${ES_PASSWORD}`,
    `-credential_id=${ES_CREDENTIAL_ID}`,
    `-totp_secret=${ES_TOTP_SECRET}`,
    `-input_file_path=/code/${exeName}`,
    "-override=true",
    "-malware_block=false",
  ];
  execSync(commandArray.join(" "), { stdio: "inherit" });
};
