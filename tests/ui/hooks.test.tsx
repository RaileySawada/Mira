import { act, renderHook } from "@testing-library/react";
import { useStudyData } from "../../src/hooks/useStudyData";
import { usePage, navigate } from "../../src/hooks/usePage";
import { useScrollLock } from "../../src/hooks/useScrollLock";
import { useTheme } from "../../src/hooks/useTheme";
import { STORAGE_KEY } from "../../src/config/storage";

import { library } from "../support/fixtures";
import { setMedia } from "../support/setup";

describe("useStudyData", () => {
  test("saves successful updates", async () => {
    const { result } = renderHook(useStudyData);
    await act(async () =>
      expect(await result.current.update(library())).toBe(true),
    );
    expect(result.current.data.reviewers).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(3);
  });
  test("requires recovery confirmation and allows retrying", async () => {
    localStorage.setItem(STORAGE_KEY, "bad");
    const { result } = renderHook(useStudyData);

    await act(async () =>
      expect(await result.current.update(library())).toBe(false),
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBe("bad");
    await act(async () => result.current.allowRecovery());
    await act(async () =>
      expect(await result.current.update(library())).toBe(true),
    );
    expect(result.current.error).toBe("");
  });
  test("reports failed writes without replacing working state", async () => {
    const { result } = renderHook(useStudyData);
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    await act(async () =>
      expect(await result.current.update(library())).toBe(false),
    );
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
  test("navigates, avoids duplicate history entries, resets scroll, and cleans listeners", async () => {
    const { result, unmount } = renderHook(usePage);
    const push = jest.spyOn(history, "pushState");
    await act(async () => navigate("Settings"));
    expect(result.current).toBe("Settings");
    await act(async () => navigate("Settings"));
    expect(push).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalled();
    unmount();
  });
  test("shares nested locks and restores page styles and scroll", async () => {
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
  test("applies explicit and system themes and updates browser chrome", async () => {
    document.head.innerHTML = '<meta name="theme-color" content="">';
    const { rerender } = renderHook(
      ({ theme }: { theme: "light" | "dark" | "system" }) =>
        useTheme(theme, jest.fn()),
      { initialProps: { theme: "system" } },
    );
    await act(async () => setMedia("(prefers-color-scheme: dark)", true));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.querySelector("meta")?.content).toBe("#18191e");
    rerender({ theme: "light" });
    expect(document.documentElement.dataset.theme).toBe("light");
  });
  test("saves directly when transitions are unavailable or motion is reduced", async () => {
    const save = jest.fn(() => true);
    const { result } = renderHook(() => useTheme("light", save));
    await act(async () =>
      result.current("dark", document.createElement("button")),
    );
    expect(save).toHaveBeenLastCalledWith("dark");
    const start = jest.fn();
    Object.defineProperty(document, "startViewTransition", {
      value: start,
      configurable: true,
    });
    await act(async () => setMedia("(prefers-reduced-motion: reduce)", true));
    await act(async () =>
      result.current("system", document.createElement("button")),
    );
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

test("queued functional updates see the previous committed library", async () => {
 const { result } = renderHook(useStudyData);
 await act(async () => {
   await Promise.all([
     result.current.update(current => ({...current, folders:[{id:"one",name:"First"}]})),
     result.current.update(current => ({...current, folders:[...(current.folders ?? []),{id:"two",name:"Second"}]})),
   ]);
 });
 expect(result.current.data.folders?.map(folder=>folder.name)).toEqual(["First","Second"]);
 await act(async () => { await expect(result.current.update(() => { throw Error("invalid updater"); })).rejects.toThrow(); });
 await act(async () => { expect(await result.current.update(current => ({...current,settings:{...current.settings,name:"Mira"}}))).toBe(true); });
 expect(result.current.data.settings.name).toBe("Mira");
});
