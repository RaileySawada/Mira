import { useLayoutEffect } from "react";

let locks = 0;
let restore: (() => void) | undefined;

// Share the lock between dialogs and the mobile menu, including nested overlays.
export function useScrollLock() {
  useLayoutEffect(() => {
    if (locks++ === 0) {
      const root = document.documentElement;
      const body = document.body;
      const x = window.scrollX,
        y = window.scrollY;
      const path = location.pathname;
      const previous = {
        rootOverflow: root.style.overflow,
        gutter: root.style.scrollbarGutter,
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        width: body.style.width,
        overflow: body.style.overflow,
      };
      root.style.overflow = "hidden";
      root.style.scrollbarGutter = "auto";
      body.style.position = "fixed";
      body.style.top = `-${y}px`;
      body.style.left = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      restore = () => {
        root.style.overflow = previous.rootOverflow;
        root.style.scrollbarGutter = previous.gutter;
        Object.assign(body.style, {
          position: previous.position,
          top: previous.top,
          left: previous.left,
          width: previous.width,
          overflow: previous.overflow,
        });
        window.scrollTo({
          left: location.pathname === path ? x : 0,
          top: location.pathname === path ? y : 0,
          behavior: "instant",
        });
      };
    }
    return () => {
      if (--locks === 0) {
        restore?.();
        restore = undefined;
      }
    };
  }, []);
}
