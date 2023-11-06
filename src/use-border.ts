import { useEffect, useState } from "react";

export const useBorder = () => {
  const [mouseInViewport, setMouseInViewport] = useState(false);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const mouseMoveFn = (event: MouseEvent) => {
      setMousePos({ x: event.clientX, y: event.clientY });
    };
    document.addEventListener("mousemove", mouseMoveFn);

    const mouseOutFn = () => {
      setMouseInViewport(false);
    };

    document.addEventListener("mouseout", mouseOutFn);

    const mouseOverFn = () => {
      setMouseInViewport(true);
    };
    document.addEventListener("mouseover", mouseOverFn);

    return () => {
      mouseOutFn();
      mouseOverFn();
    };
  }, []);

  return { mouseInViewport, mousePos };
};
