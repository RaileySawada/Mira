import { act, renderHook } from "@testing-library/react";
import { useViewPreference } from "../../src/hooks/useViewPreference";

test.each(["reviewers", "topics", "quizzes"] as const)(
  "remembers %s layout after remount",
  (page) => {
    const first = renderHook(() => useViewPreference(page));
    expect(first.result.current.view).toBe("grid");
    act(() => first.result.current.setView("list"));
    first.unmount();
    const next = renderHook(() => useViewPreference(page));
    expect(next.result.current.view).toBe("list");
    act(() => next.result.current.setView("grid"));
    expect(localStorage.getItem("mira.layout." + page)).toBe("grid");
  },
);
test("page preferences are independent and invalid values fall back to grid", () => {
  localStorage.setItem("mira.layout.reviewers", "list");
  localStorage.setItem("mira.layout.topics", "invalid");
  expect(
    renderHook(() => useViewPreference("reviewers")).result.current.view,
  ).toBe("list");
  expect(
    renderHook(() => useViewPreference("topics")).result.current.view,
  ).toBe("grid");
  expect(
    renderHook(() => useViewPreference("quizzes")).result.current.view,
  ).toBe("grid");
});
test("blocked storage still allows switching layouts with an inline error", () => {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const { result } = renderHook(() => useViewPreference("topics"));
  expect(result.current.error).toContain("unavailable");
  act(() => result.current.setView("list"));
  expect(result.current.view).toBe("list");
  expect(result.current.error).toContain("could not be saved");
});
