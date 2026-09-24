import {
  achievements,
  withAchievements,
} from "../../src/features/achievements/achievements";
import {
  recordRating,
  scheduleCard,
} from "../../src/features/learning/scheduler";
import {
  captureDueCards,
  recordStudyCompletion,
} from "../../src/features/learning/sessionEvidence";
import { validateData } from "../../src/services/storage";
import { parseQuizDraft } from "../../src/features/study/quizDraft";
import type { StudyData, QuestionResult } from "../../src/types/study";
import type { Session } from "../../src/types/session";
import { library, attempt } from "../support/fixtures";
const now = new Date("2026-09-24T12:00:00");
const badge = (data: StudyData, id: string) =>
  achievements(data, now).find((b) => b.id === id)!;
function mastered(count: number) {
  let data = library();
  data.reviewers[0].cards = Array.from({ length: count }, (_, i) => ({
    id: String(i),
    question: "Q" + i,
    answer: "A" + i,
  }));
  for (const c of data.reviewers[0].cards)
    for (let n = 0; n < 3; n++)
      data = recordRating(data, "reviewer-1", c.id, true, "flashcard", now);
  return data;
}
function session(data: StudyData): Session {
  return {
    title: "Practice",
    reviewerId: "reviewer-1",
    mode: "cards",
    cards: data.reviewers[0].cards,
    dueAtStart: captureDueCards(data, "reviewer-1", now),
  };
}
function complete(
  data: StudyData,
  s = session(data),
  id = "done",
  offline = false,
  voice = false,
  date = now,
) {
  return recordStudyCompletion(
    data,
    s,
    id,
    s.cards.map((c) => ({ cardId: c.id, correct: true, voice })),
    offline,
    date,
  );
}
function result(
  cardId: string,
  correct: boolean,
  reviewerId?: string,
): QuestionResult {
  return {
    cardId,
    reviewerId,
    correct,
    question: "Q",
    expectedAnswer: "A",
    userAnswer: correct ? "A" : "B",
    durationMs: 2000,
  };
}
test("first mastery and 24/25 unique mastered boundaries use the mastery engine", () => {
  expect(badge(library(), "master-first-card").earned).toBe(false);
  expect(badge(mastered(1), "master-first-card").earned).toBe(true);
  expect(badge(mastered(24), "master-25-cards").earned).toBe(false);
  expect(badge(mastered(25), "master-25-cards").earned).toBe(true);
  const data = mastered(25);
  data.schedules![0].nextReviewAt = "2026-09-23T12:00:00";
  expect(badge(data, "master-25-cards").current).toBe(24);
});
test("comeback requires a saved Needs review to Mastered transition", () => {
  let data = mastered(1);
  expect(badge(data, "comeback-kid").earned).toBe(false);
  data = recordRating(data, "reviewer-1", "0", false, "flashcard", now);
  expect(badge(data, "comeback-kid").earned).toBe(false);
  for (let n = 0; n < 3; n++)
    data = recordRating(data, "reviewer-1", "0", true, "flashcard", now);
  expect(badge(data, "comeback-kid").earned).toBe(true);
  const previous = scheduleCard(
    undefined,
    "reviewer-1",
    "0",
    true,
    "quiz",
    now,
  );
  previous.nextReviewAt = now.toISOString();
  expect(
    scheduleCard(previous, "reviewer-1", "0", true, "quiz", now).needsReviewAt,
  ).toBe(now.toISOString());
});
test("due rewards reject empty, partial and incorrect queues and deduplicate sessions/days", () => {
  let data = mastered(2);
  expect(badge(complete(data), "clear-due-queue").earned).toBe(false);
  data.schedules!.forEach((s) => {
    s.nextReviewAt = now.toISOString();
  });
  const start = session(data);
  expect(start.dueAtStart).toHaveLength(2);
  expect(
    recordStudyCompletion(
      data,
      start,
      "partial",
      [{ cardId: "0", correct: true }],
      true,
      now,
    ),
  ).toBe(data);
  const wrong = recordStudyCompletion(
    data,
    start,
    "wrong",
    [
      { cardId: "0", correct: false },
      { cardId: "1", correct: true },
    ],
    false,
    now,
  );
  expect(badge(wrong, "clear-due-queue").earned).toBe(false);
  data = complete(data, start);
  expect(badge(data, "clear-due-queue").earned).toBe(true);
  expect(complete(data, start)).toBe(data);
  data = complete(data, start, "again");
  expect(badge(data, "due-five-days").current).toBe(1);
  for (let n = 1; n <= 4; n++)
    data = complete(
      data,
      start,
      "day" + n,
      false,
      false,
      new Date(2026, 8, 24 + n, 12),
    );
  expect(badge(data, "due-five-days").earned).toBe(true);
  expect(
    recordStudyCompletion(data, { ...start, cards: [] }, "empty", [], true),
  ).toBe(data);
  expect(captureDueCards({ ...data, reviewers: [] }, undefined, now)).toEqual(
    [],
  );
});
test("daily selection cannot clear cards outside its initial selection; reviewer queues are scoped", () => {
  const data = mastered(2);
  data.schedules!.forEach((s) => {
    s.nextReviewAt = now.toISOString();
  });
  const daily: Session = {
    ...session(data),
    mode: "daily",
    cards: [data.reviewers[0].cards[0]],
  };
  expect(badge(complete(data, daily), "clear-due-queue").earned).toBe(false);
  expect(captureDueCards(data, "other", now)).toEqual([]);
});
test("Topic Tamer needs all ten or more cards mastered in one real topic", () => {
  expect(badge(mastered(9), "topic-tamer").earned).toBe(false);
  expect(badge(mastered(10), "topic-tamer").earned).toBe(true);
  const data = mastered(10);
  data.schedules!.pop();
  expect(badge(data, "topic-tamer").earned).toBe(false);
});
test.each([
  [40, 60, true],
  [55, 75, true],
  [55, 76, true],
  [80, 95, false],
])("Rising Scholar %i to %i", (before, after, earned) => {
  const data = library();
  data.attempts = [
    attempt({
      id: "later",
      date: "2026-09-24T12:00:00",
      correct: after,
      total: 100,
    }),
    attempt({
      id: "before",
      date: "2026-09-23T12:00:00",
      correct: before,
      total: 100,
    }),
  ];
  expect(badge(data, "rising-scholar").earned).toBe(earned);
  data.attempts[0].reviewerId = "other";
  expect(badge(data, "rising-scholar").earned).toBe(false);
});
test("improvement excludes tied timestamps/daily attempts and supports nonconsecutive results", () => {
  const data = library();
  data.attempts = [20, 10, 30, 50].map((correct, i) =>
    attempt({
      id: String(i),
      correct,
      total: 100,
      date: i < 2 ? "2026-09-20T12:00:00" : "2026-09-21T12:00:00",
    }),
  );
  expect(badge(data, "rising-scholar").earned).toBe(true);
  data.attempts.forEach((a) => {
    a.date = "2026-09-20T12:00:00";
  });
  expect(badge(data, "rising-scholar").earned).toBe(false);
  data.attempts.forEach((a) => {
    a.mode = "daily";
  });
  expect(badge(data, "rising-scholar").earned).toBe(false);
});
test("Second Chance uses five unique reviewer/card pairs with strictly later correct results", () => {
  const data = library();
  const misses = Array.from({ length: 5 }, (_, i) => result(String(i), false));
  const hits = misses.map((r) => ({ ...r, correct: true }));
  data.attempts = [
    attempt({
      id: "miss",
      date: "2026-09-20T12:00:00",
      total: 5,
      correct: 0,
      results: misses,
    }),
    attempt({
      id: "hit",
      date: "2026-09-21T12:00:00",
      total: 5,
      correct: 5,
      results: hits,
    }),
  ];
  expect(badge(data, "second-chance").earned).toBe(true);
  data.attempts[1].results = [hits[0], hits[0], hits[0], hits[0], hits[0]];
  expect(badge(data, "second-chance").current).toBe(1);
  data.attempts[1].date = data.attempts[0].date;
  expect(badge(data, "second-chance").current).toBe(0);
  data.attempts[1].date = "2026-09-21T12:00:00";
  data.attempts[1].reviewerId = "different";
  expect(badge(data, "second-chance").current).toBe(0);
  data.attempts[1].reviewerId = "";
  expect(badge(data, "second-chance").current).toBe(0);
});
test("voice and offline require actual full completions, not opening or abandoning", () => {
  const data = library();
  expect(badge(data, "offline-scholar").earned).toBe(false);
  expect(badge(data, "voice-learner").earned).toBe(false);
  const s = { ...session(data), mode: "quiz" as const };
  const finished = complete(data, s, "voice", true, true);
  expect(badge(finished, "voice-learner").earned).toBe(true);
  expect(badge(finished, "offline-scholar").earned).toBe(true);
  expect(badge(complete(data, s), "voice-learner").earned).toBe(false);
  expect(badge(complete(data, s), "offline-scholar").earned).toBe(false);
  expect(
    badge(complete(data, session(data), "cards", true), "offline-scholar")
      .earned,
  ).toBe(true);
});
test("evidence, legacy IDs and new earned rewards survive JSON round trips", () => {
  const data = complete(mastered(1), undefined, "offline", true);
  data.earnedBadges = ["badge-1", "badge-10", "offline-scholar"];
  const restored = withAchievements(
    validateData(JSON.parse(JSON.stringify(data))),
  );
  expect(restored.earnedBadges).toEqual(
    expect.arrayContaining(data.earnedBadges),
  );
  expect(restored.studyCompletions).toEqual(data.studyCompletions);
  expect(validateData({ ...library(), version: 2 }).version).toBe(2);
  expect(
    validateData({
      ...library(),
      version: 1,
      subjects: library().topics,
      reviewers: [],
    }).version,
  ).toBe(2);
  const recovered = recordRating(
    recordRating(data, "reviewer-1", "0", false, "quiz", now),
    "reviewer-1",
    "0",
    true,
    "quiz",
    now,
  );
  expect(validateData(recovered).schedules).toEqual(recovered.schedules);
  expect(() =>
    validateData({
      ...data,
      studyCompletions: [...data.studyCompletions!, ...data.studyCompletions!],
    }),
  ).toThrow();
  expect(() =>
    validateData({
      ...data,
      studyCompletions: [{ ...data.studyCompletions![0], reviewedDueCount: 2 }],
    }),
  ).toThrow();
  expect(() => validateData({ ...data, earnedBadges: ["unknown"] })).toThrow();
});
test("draft validation preserves the initial due queue without recapturing on resume", () => {
  const data = library();
  const draft = {
    id: "draft",
    title: "Quiz",
    reviewerId: "reviewer-1",
    mode: "quiz",
    difficulty: "hard",
    cards: data.reviewers[0].cards,
    index: 0,
    answers: [],
    answer: "",
    answerWasVoice: true,
    checked: false,
    startedAt: now.toISOString(),
    elapsedMs: 0,
    dueAtStart: [{ reviewerId: "reviewer-1", cardId: "card-1" }],
  };
  expect(parseQuizDraft(draft).dueAtStart).toEqual(draft.dueAtStart);
  expect(parseQuizDraft(draft).answerWasVoice).toBe(true);
  expect(() => parseQuizDraft({ ...draft, answerWasVoice: "yes" })).toThrow();
  expect(() =>
    parseQuizDraft({ ...draft, dueAtStart: [{ cardId: "card-1" }] }),
  ).toThrow();
});

test("saved due ratings count local days without requiring a full session", () => {
  let data = mastered(1);
  for (let i = 0; i < 5; i++) {
    const date = new Date(2026, 8, 24 + i, 12);
    data.schedules![0].nextReviewAt = date.toISOString();
    data = recordRating(data, "reviewer-1", "0", true, "flashcard", date);
    data = recordRating(data, "reviewer-1", "0", true, "flashcard", date);
    expect(badge(data, "due-five-days").current).toBe(i + 1);
  }
  expect(badge(data, "due-five-days").earned).toBe(true);
  expect(validateData(data).milestones?.dueReviewDates).toEqual(
    data.milestones?.dueReviewDates,
  );
  expect(() =>
    validateData({ ...data, milestones: { dueReviewDates: ["2026-02-30"] } }),
  ).toThrow();
});
