import { execSync } from "node:child_process";

const {
  APPLE_ID,
  APPLE_TEAM_ID,
  APPLE_PASSWORD,
  APPLE_SIGNING_IDENTITY,
} = process.env;

export const signMacBinary = (path: string) => {
  console.log("Signing mac binary", path);
  execSync(
    `/usr/bin/codesign --force -s "${APPLE_SIGNING_IDENTITY}" --options=runtime --deep ${path} -v`,
    { stdio: "inherit" },
  );
};

export const notarizeMacBinary = (path: string) => {
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

