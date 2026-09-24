import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  achievements,
  withAchievements,
} from "../../src/features/achievements/achievements";
import { FOCUS_SECONDS } from "../../src/config/learning";

import { FocusTimer } from "../../src/features/achievements/FocusTimer";
import { FlashcardPractice } from "../../src/features/study/FlashcardPractice";
import { validateData } from "../../src/services/storage";
import { library, attempt, reviewer } from "../support/fixtures";

test("all ten images map to their actual titles and missions", async () => {
  const badges = achievements(library()).slice(0, 10);
  expect(badges.map((b) => [b.title, b.description])).toEqual([
    ["First Step", "Completed your first study session"],
    ["Study Streak", "Reviewed 3 days in a row"],
    ["Quiz Master", "Passed 10 quizzes"],
    ["Perfect Score", "Got 100% on a quiz"],
    ["Bookworm", "Uploaded your first reviewer"],
    ["Night Owl", "Studied after midnight"],
    ["Focus Mode", "Finished a full study timer"],
    ["Fast Learner", "Answered quickly and correctly"],
    ["Helper", "Asked MIRA for guidance"],
    ["Century Club", "Answered 100 questions"],
  ]);
  badges.forEach((b, i) =>
    expect(b.image).toBe("/rewards/" + (i + 1) + ".webp"),
  );
  expect(badges.every((b) => !b.earned)).toBe(true);
});
test("legacy badge IDs remain earned when extending the catalog", async () => {
  const data = library();
  data.earnedBadges = ["badge-1", "badge-5", "badge-9"];
  expect(withAchievements(data).earnedBadges).toEqual(data.earnedBadges);
  data.attempts = [
    attempt({ correct: 1, total: 1, date: "2026-09-18T12:00:00" }),
  ];
  const migrated = withAchievements(data);
  expect(migrated.earnedBadges).toEqual([
    "badge-1",
    "badge-4",
    "badge-5",
    "badge-9",
  ]);
  expect(withAchievements({ ...migrated, attempts: [] }).earnedBadges).toEqual(
    migrated.earnedBadges,
  );
});
test("quiz passing, perfect score, speed and hundred-answer boundaries use saved evidence", async () => {
  const data = library();
  data.attempts = Array.from({ length: 10 }, (_, i) =>
    attempt({
      id: String(i),
      correct: i === 9 ? 7 : 8,
      total: 10,
      date: "2026-09-18T12:00:00",
    }),
  );
  expect(achievements(data)[2].current).toBe(9);
  expect(achievements(data)[2].earned).toBe(false);
  expect(achievements(data)[3].earned).toBe(false);
  expect(achievements(data)[7].earned).toBe(false);
  expect(achievements(data)[9].earned).toBe(true);
  data.attempts[9].correct = 10;
  data.attempts[9].fastCorrect = true;
  expect(achievements(data)[2].earned).toBe(true);
  expect(achievements(data)[3].earned).toBe(true);
  expect(achievements(data)[7].earned).toBe(true);
});
test("flashcards contribute to study-day and night missions without changing quiz results", async () => {
  const data = library();
  data.milestones = {
    studyDates: [
      "2026-09-16T12:00:00",
      "2026-09-17T12:00:00",
      "2026-09-18T00:00:00",
    ],
  };
  expect(achievements(data)[0].earned).toBe(true);
  expect(achievements(data)[1].earned).toBe(true);
  expect(achievements(data)[5].earned).toBe(true);
  data.milestones.studyDates = ["2026-09-18T06:00:00"];
  expect(achievements(data)[5].earned).toBe(false);
  expect(data.attempts).toHaveLength(0);
});
test("import, focus and AI badges need their own successful events; milestones validate on import", async () => {
  const data = library();
  data.milestones = {
    importedReviewer: true,
    focusCompleted: true,
    askedMira: true,
  };
  for (const i of [4, 6, 8]) expect(achievements(data)[i].earned).toBe(true);
  expect(
    validateData(JSON.parse(JSON.stringify(withAchievements(data)))).milestones,
  ).toEqual(data.milestones);
  expect(() =>
    validateData({ ...data, milestones: { studyDates: ["invalid"] } }),
  ).toThrow();
  expect(() =>
    validateData({ ...data, milestones: { askedMira: "yes" } }),
  ).toThrow();
});
test("flashcard completion saves once and a failed save can be retried", async () => {
  const save = jest.fn().mockReturnValueOnce(false).mockReturnValue(true),
    close = jest.fn();
  render(
    <FlashcardPractice
      cards={[reviewer().cards[0]]}
      onClose={close}
      onComplete={save}
    />,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Finish practice" }));
  });
  expect(close).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Finish practice" }));
  });
  expect(close).toHaveBeenCalledTimes(1);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Finish practice" }));
  });
  expect(save).toHaveBeenCalledTimes(2);
});
test("timer pauses, completes only after 25 minutes, and retries saving", async () => {
  jest.useFakeTimers();
  try {
    const save = jest.fn().mockReturnValueOnce(false).mockReturnValue(true);
    render(<FocusTimer visible onComplete={save} />);
    fireEvent.click(screen.getByRole("button", { name: "Start focus timer" }));
    await act(async () => jest.advanceTimersByTime(60000));
    expect(screen.getByRole("timer")).toHaveTextContent("24:00");
    fireEvent.click(screen.getByRole("button", { name: "Pause timer" }));
    await act(async () => jest.advanceTimersByTime(60000));
    expect(screen.getByRole("timer")).toHaveTextContent("24:00");
    fireEvent.click(screen.getByRole("button", { name: "Resume timer" }));
    await act(async () =>
      jest.advanceTimersByTime((FOCUS_SECONDS - 60) * 1000),
    );
    expect(save).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Save completed timer" }),
      );
    });
    expect(screen.getByRole("alert")).toBeVisible();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Save completed timer" }),
      );
    });
    expect(
      screen.getByRole("button", { name: /Focus badge saved/ }),
    ).toBeDisabled();
  } finally {
    jest.useRealTimers();
  }
});
