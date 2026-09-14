import { emptyData } from "../src/services/storage";
import type { Attempt, Reviewer, StudyData } from "../src/types/study";
export function reviewer(overrides: Partial<Reviewer> = {}): Reviewer {
  return {
    id: "reviewer-1",
    title: "Cell biology",
    description: "Learn the basics.",
    topicId: "topic-1",
    updatedAt: "2026-09-14T10:00:00.000Z",
    cards: [
      {
        id: "card-1",
        question: "Powerhouse of the cell?",
        answer: "Mitochondria",
      },
      {
        id: "card-2",
        question: "What carries genetic information?",
        answer: "DNA",
      },
    ],
    ...overrides,
  };
}
export function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: "attempt-1",
    reviewerId: "reviewer-1",
    title: "Cell biology",
    date: new Date().toISOString(),
    correct: 1,
    total: 2,
    mode: "quiz",
    ...overrides,
  };
}
export function library(): StudyData {
  return {
    ...emptyData(),
    topics: [{ id: "topic-1", name: "Biology", color: "#8d80b5" }],
    reviewers: [reviewer()],
  };
}
