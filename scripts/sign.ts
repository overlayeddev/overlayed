import { signWindowsBinary } from "./windows";

const main = async () => {
  console.log("🚀 Begin signing binaries");

  await signWindowsBinary();

  console.log("✅ Signing completed");
};

main();
