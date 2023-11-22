import { execSync } from "node:child_process";
import path from "node:path";

import { glob } from "glob";
import { BASE_PATH, BINS } from "./constants";

const { ES_TOTP_SECRET, ES_USERNAME, ES_PASSWORD, ES_CREDENTIAL_ID } =
  process.env;


// sign the windows bin with the docker image
export const signWindowsBinary = async () => {
  const { bundle, target } = BINS.win32;
  const binBasePath = `${BASE_PATH}/target/${target}/release/bundle/${bundle}`;
  const globPath = `${binBasePath}/*.exe`;

  const [foundBinary] = await glob(globPath);

  if (!foundBinary) {
    throw new Error(`No binary found at ${binBasePath}`);
  }

  console.log("found bin:", foundBinary);
  // exe name of last part of the path
  const exeName = foundBinary.split(path.sep).pop();

  console.log("found exe:", exeName);

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
