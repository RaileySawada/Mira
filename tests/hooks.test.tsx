import { act, renderHook } from "@testing-library/react";
import { useStudyData } from "../src/hooks/useStudyData";
import { usePage, navigate } from "../src/hooks/usePage";
import { useScrollLock } from "../src/hooks/useScrollLock";
import { useTheme } from "../src/hooks/useTheme";
import { STORAGE_KEY } from "../src/services/storage";
import { library } from "./fixtures";
import { setMedia } from "./setup";

describe("useStudyData", () => {
  test("saves successful updates", () => {
    const { result } = renderHook(useStudyData);
    act(() => expect(result.current.update(library())).toBe(true));
    expect(result.current.data.reviewers).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(2);
  });
  test("requires recovery confirmation and allows retrying", () => {
    localStorage.setItem(STORAGE_KEY, "bad");
    const { result } = renderHook(useStudyData);

    act(() => expect(result.current.update(library())).toBe(false));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("bad");
    act(() => result.current.allowRecovery());
    act(() => expect(result.current.update(library())).toBe(true));
    expect(result.current.error).toBe("");
  });
  test("reports failed writes without replacing working state", () => {
    const { result } = renderHook(useStudyData);
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    act(() => expect(result.current.update(library())).toBe(false));
    expect(result.current.data.reviewers).toHaveLength(0);
    expect(result.current.error).toMatch(/could not be saved/);
    expect(alert).not.toHaveBeenCalled();
  });
});
describe("routing and scroll locking", () => {
  test.each([
    ["/subjects", "Topics"],
    ["/#subjects", "Topics"],
    ["/#settings", "Settings"],
    ["/topics/", "Topics"],
    ["/missing", "Not found"],
  ])("opens %s as %s", (url, page) => {
    history.replaceState(null, "", url);
    const { result } = renderHook(usePage);
    expect(result.current).toBe(page);
  });
  test("navigates, avoids duplicate history entries, resets scroll, and cleans listeners", () => {
    const { result, unmount } = renderHook(usePage);
    const push = jest.spyOn(history, "pushState");
    act(() => navigate("Settings"));
    expect(result.current).toBe("Settings");
    act(() => navigate("Settings"));
    expect(push).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalled();
    unmount();
  });
  test("shares nested locks and restores page styles and scroll", () => {
    document.body.style.position = "relative";
    const outer = renderHook(useScrollLock),
      inner = renderHook(useScrollLock);
    expect(document.body.style.position).toBe("fixed");
    expect(document.documentElement.style.scrollbarGutter).toBe("auto");
    outer.unmount();
    expect(document.body.style.position).toBe("fixed");
    history.pushState(null, "", "/topics");
    inner.unmount();
    expect(document.body.style.position).toBe("relative");
    expect(scrollTo).toHaveBeenLastCalledWith({
      left: 0,
      top: 0,
      behavior: "instant",
    });
  });
});
describe("theme preferences", () => {
  beforeEach(() =>
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      writable: true,
      value: undefined,
    }),
  );
  test("applies explicit and system themes and updates browser chrome", () => {
    document.head.innerHTML = '<meta name="theme-color" content="">';
    const { rerender } = renderHook(
      ({ theme }: { theme: "light" | "dark" | "system" }) =>
        useTheme(theme, jest.fn()),
      { initialProps: { theme: "system" } },
    );
    act(() => setMedia("(prefers-color-scheme: dark)", true));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.querySelector("meta")?.content).toBe("#18191e");
    rerender({ theme: "light" });
    expect(document.documentElement.dataset.theme).toBe("light");
  });
  test("saves directly when transitions are unavailable or motion is reduced", () => {
    const save = jest.fn(() => true);
    const { result } = renderHook(() => useTheme("light", save));
    act(() => result.current("dark", document.createElement("button")));
    expect(save).toHaveBeenLastCalledWith("dark");
    const start = jest.fn();
    Object.defineProperty(document, "startViewTransition", {
      value: start,
      configurable: true,
    });
    act(() => setMedia("(prefers-reduced-motion: reduce)", true));
    act(() => result.current("system", document.createElement("button")));
    expect(start).not.toHaveBeenCalled();
  });
  test("animates a circle and skips obsolete rapid requests", async () => {
    const callbacks: (() => void)[] = [];
    const skip = jest.fn();
    const start = jest.fn((callback: () => void) => {
      callbacks.push(callback);
      return {
        ready: Promise.resolve(),
        finished: Promise.resolve(),
        skipTransition: skip,
      };
    });
    Object.defineProperty(document, "startViewTransition", {
      value: start,
      configurable: true,
    });
    const save = jest.fn(() => true);
    const { result } = renderHook(() => useTheme("light", save));
    await act(async () => {
      result.current("light", document.body);
      result.current("dark", document.body);
      callbacks.forEach((callback) => callback());
    });
    expect(skip).toHaveBeenCalled();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("dark");
    expect(document.documentElement.animate).toHaveBeenCalled();
  });
  test("handles intentionally skipped animation readiness", async () => {
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: (callback: () => void) => {
        callback();
        return {
          ready: Promise.reject(new Error("skipped")),
          finished: Promise.resolve(),
          skipTransition: jest.fn(),
        };
      },
    });
    const { result } = renderHook(() =>
      useTheme(
        "light",
        jest.fn(() => true),
      ),
    );
    await act(async () => result.current("dark", document.body));
  });
});
