import { useEffect, useLayoutEffect, useState } from "react";
import type { Page } from "../types/study";

export const routes: Record<Page, string> = {
  Home: "/",
  Reviewers: "/reviewers",
  Topics: "/topics",
  Quizzes: "/quizzes",
  Activity: "/activity",
  Settings: "/settings",
  Guide: "/guide",
  Terms: "/terms",
  Privacy: "/privacy",
  About: "/about",
  Contribute: "/contribute",
  "Not found": "/not-found",
};
function readPage(): Page {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  return (
    (Object.keys(routes) as Page[]).find((page) => routes[page] === pathname) ||
    "Not found"
  );
}
export function navigate(page: Page) {
  const path = routes[page];
  if (location.pathname !== path || location.hash)
    history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}
export function usePage() {
  const [page, setPage] = useState(() => {
    if (
      location.pathname.replace(/\/$/, "") === "/subjects" ||
      location.hash === "#subjects"
    )
      history.replaceState(null, "", "/topics");
    const legacy = (Object.keys(routes) as Page[]).find(
      (p) => p.toLowerCase() === location.hash.slice(1),
    );
    if (legacy) history.replaceState(null, "", routes[legacy]);
    return readPage();
  });
  useEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    const change = () => {
      setPage(readPage());
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", change);
    return () => {
      window.removeEventListener("popstate", change);
      history.scrollRestoration = previous;
    };
  }, []);
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [page]);
  return page;
}
