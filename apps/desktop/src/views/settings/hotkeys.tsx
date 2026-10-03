import { Button } from "@/components/ui/button";
import Config, { type HotkeyBinding, type HotkeyCommand, type OverlayedConfig } from "@/config";
import type { HotkeysStatus } from "@/hooks/use-hotkeys";
import { formatHotkey } from "@/utils/hotkeys";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { platform } from "@tauri-apps/plugin-os";
import { useEffect, useRef, useState } from "react";

const commands: { command: HotkeyCommand; label: string }[] = [
  { command: "pin", label: "Lock / unlock overlay" },
  { command: "toggle-visibility", label: "Show / hide overlay" },
  { command: "next-monitor", label: "Next monitor (fixed position)" },
  { command: "open-settings", label: "Open settings" },
];

export const Hotkeys = () => {
  const [bindings, setBindings] = useState<HotkeyBinding[]>([]);
  const [status, setStatus] = useState<HotkeysStatus | null>(null);
  const [recording, setRecording] = useState<HotkeyCommand | null>(null);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Partial<Record<HotkeyCommand, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);
  const activeRecording = useRef<HotkeyCommand | null>(null);
  const suspended = useRef(false);
  const pending = useRef(false);
  const focused = useRef(true);
  const recordingRequest = useRef(0);
  const releaseWaiter = useRef<{ code: string; resolve: () => void } | null>(null);
  const suspensionWrites = useRef(Promise.resolve<HotkeysStatus | null>(null));
  const latestBindings = useRef(bindings);
  latestBindings.current = bindings;
  const macos = platform() === "macos";

  const changeSuspension = (value: boolean) => {
    const result = suspensionWrites.current
      .catch(() => null)
      .then(() => invoke<HotkeysStatus>("suspend_hotkeys", { suspended: value }));
    suspensionWrites.current = result;
    return result;
  };

  const resume = async () => {
    if (!suspended.current) return;
    await changeSuspension(false);
    suspended.current = false;
  };

  const cancel = async () => {
    recordingRequest.current++;
    releaseWaiter.current?.resolve();
    releaseWaiter.current = null;
    activeRecording.current = null;
    setRecording(null);
    try {
      await resume();
    } catch (error) {
      console.warn("Could not resume global hotkeys", error);
      if (mounted.current) setError("Couldn't resume hotkeys. Return to this tab to try again.");
    }
  };

  useEffect(() => {
    mounted.current = true;
    let disposed = false;
    let configSeen = false;
    let statusSeen = false;
    const listeners = Promise.all([
      listen<OverlayedConfig>("config_update", event => {
        configSeen = true;
        if (mounted.current) setBindings(event.payload.hotkeys);
      }),
      listen<HotkeysStatus>("hotkeys_update", event => {
        statusSeen = true;
        if (mounted.current) setStatus(event.payload);
      }),
      getCurrentWebviewWindow().onFocusChanged(event => {
        focused.current = event.payload;
        if (!event.payload && suspended.current) void cancel();
      }),
    ]);
    listeners
      .then(async () => {
        if (disposed) return;
        const [config, currentStatus] = await Promise.all([Config.getConfig(), invoke<HotkeysStatus>("get_hotkeys")]);
        if (disposed) return;
        // Opening this tab only reads results. Resume only a recording left
        // suspended by an interrupted settings webview.
        const status = currentStatus.suspended ? await changeSuspension(false) : currentStatus;
        if (disposed) return;
        if (!configSeen) setBindings(config.hotkeys);
        if (!statusSeen) setStatus(status);
      })
      .catch(error => {
        console.warn("Could not load global hotkeys", error);
        if (mounted.current) setError("Couldn't load hotkeys. Return to this tab to try again.");
      });
    return () => {
      disposed = true;
      mounted.current = false;
      recordingRequest.current++;
      releaseWaiter.current?.resolve();
      releaseWaiter.current = null;
      activeRecording.current = null;
      listeners
        .then(unlisteners => unlisteners.forEach(unlisten => unlisten()))
        .catch(error => console.warn("Could not remove hotkey settings listeners", error));
      resume().catch(error => console.warn("Could not resume global hotkeys on leaving settings", error));
    };
  }, []);

  const save = async (command: HotkeyCommand, key: string | null) => {
    const next = latestBindings.current.filter(binding => binding.command !== command);
    if (key) next.push({ key, command });
    await Config.set("hotkeys", next);
    await emit("config_update", await Config.getConfig());
    if (mounted.current) {
      setBindings(next);
      setMessages(previous => ({ ...previous, [command]: undefined }));
      setError(null);
    }
  };

  useEffect(() => {
    if (!recording) return;
    const keydown = async (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (event.code === "Escape") {
        await cancel();
        return;
      }
      if (pending.current) return;
      if (/^(Control|Alt|Shift|Meta)(Left|Right)$/.test(event.code)) return;
      pending.current = true;
      setBusy(true);
      const released = new Promise<void>(resolve => {
        releaseWaiter.current = { code: event.code, resolve };
      });
      try {
        const key = await invoke<string>("record_hotkey", {
          key: {
            code: event.code,
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey,
            superKey: event.metaKey,
          },
          command: recording,
          bindings: latestBindings.current,
        });
        if (mounted.current && activeRecording.current === recording) {
          await save(recording, key);
          // Registering while the recorded key is held can fire that binding.
          await released;
          if (activeRecording.current === recording) await cancel();
        }
      } catch (error) {
        if (mounted.current) setMessages(previous => ({ ...previous, [recording]: String(error) }));
      } finally {
        releaseWaiter.current?.resolve();
        releaseWaiter.current = null;
        pending.current = false;
        if (mounted.current) setBusy(false);
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.code === releaseWaiter.current?.code) {
        releaseWaiter.current.resolve();
        releaseWaiter.current = null;
      }
    };
    window.addEventListener("keydown", keydown, true);
    window.addEventListener("keyup", keyup, true);
    return () => {
      window.removeEventListener("keydown", keydown, true);
      window.removeEventListener("keyup", keyup, true);
    };
  }, [recording]);

  const startRecording = async (command: HotkeyCommand) => {
    const request = ++recordingRequest.current;
    pending.current = true;
    setBusy(true);
    suspended.current = true;
    try {
      const status = await changeSuspension(true);
      if (!mounted.current || !focused.current || request !== recordingRequest.current || !status.supported) {
        await resume();
        return;
      }
      setStatus(status);
      setMessages(previous => ({ ...previous, [command]: undefined }));
      activeRecording.current = command;
      setRecording(command);
    } catch (error) {
      console.warn("Could not suspend global hotkeys", error);
      if (mounted.current) setError("Couldn't suspend hotkeys to record. Try again.");
      await resume().catch(error => console.warn("Could not restore global hotkeys", error));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const clear = async (command: HotkeyCommand) => {
    pending.current = true;
    setBusy(true);
    try {
      await save(command, null);
    } catch (error) {
      console.warn("Could not clear hotkey", error);
      if (mounted.current)
        setMessages(previous => ({ ...previous, [command]: "Couldn't save this hotkey. Try again." }));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 text-sm" data-hotkeys-panel>
      <p className="text-xs text-zinc-400">The next-monitor hotkey only works with Fixed position.</p>
      {status?.supported === false && <p className="text-xs text-zinc-400">Global hotkeys don't work on Wayland.</p>}
      {commands.map(({ command, label }) => {
        const binding = bindings.find(binding => binding.command === command);
        const result = status?.bindings.find(result => result.command === command && result.key === binding?.key);
        // The Wayland note covers every binding without repeating the same
        // error four times and pushing the rows into the fixed footer.
        const message = messages[command] ?? (status?.suspended || status?.supported === false ? null : result?.error);
        const active = recording === command;
        return (
          <div key={command} className="rounded-md border border-zinc-700 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{label}</p>
                <p className="truncate text-xs text-zinc-400" title={binding?.key}>
                  {active
                    ? "Press a shortcut, or Escape to cancel"
                    : binding
                      ? formatHotkey(binding.key, macos)
                      : "Not set"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  disabled={busy || !status?.supported || (!!recording && !active)}
                  aria-label={`${active ? "Cancel recording" : "Record hotkey"} for ${label}`}
                  onClick={() => (active ? cancel() : startRecording(command))}
                >
                  {active ? "Cancel" : "Record"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  disabled={busy || !!recording || !binding}
                  aria-label={`Clear hotkey for ${label}`}
                  onClick={() => clear(command)}
                >
                  Clear
                </Button>
              </div>
            </div>
            {message && (
              <p className="truncate text-xs text-red-400 mt-1" role="alert" title={message}>
                {message}
              </p>
            )}
          </div>
        );
      })}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
