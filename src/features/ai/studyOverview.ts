import { STUDY_OVERVIEW_KEYS } from "../../config/ai";
import type { StudyOverview } from "../../types/ai";
import { studyStreak } from "../learning/streak";
import type { StudyData } from "../../types/study";
import { achievements } from "../achievements/achievements";
import { dayKey, percentage } from "../../utils/stats";
import { dailyQuizSize } from "../../utils/quiz";
import { isRecord } from "../../utils/validation";

const short = (value: string, limit = 80) => value.trim().slice(0, limit);

export function buildStudyOverview(
  data: StudyData,
  now = new Date(),
): StudyOverview {
  const today = dayKey(now);
  const recent = [...data.attempts].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const reviewers = [...data.reviewers].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  const topics = new Map(data.topics.map((topic) => [topic.id, topic.name]));
  const folders = new Map(
    (data.folders ?? []).map((folder) => [folder.id, folder.name]),
  );
  const describe = (reviewer: StudyData["reviewers"][number]) => ({
    title: short(reviewer.title),
    cards: reviewer.cards.length,
    topic: short(topics.get(reviewer.topicId) ?? "Uncategorized", 50),
    folder: short(folders.get(reviewer.folderId ?? "") ?? "Unfiled", 50),
  });
  const current = data.reviewers.find(
    (reviewer) => reviewer.id === data.lastStudy?.reviewerId,
  );
  const todayResults = recent.filter(
    (attempt) => dayKey(attempt.date) === today,
  );
  const overview: StudyOverview = {
    name: short(data.settings.name, 40),
    asOf: now.toISOString() + "; local study date: " + today,
    library: JSON.stringify({
      reviewers: data.reviewers.length,
      cards: data.reviewers.reduce(
        (sum, reviewer) => sum + reviewer.cards.length,
        0,
      ),
      topics: data.topics.length,
      folders: data.folders?.length ?? 0,
    }),
    reviewers: JSON.stringify(reviewers.slice(0, 10).map(describe)),
    topics: JSON.stringify(
      data.topics.slice(0, 15).map((topic) => short(topic.name)),
    ),
    folders: JSON.stringify(
      (data.folders ?? []).slice(0, 15).map((folder) => short(folder.name)),
    ),
    currentStudy: current
      ? JSON.stringify(describe(current))
      : "No current saved reviewer.",
    goals: JSON.stringify({
      dailyQuestionGoal: data.settings.dailyGoal,
      dailyReviewQuestions: dailyQuizSize(data.settings),
      autoDaily: data.settings.autoDaily,
      shuffle: data.settings.shuffle,
    }),
    activity: JSON.stringify({
      completedQuizzes: recent.length,
      accuracyPercent: recent.length ? percentage(recent) : null,
      quizStreakDays: studyStreak(data),
      answeredQuestions: recent.reduce(
        (sum, attempt) => sum + attempt.total,
        0,
      ),
      completedFlashcardSessions: data.milestones?.studyDates?.length ?? 0,
      todayQuizzes: todayResults.length,
      todayQuestions: todayResults.reduce(
        (sum, attempt) => sum + attempt.total,
        0,
      ),
      todayFlashcardSessions: (data.milestones?.studyDates ?? []).filter(
        (date) => dayKey(date) === today,
      ).length,
    }),
    recentResults: JSON.stringify(
      recent.slice(0, 5).map((attempt) => ({
        title: short(attempt.title),
        date: short(attempt.date, 40),
        correct: attempt.correct,
        total: attempt.total,
        mode: attempt.mode,
        difficulty: attempt.difficulty ?? "hard",
      })),
    ),
    achievements: JSON.stringify(
      achievements(data)
        .filter((badge) => badge.earned)
        .map((badge) => badge.title),
    ),
    limits:
      "Totals cover all saved records. Lists contain at most 10 recently updated reviewers, 15 topics, 15 folders and 5 recent quiz results. Titles may be shortened. Full flashcard text, unsaved work, and deleted data are not included. No records means no evidence, not poor performance.",
  };
  // Keep even unusually escaped imported titles within the transport budget.
  const lists = ["reviewers", "topics", "folders", "recentResults"] as const;
  for (const key of lists) {
    const items: unknown[] = JSON.parse(overview[key]);
    while (overview[key].length > 2500 && items.length) {
      items.pop();
      overview[key] = JSON.stringify(items);
    }
  }
  while (JSON.stringify(overview).length > 12000) {
    const key = [...lists].sort(
      (a, b) => overview[b].length - overview[a].length,
    )[0];
    const items: unknown[] = JSON.parse(overview[key]);
    if (!items.length) break;
    items.pop();
    overview[key] = JSON.stringify(items);
  }
  return overview;
}

export function parseStudyOverview(value: unknown): StudyOverview | undefined {
  if (value === undefined) return undefined;
  if (
    !isRecord(value) ||
    STUDY_OVERVIEW_KEYS.some(
      (key) =>
        typeof value[key] !== "string" ||
        value[key].length > (key === "name" ? 40 : 3000),
    ) ||
    JSON.stringify(value).length > 14000
  )
    throw new Error("Invalid study overview.");
  return Object.fromEntries(
    STUDY_OVERVIEW_KEYS.map((key) => [key, value[key]]),
  ) as StudyOverview;
}
