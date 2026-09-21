import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  achievements,
  withAchievements,
} from "../../src/features/achievements/achievements";
import { homeMessages } from "../../src/features/home/miraMessages";
import { makeChoices } from "../../src/features/study/choices";
import { StudySession } from "../../src/features/study/StudySession";
import { Achievements } from "../../src/pages/Achievements";
import { Home } from "../../src/pages/Home";
import { validateData } from "../../src/services/storage";
import { attempt, library, reviewer } from "../support/fixtures";

test("choices are distinct, capped at four, include the correct definition and do not mutate the library", () => {
  const card = reviewer().cards[0];
  const pool = [
    card,
    { ...card, answer: " mitochondria " },
    ...Array.from({ length: 8 }, (_, i) => ({ ...card, answer: "Other " + i })),
  ];
  const before = JSON.stringify(pool);
  const options = makeChoices(card, pool);
  expect(options).toHaveLength(4);
  expect(options).toContain(card.answer);
  expect(new Set(options.map((s) => s.trim().toLowerCase())).size).toBe(4);
  expect(JSON.stringify(pool)).toBe(before);
  expect(makeChoices(card, [card])).toEqual([card.answer]);
});
test("normal mode grades selected answers and saves difficulty; modes lock after the first answer", async () => {
  const user = userEvent.setup(),
    save = jest.fn(() => true);
  render(
    <StudySession
      session={{
        title: "Cells",
        reviewerId: "r",
        mode: "quiz",
        cards: [reviewer().cards[0]],
        answerPool: reviewer().cards,
      }}
      onClose={jest.fn()}
      onComplete={save}
    />,
  );
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  await user.click(screen.getByRole("radio", { name: /Mitochondria/ }));
  await user.click(screen.getByRole("button", { name: "Check answer" }));
  expect(
    screen.queryByRole("button", { name: "Hard · Written recall" }),
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Finish & save results" }),
  );
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ correct: 1, total: 1, difficulty: "normal" }),
  );
});
test("single-definition sets explain the hard-mode fallback", () => {
  render(
    <StudySession
      session={{
        title: "Cells",
        reviewerId: "r",
        mode: "quiz",
        cards: [reviewer().cards[0]],
      }}
      onClose={jest.fn()}
      onComplete={jest.fn()}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Normal · Multiple choice" }),
  ).toBeDisabled();
  expect(screen.getByLabelText("Your answer")).toBeVisible();
});
test("greetings reflect the library and start with a personalized salutation", () => {
  expect(
    homeMessages(library()).every((item) =>
      ["normal", "happy", "amazed", "thinking", "sad"].includes(item.mood),
    ),
  ).toBe(true);
  const data = library();
  data.settings.name = "Mira";
  const sequence = homeMessages(data, new Date("2026-09-19T09:00:00"));
  expect(sequence[0].text).toContain("Good morning, Mira!");
  expect(
    sequence.some(
      (item) =>
        item.text.includes("1 reviewer") && item.text.includes("2 flashcards"),
    ),
  ).toBe(true);
});
test("historical streak badges remain earned and persisted library badges survive deletion", () => {
  let data = library();
  data.attempts = Array.from({ length: 7 }, (_, i) =>
    attempt({
      id: String(i),
      date: "2025-01-" + String(i + 1).padStart(2, "0") + "T12:00:00",
      correct: 5,
      total: 5,
    }),
  );
  data = withAchievements(data);
  expect(achievements(data).find((b) => b.id === "badge-2")?.earned).toBe(true);
  data.reviewers = [];
  expect(achievements(data).find((b) => b.id === "badge-1")?.earned).toBe(true);
  expect(validateData(JSON.parse(JSON.stringify(data))).earnedBadges).toContain(
    "badge-2",
  );
});
test("locked badges show requirements and pale artwork styling", () => {
  const data = library();
  data.attempts = [attempt({ date: "2026-09-18T12:00:00" })];
  render(<Achievements data={data} />);
  expect(screen.getAllByText("Locked")).toHaveLength(9);
  expect(screen.getByText("Quiz Master").closest("article")).toHaveClass(
    "locked",
  );
  expect(screen.getByText("First Step").closest("article")).toHaveClass(
    "earned",
  );
});
test("Home puts the current reviewer and folder before the chart section", () => {
  const data = library();
  data.folders = [{ id: "f", name: "This semester" }];
  data.reviewers[0].folderId = "f";
  data.lastStudy = {
    reviewerId: data.reviewers[0].id,
    startedAt: new Date().toISOString(),
  };
  render(
    <Home
      data={data}
      navigate={jest.fn()}
      onCreate={jest.fn()}
      onStudy={jest.fn()}
      onDaily={jest.fn()}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Continue studying" }),
  ).toBeVisible();
  expect(screen.getByText(/This semester/, { selector: "p" })).toBeVisible();
});
test("new optional backup fields reject malformed data and old backups still load", () => {
  expect(validateData(library()).version).toBe(3);
  expect(() =>
    validateData({
      ...library(),
      lastStudy: { reviewerId: 7, startedAt: "bad" },
    }),
  ).toThrow();
  expect(() => validateData({ ...library(), earnedBadges: [{}] })).toThrow();
  expect(() =>
    validateData({
      ...library(),
      attempts: [{ ...attempt(), difficulty: "invalid" }],
    }),
  ).toThrow();
});
