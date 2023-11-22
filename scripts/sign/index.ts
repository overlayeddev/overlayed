import { notarizeMacBinary, signMacBinary, zipMacBinary } from "./mac";
import { signWindowsBinary } from "./windows";

const main = async () => {
  // we don't need to sign linux binaries
  if (process.platform === "linux") return;

  console.log("🚀 Begin signing binaries");

  if (process.platform === "win32") {
    await signWindowsBinary();
  }

  if (process.platform === "darwin") {
    signMacBinary();
    zipMacBinary();
    notarizeMacBinary();
  }

  console.log("✅ Signing completed");
};

main();
