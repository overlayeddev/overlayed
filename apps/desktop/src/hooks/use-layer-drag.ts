import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * On Wayland the overlay can be a layer-shell surface (see src-tauri/src/layer.rs).
 * Layer surfaces can't use the compositor's interactive move, so a press on a
 * `data-tauri-drag-region` starts a drag that the Rust side runs from GTK's
 * pointer events until the button comes up.
 */
export const useLayerDrag = () => {
  useEffect(() => {
    if (getCurrentWindow().label !== "main") return;

    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const active = await invoke<boolean>("layer_shell_active").catch(() => false);
      if (!active || cancelled) return;

      const inDragRegion = (e: Event) => !!(e.target as Element | null)?.closest?.("[data-tauri-drag-region]");

      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0 || !inDragRegion(e)) return;
        // keep Tauri's own startDragging (and the compat mousedown) out of it
        e.preventDefault();
        e.stopPropagation();
        void invoke("layer_drag_begin");
      };

      const onMouseDown = (e: MouseEvent) => {
        if (inDragRegion(e)) e.stopPropagation();
      };

      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("mousedown", onMouseDown, true);

      cleanup = () => {
        document.removeEventListener("pointerdown", onPointerDown, true);
        document.removeEventListener("mousedown", onMouseDown, true);
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);
};
