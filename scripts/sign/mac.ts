import { execSync } from "node:child_process";
import { BASE_PATH, BINS } from "./constants";

const { APPLE_ID, APPLE_TEAM_ID, APPLE_PASSWORD, APPLE_SIGNING_IDENTITY } =
  process.env;

const { bundle } = BINS.darwin;
const appBasePath = `${BASE_PATH}/target/universal-apple-darwin/release/bundle/${bundle}`;
const zipPath = `${appBasePath}/overlayed.zip`;

export const signMacBinary = () => {
  const appPath = `${appBasePath}/overlayed.app`;
  console.log("Signing mac binary", appPath);

  execSync(
    `/usr/bin/codesign --force -s "${APPLE_SIGNING_IDENTITY}" --options=runtime --deep ${appPath} -v`,
    { stdio: "inherit" },
  );
};

export const zipMacBinary = () => {
  console.log("Zipping mac binary", zipPath);

  execSync(`zip -r ${zipPath} ${appBasePath}`, { stdio: "inherit" });
}

export const notarizeMacBinary = () => {
  console.log("Notarizing mac binary", zipPath);
  execSync(
    `xcrun notarytool store-credentials "notarytool-profile" --apple-id ${APPLE_ID} --team-id=${APPLE_TEAM_ID} --password ${APPLE_PASSWORD}`,
    { stdio: "inherit" },
  );

  // notarize
  execSync(
    `xcrun notarytool submit ${zipPath} --keychain-profile "notarytool-profile" --wait`,
    { stdio: "inherit" },
  );
};
