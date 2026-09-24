import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { Achievements } from "../../src/pages/Achievements";
import { AchievementCard } from "../../src/features/achievements/AchievementCard";
import { achievements } from "../../src/features/achievements/achievements";
import { useStudyData } from "../../src/hooks/useStudyData";
import { recordRating } from "../../src/features/learning/scheduler";
import { FlashcardPractice } from "../../src/features/study/FlashcardPractice";
import { StudySession } from "../../src/features/study/StudySession";
import { useVoiceInput } from "../../src/hooks/useVoiceInput";
import { library } from "../support/fixtures";
jest.mock("../../src/hooks/useVoiceInput", () => ({
  useVoiceInput: jest.fn(),
}));
beforeEach(() =>
  jest
    .mocked(useVoiceInput)
    .mockReturnValue({
      supported: true,
      listening: false,
      error: "",
      start: jest.fn(),
      stop: jest.fn(),
    }),
);
test("category filters retain the twenty-reward summary and return to All", () => {
  render(<Achievements data={library()} />);
  expect(screen.getByText("0 of 20 unlocked")).toBeVisible();
  expect(screen.getAllByRole("article")).toHaveLength(20);
  fireEvent.click(screen.getByRole("button", { name: "Challenges" }));
  expect(screen.getByRole("heading", { name: "Comeback Kid" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Memory Keeper" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Milestones" }));
  expect(screen.getByRole("heading", { name: "Memory Keeper" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "All" }));
  expect(screen.getAllByRole("article")).toHaveLength(20);
});
test("hidden badges disclose no mission, art or progress until unlocked", () => {
  const badge = { ...achievements(library())[10], hidden: true };
  const view = render(<AchievementCard badge={badge} />);
  expect(screen.getByRole("heading", { name: "???" })).toBeVisible();
  expect(screen.getByText("Secret achievement")).toBeVisible();
  expect(screen.queryByText(badge.detail)).toBeNull();
  expect(view.container.querySelector("img")).toBeNull();
  expect(screen.queryByRole("progressbar")).toBeNull();
  view.rerender(
    <AchievementCard badge={{ ...badge, earned: true, current: 1 }} />,
  );
  expect(screen.getByRole("heading", { name: badge.title })).toBeVisible();
  expect(view.container.querySelector("img")).toHaveAttribute(
    "src",
    badge.image,
  );
});
test("adaptive rewards group once and stay earned without replay after reload", async () => {
  const hook = renderHook(useStudyData);
  let data = library();
  const now = new Date();
  data = recordRating(data, "reviewer-1", "card-1", false, "flashcard", now);
  for (let n = 0; n < 3; n++)
    data = recordRating(data, "reviewer-1", "card-1", true, "flashcard", now);
  await act(async () => {
    await hook.result.current.update(data);
  });
  expect(hook.result.current.rewards.map((b) => b.id)).toEqual([
    "master-first-card",
    "comeback-kid",
  ]);
  await act(async () => {
    await hook.result.current.update(hook.result.current.data);
  });
  expect(hook.result.current.rewards).toHaveLength(2);
  hook.unmount();
  const reloaded = renderHook(useStudyData);
  expect(reloaded.result.current.rewards).toEqual([]);
  expect(reloaded.result.current.data.earnedBadges).toContain("comeback-kid");
});
test("practice passes the last rating into completion evidence and excludes skipped cards", async () => {
  const onComplete = jest.fn(() => true);
  const data = library();
  render(
    <FlashcardPractice
      cards={data.reviewers[0].cards}
      onComplete={onComplete}
      onClose={jest.fn()}
    />,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "I know →" }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "I know →" }));
  });
  expect(onComplete).toHaveBeenCalledWith([
    { cardId: "card-1", correct: true },
    { cardId: "card-2", correct: true },
  ]);
});
test("voice answer evidence reaches the saved attempt only after finishing", async () => {
  const onComplete = jest.fn(async () => true);
  const data = library();
  render(
    <StudySession
      session={{
        title: "Voice quiz",
        mode: "quiz",
        reviewerId: "reviewer-1",
        cards: [data.reviewers[0].cards[0]],
        dueAtStart: [],
      }}
      onClose={jest.fn()}
      onComplete={onComplete}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Start voice study" }));
  expect(onComplete).not.toHaveBeenCalled();
  act(() => {
    jest.mocked(useVoiceInput).mock.calls.at(-1)![0]("Mitochondria");
  });
  fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
  expect(onComplete).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Finish & save results" }),
    );
  });
  expect(onComplete).toHaveBeenCalledWith(
    expect.objectContaining({
      results: [expect.objectContaining({ voice: true, correct: true })],
    }),
  );
});
