import Config, { type HotkeyBinding, type HotkeyCommand, type OverlayedConfig } from "@/config";
import { useAppStore } from "@/store";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";
import { flushSync } from "react-dom";
import type { PlacementMonitors } from "./use-placement";

export interface HotkeyResult extends HotkeyBinding {
  ok: boolean;
  error: string | null;
}

export interface HotkeysStatus {
  bindings: HotkeyResult[];
  supported: boolean;
  suspended: boolean;
}

const mainWindow = getCurrentWebviewWindow().label === "main";

export const useHotkeys = () => {
  useEffect(() => {
    if (!mainWindow) return;
    let disposed = false;
    let config: OverlayedConfig | null = null;
    let configSeen = false;
    let bindingsKey: string | null = null;
    let registrations = Promise.resolve();
    let actions = Promise.resolve();

    const receiveConfig = (value: OverlayedConfig) => {
      config = value;
      const key = JSON.stringify(value.hotkeys);
      if (key === bindingsKey) return;
      bindingsKey = key;
      registrations = registrations
        .then(async () => {
          if (!disposed) await invoke<HotkeysStatus>("set_hotkeys", { bindings: value.hotkeys });
        })
        .catch(error => {
          bindingsKey = null;
          console.warn("Could not update global hotkeys", error);
        });
    };

    const setVisible = async (visible: boolean) => {
      if (!visible) {
        // Do not hide anything until the native window is click-through.
        await invoke("set_overlay_visible", { visible: false });
        useAppStore.getState().setAppVisible(false);
      } else {
        // Paint first, then restore cursor handling from the current native pin.
        // No show(), hide() or focus call: the foreground game stays active.
        flushSync(() => useAppStore.getState().setAppVisible(true));
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        await invoke("set_overlay_visible", { visible: true });
      }
    };

    const nextMonitor = async () => {
      if (config?.placementMode !== "anchored") return;
      const response = await invoke<PlacementMonitors>("get_monitors");
      if (!response.positioningSupported || config?.placementMode !== "anchored") return;
      const monitors = [...response.monitors].sort((a, b) => a.x - b.x || a.y - b.y);
      if (monitors.length < 2) return;
      const current =
        monitors.find(monitor => monitor.name === config?.placementMonitor) ??
        monitors.find(monitor => monitor.primary) ??
        monitors[0];
      const next = monitors[(monitors.indexOf(current!) + 1) % monitors.length];
      if (!next) return;
      await Config.set("placementMonitor", next.name || null);
      const value = await Config.getConfig();
      receiveConfig(value);
      await emit("config_update", value);
    };

    const enqueue = (action: () => Promise<void>) => {
      actions = actions
        .then(async () => {
          if (!disposed) await action();
        })
        .catch(error => console.warn("Could not handle overlay hotkey", error));
    };

    const listeners = Promise.all([
      listen<OverlayedConfig>("config_update", event => {
        configSeen = true;
        receiveConfig(event.payload);
      }),
      listen<HotkeyCommand>("hotkey_action", event => {
        if (event.payload === "toggle-visibility") enqueue(() => setVisible(!useAppStore.getState().visible));
        if (event.payload === "next-monitor") enqueue(nextMonitor);
      }),
      listen("show_overlay", () => enqueue(() => setVisible(true))),
    ]);
    listeners
      .then(async unlisteners => {
        if (disposed) {
          unlisteners.forEach(unlisten => unlisten());
          return;
        }
        // A webview reload resets the store; reconcile its visibility with the
        // native override before registering new bindings.
        enqueue(() => setVisible(useAppStore.getState().visible));
        const value = await Config.getConfig();
        if (!disposed && !configSeen) receiveConfig(value);
      })
      .catch(error => console.warn("Could not initialize overlay hotkeys", error));

    return () => {
      disposed = true;
      listeners
        .then(unlisteners => unlisteners.forEach(unlisten => unlisten()))
        .catch(error => console.warn("Could not remove overlay hotkey listeners", error));
    };
  }, []);
};
