import type { UnlistenFn } from "@tauri-apps/api/event";
import { getCurrent } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";

export function useIntersectEvent(onStart: () => void, onEnd: () => void) {
  const unlistenIntersectStart = useRef<UnlistenFn>();

  const unlistenIntersectEnd = useRef<UnlistenFn>();

  useEffect(() => {
    (async () => {
      unlistenIntersectStart.current = await getCurrent().listen("intersect-start", onStart);

      unlistenIntersectEnd.current = await getCurrent().listen("intersect-end", onEnd);
    })();

    return () => {
      if (unlistenIntersectStart.current) unlistenIntersectStart.current();

      if (unlistenIntersectEnd.current) unlistenIntersectEnd.current();
    };
  }, []);
}
