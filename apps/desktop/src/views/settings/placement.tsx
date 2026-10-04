import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import Config, { type OverlayedConfig, type PlacementAnchor } from "@/config";
import { useConfigValue } from "@/hooks/use-config-value";
import type { PlacementMonitor, PlacementMonitors, PlacementPreview } from "@/hooks/use-placement";
import { cn } from "@/utils/tw";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useRef, useState } from "react";

const anchors: PlacementAnchor[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

type OffsetKey = keyof PlacementPreview;

const previewPosition = (length: number, size: number, offset: number, axis: number) => {
  const available = Math.max(0, length - size);
  return Math.max(0, Math.min(available, axis === 1 ? available / 2 : axis === 0 ? offset : available - offset));
};

export const Placement = () => {
  const { value: placementMode } = useConfigValue("placementMode");
  const { value: placementMonitor } = useConfigValue("placementMonitor");
  const { value: placementAnchor } = useConfigValue("placementAnchor");
  const { value: placementOffsetX } = useConfigValue("placementOffsetX");
  const { value: placementOffsetY } = useConfigValue("placementOffsetY");
  const { value: startPinned } = useConfigValue("startPinned");
  const [response, setResponse] = useState<PlacementMonitors | null>(null);
  const [error, setError] = useState<string | null>(null);
  const writes = useRef(Promise.resolve());
  const [offsets, setOffsets] = useState({ placementOffsetX, placementOffsetY });
  const savedOffsets = useRef({ placementOffsetX, placementOffsetY });
  savedOffsets.current = { placementOffsetX, placementOffsetY };
  const dragging = useRef<OffsetKey | null>(null);
  const awaitingCommit = useRef<PlacementPreview>({});
  const commitVersions = useRef({ placementOffsetX: 0, placementOffsetY: 0 });
  const pendingPreview = useRef<PlacementPreview | null>(null);
  const previewFrame = useRef(0);

  useEffect(() => {
    const saved = { placementOffsetX, placementOffsetY };
    const next: PlacementPreview = {};
    (["placementOffsetX", "placementOffsetY"] as OffsetKey[]).forEach(key => {
      if (awaitingCommit.current[key] === saved[key]) delete awaitingCommit.current[key];
      if (dragging.current !== key && awaitingCommit.current[key] === undefined) next[key] = saved[key];
    });
    setOffsets(previous => ({ ...previous, ...next }));
  }, [placementOffsetX, placementOffsetY]);

  useEffect(() => () => cancelAnimationFrame(previewFrame.current), []);

  const previewOffset = (key: OffsetKey, value: number) => {
    setOffsets(previous => ({ ...previous, [key]: value }));
    pendingPreview.current = { ...pendingPreview.current, [key]: value };
    if (previewFrame.current) return;
    previewFrame.current = requestAnimationFrame(() => {
      previewFrame.current = 0;
      const preview = pendingPreview.current;
      pendingPreview.current = null;
      if (preview) {
        emit("placement_preview", preview).catch(error => console.warn("Could not preview overlay placement", error));
      }
    });
  };

  useEffect(() => {
    let disposed = false;
    let latestQuery = 0;
    const refresh = async () => {
      const query = ++latestQuery;
      try {
        const value = await invoke<PlacementMonitors>("get_monitors");
        if (!disposed && query === latestQuery) {
          setResponse(value);
          setError(null);
        }
      } catch (error) {
        console.warn("Could not load placement monitors", error);
        if (!disposed && query === latestQuery) setError("Couldn't load displays. Return to this tab to try again.");
      }
    };
    refresh();
    const unlisten = getCurrentWebviewWindow().onFocusChanged(event => {
      if (event.payload) refresh();
    });
    return () => {
      disposed = true;
      unlisten.then(fn => fn());
    };
  }, []);

  const update = <K extends keyof OverlayedConfig>(key: K, value: OverlayedConfig[K]) => {
    let saved = false;
    writes.current = writes.current
      .then(async () => {
        const current = await Config.getConfig();
        if (current[key] !== value) await Config.set(key, value);
        if (
          (key === "placementAnchor" && current.placementMode === "anchored") ||
          (key === "placementMode" && value === "anchored")
        ) {
          const config = await Config.getConfig();
          const horizontal = config.placementAnchor.endsWith("-left")
            ? "left"
            : config.placementAnchor.endsWith("-right")
              ? "right"
              : null;
          if (horizontal && config.horizontal !== horizontal) await Config.set("horizontal", horizontal);
        }
        await emit("config_update", await Config.getConfig());
        saved = true;
        setError(null);
      })
      .catch(error => {
        console.warn("Could not save placement settings", error);
        setError("Couldn't save this setting. Try changing it again.");
      });
    return writes.current.then(() => saved);
  };

  const commitOffset = (key: OffsetKey, value: number) => {
    dragging.current = null;
    const version = ++commitVersions.current[key];
    awaitingCommit.current[key] = value;
    previewOffset(key, value);
    update(key, value).then(saved => {
      if (commitVersions.current[key] !== version) return;
      if (saved && savedOffsets.current[key] !== value) return;
      delete awaitingCommit.current[key];
      if (!saved && dragging.current !== key) previewOffset(key, savedOffsets.current[key]);
    });
  };

  const monitors = [...(response?.monitors ?? [])].sort((a, b) => a.x - b.x || a.y - b.y);
  const selected =
    monitors.find(monitor => placementMonitor !== null && monitor.name === placementMonitor) ??
    monitors.find(monitor => monitor.primary) ??
    monitors[0];
  const missing = placementMonitor !== null && !monitors.some(monitor => monitor.name === placementMonitor);
  const fixed = placementMode === "anchored" && response?.positioningSupported !== false;
  const enabled = placementMode === "anchored" && response?.positioningSupported === true;
  const anchorIndex = Math.max(0, anchors.indexOf(placementAnchor));
  const horizontal = anchorIndex % 3;
  const vertical = Math.floor(anchorIndex / 3);
  const minX = monitors.length ? Math.min(...monitors.map(monitor => monitor.x)) : 0;
  const minY = monitors.length ? Math.min(...monitors.map(monitor => monitor.y)) : 0;
  const spanX = monitors.length ? Math.max(...monitors.map(monitor => monitor.x + monitor.width)) - minX : 1;
  const spanY = monitors.length ? Math.max(...monitors.map(monitor => monitor.y + monitor.height)) - minY : 1;
  const canvasHeight = response?.positioningSupported === false || fixed ? 92 : 132;
  const mapScale = Math.min(524 / spanX, canvasHeight / spanY);
  const mapWidth = spanX * mapScale;
  const mapHeight = spanY * mapScale;

  const overlayPreview = (monitor: PlacementMonitor) => {
    const width = Math.min(monitor.width, 220 * monitor.scaleFactor);
    const height = Math.min(monitor.height, 100 * monitor.scaleFactor);
    return {
      left: `${(previewPosition(monitor.width, width, offsets.placementOffsetX * monitor.scaleFactor, horizontal) / monitor.width) * 100}%`,
      top: `${(previewPosition(monitor.height, height, offsets.placementOffsetY * monitor.scaleFactor, vertical) / monitor.height) * 100}%`,
      width: `${(width / monitor.width) * 100}%`,
      height: `${(height / monitor.height) * 100}%`,
    };
  };

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex h-8 items-center justify-between mx-2">
        <label htmlFor="fixed-position" className="font-medium">
          Fixed position
        </label>
        <Switch
          id="fixed-position"
          checked={fixed}
          disabled={!response?.positioningSupported}
          onCheckedChange={checked => update("placementMode", checked ? "anchored" : "manual")}
        />
      </div>
      {fixed && (
        <p className="text-xs text-zinc-400 mx-2">
          Fixed overlays are click-through. To change settings, start Overlayed again or use its tray icon (Settings or
          Unpin).
        </p>
      )}
      {response?.positioningSupported === false ? (
        <p className="text-xs text-zinc-400 mx-2">
          Your desktop doesn't let apps place their own windows (Wayland). Drag the overlay instead.
        </p>
      ) : null}
      <div className={cn("rounded-md border border-zinc-700 bg-zinc-950 p-2", !enabled && "opacity-40")}>
        <div className="flex items-center justify-center" style={{ height: canvasHeight }}>
          <div className="relative" style={{ width: mapWidth, height: mapHeight }}>
            {monitors.map((monitor, index) => {
              const isSelected = monitor === selected;
              return (
                <div
                  key={`${monitor.name}-${monitor.x}-${monitor.y}`}
                  className={cn(
                    "absolute rounded-sm border bg-zinc-800",
                    isSelected ? "border-blue-400" : "border-zinc-600"
                  )}
                  style={{
                    left: (monitor.x - minX) * mapScale,
                    top: (monitor.y - minY) * mapScale,
                    width: monitor.width * mapScale,
                    height: monitor.height * mapScale,
                  }}
                >
                  <button
                    type="button"
                    disabled={!enabled}
                    aria-pressed={isSelected}
                    aria-label={`Display ${index + 1}${monitor.primary ? ", primary" : ""}`}
                    title={monitor.name || `Display ${index + 1}`}
                    className="absolute inset-0 cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-blue-400 disabled:cursor-default"
                    onClick={() => update("placementMonitor", monitor.name || null)}
                  >
                    <span className="absolute left-1 top-0 text-xs text-zinc-300">
                      {index + 1}
                      {monitor.primary ? "*" : ""}
                    </span>
                  </button>
                  {isSelected && (
                    <>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute rounded-xs border border-blue-300 bg-blue-400/40"
                        style={overlayPreview(monitor)}
                      />
                      <div className="pointer-events-none absolute inset-[10%] grid grid-cols-3 grid-rows-3">
                        {anchors.map((anchor, index) => (
                          <button
                            key={anchor}
                            type="button"
                            disabled={!enabled}
                            aria-label={`Anchor ${anchor.replace(/-/g, " ")}`}
                            aria-pressed={placementAnchor === anchor}
                            title={anchor.replace(/-/g, " ")}
                            className="pointer-events-auto flex min-h-0 min-w-0 cursor-pointer items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-blue-400 disabled:cursor-default"
                            style={{
                              justifySelf: ["start", "center", "end"][index % 3],
                              alignSelf: ["start", "center", "end"][Math.floor(index / 3)],
                            }}
                            onClick={() => update("placementAnchor", anchor)}
                          >
                            <span
                              className={cn(
                                "block h-2.5 w-2.5 rounded-full border border-zinc-950",
                                placementAnchor === anchor ? "bg-blue-400" : "bg-zinc-400 hover:bg-white"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="min-h-4 text-xs text-zinc-400 mx-2" aria-live="polite">
        {error ??
          (missing
            ? "Saved display isn't connected. The primary display is used."
            : selected
              ? `Display ${monitors.indexOf(selected) + 1} - ${selected.width}x${selected.height}${selected.primary ? " - primary" : ""}`
              : response
                ? "No displays found."
                : "Loading displays...")}
      </p>
      {[
        {
          label: "Horizontal margin",
          key: "placementOffsetX" as const,
          value: offsets.placementOffsetX,
          centered: horizontal === 1,
        },
        {
          label: "Vertical margin",
          key: "placementOffsetY" as const,
          value: offsets.placementOffsetY,
          centered: vertical === 1,
        },
      ].map(({ label, key, value, centered }) => (
        <div
          key={key}
          className={cn("flex h-8 items-center justify-between mx-2", (!enabled || centered) && "opacity-40")}
        >
          <label htmlFor={key} className="font-medium">
            {label}
          </label>
          <div className="flex w-1/2 items-center gap-4">
            <Slider
              id={key}
              aria-label={label}
              value={[value]}
              min={0}
              max={200}
              step={1}
              disabled={!enabled || centered}
              onPointerDownCapture={() => {
                dragging.current = key;
              }}
              onPointerUp={() => {
                dragging.current = null;
              }}
              onPointerCancel={() => {
                dragging.current = null;
                previewOffset(key, awaitingCommit.current[key] ?? savedOffsets.current[key]);
              }}
              onValueChange={values => previewOffset(key, values[0] ?? value)}
              onValueCommit={values => commitOffset(key, values[0] ?? value)}
            />
            <span className="w-14 shrink-0 text-right">{value} px</span>
          </div>
        </div>
      ))}
      <div className="flex h-8 items-center justify-between mx-2">
        <label htmlFor="start-pinned" className="font-medium">
          Start pinned
        </label>
        <Switch
          id="start-pinned"
          checked={startPinned}
          disabled={fixed}
          onCheckedChange={checked => update("startPinned", checked)}
        />
      </div>
    </div>
  );
};
