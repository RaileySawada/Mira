import { messageVariants } from "../../src/features/home/messageVariants";
import { act, render, screen } from "@testing-library/react";
import { MiraInteraction } from "../../src/features/home/MiraInteraction";
import { homeMessages } from "../../src/features/home/miraMessages";
import { dailyQuizSize } from "../../src/utils/quiz";
import { emptyData, validateData } from "../../src/services/storage";
import { library } from "../support/fixtures";
import { setMedia } from "../support/setup";

test("messages greet by time, include current folder, practice and rewards without relying on quiz scores", () => {
  const data = library();
  data.settings.name = "Railey";
  data.folders = [{ id: "f", name: "Semester one" }];
  data.reviewers[0].folderId = "f";
  data.lastStudy = {
    reviewerId: data.reviewers[0].id,
    startedAt: "2026-09-19T10:00:00",
  };
  data.milestones = { studyDates: ["2026-09-19T10:00:00"] };
  const text = homeMessages(data, new Date("2026-09-19T15:00:00"))
    .map((m) => m.text)
    .join(" ");
  expect(text).toContain("Good afternoon, Railey!");
  expect(text).toContain("Semester one");
  expect(text).toContain("1 study session");
  expect(text).toContain("badge");
  expect(
    homeMessages(emptyData(), new Date("2026-09-19T19:00:00"))[0].text,
  ).toContain("Good evening");
});
test("messages type and advance automatically, then stop without controls", () => {
  jest.useFakeTimers();
  try {
    const { container } = render(
      <MiraInteraction
        messages={[
          { mood: "happy", text: "Hi!" },
          { mood: "normal", text: "Bye!" },
        ]}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(35));
    expect(container.querySelector(".mira-message-typed")).toHaveTextContent(
      "Hi",
    );
    act(() => jest.advanceTimersByTime(35));
    act(() => jest.advanceTimersByTime(4499));
    expect(screen.getByRole("heading", { name: "Hi!" })).toBeVisible();
    act(() => jest.advanceTimersByTime(1));
    act(() => jest.advanceTimersByTime(35));
    act(() => jest.advanceTimersByTime(35));
    expect(container.querySelector(".mira-message-typed")).toHaveTextContent(
      "Bye!",
    );
    expect(jest.getTimerCount()).toBe(0);
    act(() => jest.advanceTimersByTime(60000));
    expect(screen.getByRole("heading", { name: "Bye!" })).toBeVisible();
  } finally {
    jest.useRealTimers();
  }
});
test("reduced motion shows complete text and advances automatically", () => {
  jest.useFakeTimers();
  try {
    setMedia("(prefers-reduced-motion: reduce)", true);
    const { container } = render(
      <MiraInteraction
        messages={[
          { mood: "happy", text: "Hello" },
          { mood: "normal", text: "Welcome" },
        ]}
      />,
    );
    expect(container.querySelector(".mira-message-typed")).toHaveTextContent(
      "Hello",
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(4500));
    expect(container.querySelector(".mira-message-typed")).toHaveTextContent(
      "Welcome",
    );
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});
test("daily sizing expands old limits and preserves explicit daily preferences", () => {
  expect(dailyQuizSize(emptyData().settings)).toBe(20);
  const legacy = {
    ...emptyData().settings,
    dailyQuizSize: undefined,
    quizSize: 10,
  };
  expect(dailyQuizSize(legacy)).toBe(15);
  expect(dailyQuizSize({ ...legacy, quizSize: 99 })).toBe(100);
  expect(dailyQuizSize({ ...legacy, dailyQuizSize: 6 })).toBe(6);
  expect(() =>
    validateData({
      ...emptyData(),
      settings: { ...emptyData().settings, dailyQuizSize: 101 },
    }),
  ).toThrow();
});

test("all message categories have ten distinct alternatives and visits keep accurate data", () => {
  Object.values(messageVariants).forEach((options) =>
    expect(new Set(options).size).toBe(10),
  );
  const data = library(),
    now = new Date("2026-09-19T09:00:00");
  const visits = Array.from({ length: 10 }, (_, seed) =>
    homeMessages(data, now, seed),
  );
  expect(new Set(visits.map((items) => items[0].text)).size).toBe(10);
  visits.forEach((items) => {
    expect(new Set(items.map((item) => item.text)).size).toBe(items.length);
    expect(
      items.some((item) => item.text.includes("1 reviewer and 2 flashcards")),
    ).toBe(true);
    expect(items.every((item) => !item.text.match(/\{\w+\}/))).toBe(true);
  });
  expect(homeMessages(data, now, 4)).toEqual(homeMessages(data, now, 4));
});
