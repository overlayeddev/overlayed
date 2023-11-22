// the base path of the tauri build
export const BASE_PATH = "apps/desktop/src-tauri";

type BinType = {
  bin: string;
  bundle: string;
  target: string;
};

export type AllowedPlatforms = "darwin" | "win32" | "linux";
export const BINS: Record<AllowedPlatforms, BinType> = {
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
