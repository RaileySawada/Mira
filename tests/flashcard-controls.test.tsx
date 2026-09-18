import { act, fireEvent, render, screen } from "@testing-library/react";
import { StudySession } from "../src/features/study/StudySession";
import { reviewer } from "./fixtures";

function practice() {
  const complete = jest.fn();
  render(<StudySession session={{ title: "Practice", reviewerId: "r", mode: "cards", cards: reviewer().cards }} onClose={jest.fn()} onComplete={complete} />);
  return complete;
}
test("Space flips and arrows rate without recording quiz accuracy", () => {
  const complete = practice();
  const card = screen.getByRole("button", { name: /Question:/ });
  fireEvent.keyDown(card, { key: " ", code: "Space" });
  expect(card).toHaveAttribute("aria-pressed", "true");
  fireEvent.keyDown(card, { key: "ArrowLeft" });
  expect(screen.getByText("2 / 2")).toBeVisible();
  fireEvent.keyDown(card, { key: "ArrowRight" });
  expect(screen.getByText("1 known · 1 to practice")).toBeVisible();
  expect(complete).not.toHaveBeenCalled();
});
test("horizontal swipes rate, vertical gestures do not, and taps flip", () => {
  practice();
  const card = screen.getByRole("button", { name: /Question:/ });
  fireEvent.click(card);
  expect(card).toHaveAttribute("aria-pressed", "true");
  fireEvent.touchStart(card, { touches: [{ clientX: 150, clientY: 200 }] });
  fireEvent.touchEnd(card, { changedTouches: [{ clientX: 150, clientY: 330 }] });
  expect(screen.getByText("1 / 2")).toBeVisible();
  fireEvent.touchStart(card, { touches: [{ clientX: 150, clientY: 200 }] });
  fireEvent.touchEnd(card, { changedTouches: [{ clientX: 50, clientY: 205 }] });
  fireEvent.click(card);
  expect(card).toHaveAttribute("aria-pressed", "false");
  fireEvent.touchStart(card, { touches: [{ clientX: 100, clientY: 200 }] });
  fireEvent.touchEnd(card, { changedTouches: [{ clientX: 220, clientY: 205 }] });
  expect(screen.getByText("1 known · 1 to practice")).toBeVisible();
});


test("drag follows the finger, snaps back below threshold, and commits only after exit", () => {
  practice();
  const card = screen.getByRole("button", { name: /Question:/ });
  const pending = { cancel: jest.fn(), onfinish: null as (() => void) | null };
  jest.spyOn(card, "animate").mockReturnValue(pending as unknown as Animation);
  fireEvent.touchStart(card, { touches: [{ clientX: 150, clientY: 200 }] });
  fireEvent.touchMove(card, { touches: [{ clientX: 175, clientY: 202 }] });
  expect(card.style.transform).toContain("translateX(25px)");
  fireEvent.touchEnd(card, { changedTouches: [{ clientX: 175, clientY: 202 }] });
  expect(card.style.transform).toBe("");
  expect(screen.getByText("1 / 2")).toBeVisible();
  fireEvent.touchStart(card, { touches: [{ clientX: 150, clientY: 200 }] });
  fireEvent.touchMove(card, { touches: [{ clientX: 50, clientY: 205 }] });
  expect(card.style.transform).toContain("translateX(-100px)");
  expect(card.style.getPropertyValue("--swipe-unknown")).toBe("1");
  fireEvent.touchEnd(card, { changedTouches: [{ clientX: 50, clientY: 205 }] });
  expect(screen.getByText("1 / 2")).toBeVisible();
  fireEvent.keyDown(card, { key: "ArrowRight" });
  act(() => pending.onfinish?.());
  expect(screen.getByText("2 / 2")).toBeVisible();
  expect(card.style.transform).toBe("");
  expect(card).toHaveAttribute("aria-pressed", "false");
});
