import { useLayoutEffect, useRef } from "react";
import { flushSync } from "react-dom";
import type { Theme } from "../types/study";

export function useTheme(theme: Theme, save: (theme: Theme) => boolean) {
  const active = useRef<ViewTransition | null>(null);
  const revision = useRef(0);
  useLayoutEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", resolved === "dark" ? "#18191e" : "#faf9f6");
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return (next: Theme, origin: HTMLElement) => {
    const request = ++revision.current;
    active.current?.skipTransition();
    const apply = () => {
      if (request === revision.current)
        flushSync(() => {
          save(next);
        });
    };
    if (
      !document.startViewTransition ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      apply();
      return;
    }
    const rect = origin.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    );
    const transition = document.startViewTransition(apply);
    active.current = transition;
    void transition.ready.then(
      () => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 480,
            easing: "cubic-bezier(.2,.7,.2,1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      },
      () => {
        // A newer theme selection can intentionally skip an unfinished transition.
      },
    );
    const finish = () => { if (active.current === transition) active.current = null; };
    void transition.finished.then(finish, finish);
  };
}
