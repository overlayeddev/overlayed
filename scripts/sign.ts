import fs from "node:fs";
import { execSync } from "node:child_process";
import { glob } from "glob";

const {
  APPLE_ID,
  APPLE_TEAM_ID,
  APPLE_PASSWORD,
  APPLE_SIGNING_IDENTITY,
  ES_TOTP_SECRET,
  ES_USERNAME,
  ES_PASSWORD,
  ES_CREDENTIAL_ID,
} = process.env;

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
    target: "x86_64-apple-darwin",
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
const signWindowsBinary = (path: string) => {
  console.log("Signing windows binary", path);
  const currentDir = process.cwd();
  const commandArray = [
    "docker",
    "run",
    "-it",
    "--rm",
    "-v",
    `${currentDir}/apps/desktop/src-tauri/target/x86_64-pc-windows-msvc/release:/code`,
    "ghcr.io/sslcom/codesigner:latest",
    "sign",
    `-username=${ES_USERNAME}`,
    `-password=${ES_PASSWORD}`,
    `-credential_id=${ES_CREDENTIAL_ID}`,
    `-totp_secret=${ES_TOTP_SECRET}`,
    `-input_file_path=/code/overlayed.exe`,
    "-malware_block=false",
  ];
  execSync(commandArray.join(" "), { stdio: "inherit" });
};

const signMacBinary = (path: string) => {
  console.log("Signing mac binary", path);
  execSync(
    `/usr/bin/codesign --force -s "${APPLE_SIGNING_IDENTITY}" --options=runtime --deep ${path} -v`,
    { stdio: "inherit" },
  );
};

const notarizeMacBinary = (path: string) => {
  console.log("Notarizing mac binary", path);
  execSync(
    `xcrun notarytool store-credentials "notarytool-profile" --apple-id ${APPLE_ID} --team-id=${APPLE_TEAM_ID} --password ${APPLE_PASSWORD}`,
    { stdio: "inherit" },
  );

  // notarize
  execSync(
    `xcrun notarytool submit ${path} --keychain-profile "notarytool-profile" --wait`,
    { stdio: "inherit" },
  );
};

const main = async () => {
  console.log(process.cwd());

  const platform = process.platform as AllowedPlatforms;
  const { target, bin, bundle } = BINS[platform];
  if (process.platform === "darwin") {
    const path = `${BASE_PATH}/target/${target}/release/bundle/${bundle}/${bin}`;
    console.log("Signing mac binary", path);

    signMacBinary(path);
    notarizeMacBinary(path);
  }

  if (process.platform === "win32") {
    const exePath = `${BASE_PATH}/target/${target}/release/bundle/${bundle}/${bin}`;
    console.log("Signing windows binary", exePath);
    const [foundBinary] = await glob(exePath);
    if (!foundBinary) {
      throw new Error(`No binary found at ${exePath}`);
    }

    signWindowsBinary(foundBinary);
  }

  console.log("Signing complete");
};

main();
