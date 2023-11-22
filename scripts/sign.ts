import { signWindowsBinary } from "./windows";

const main = async () => {
  // we don't need to sign linux binaries
  if (process.platform === "linux") return;

  console.log("🚀 Begin signing binaries");

  // this is dumb 
  if (process.platform === "win32") {
    await signWindowsBinary();
  }

  // TODO: sign macos
  if (process.platform === "darwin") {
    console.log("🚧 MacOS signing not implemented yet");
  }

  console.log("✅ Signing completed");
};

main();
