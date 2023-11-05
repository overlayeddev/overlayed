import { LogicalSize, appWindow } from "@tauri-apps/api/window";

// HACK: this fixes https://github.com/tauri-apps/tauri/issues/4243
/** This will move the window 1px and then back to invalidate the window shadows */
export const invalidateWindowShadows = async () => {
  const oldSize = await appWindow.outerSize();
  const newSize = new LogicalSize(oldSize.width, oldSize.height + 1);
  await appWindow.setSize(newSize);
  await appWindow.setSize(oldSize);
};
