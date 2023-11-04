import { LogicalSize, appWindow } from "@tauri-apps/api/window";

  // HACK: this fixes https://github.com/tauri-apps/tauri/issues/4243
export const routerRefresh = async () => {
  const oldSize = await appWindow.outerSize();
  const newSize = new LogicalSize(oldSize.width, oldSize.height + 1);
  await appWindow.setSize(newSize);
  await appWindow.setSize(oldSize);
};
