import { dayKey } from "../utils/stats";
import { ACHIEVEMENT_IDS } from "../features/achievements/catalog";
import { STORAGE_KEY } from "../config/storage";
import {
  storedSnapshot,
  databaseReady,
  persistStudyData,
} from "./storageRuntime";
import type { StudyData } from "../types/study";

export function emptyData(): StudyData {
  return {
    version: 3,
    topics: [],
    folders: [],
    reviewers: [],
    attempts: [],
    settings: {
      name: "",
      dailyGoal: 10,
      quizSize: 10,
      dailyQuizSize: 20,
      autoDaily: true,
      shuffle: true,
      theme: "system",
    },
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function string(value: unknown): value is string {
  return typeof value === "string" && value.length <= 20000;
}
function integer(value: unknown, min: number, max: number): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}
function date(value: unknown): boolean {
  return string(value) && !Number.isNaN(Date.parse(value));
}
function uniqueIds(items: { id: string }[]): boolean {
  return (
    items.every((item) => item.id.length > 0) &&
    new Set(items.map((item) => item.id)).size === items.length
  );
}

export function validateData(value: unknown): StudyData {
  // Keep existing libraries and version-1 exports compatible with Topics.
  if (
    record(value) &&
    value.version === 1 &&
    Array.isArray(value.subjects) &&
    Array.isArray(value.reviewers)
  ) {
    const { subjects, reviewers, ...rest } = value;
    value = {
      ...rest,
      version: 2,
      topics: subjects,
      reviewers: reviewers.map((reviewer) => {
        if (!record(reviewer)) return reviewer;
        const { subjectId, ...fields } = reviewer;
        return { ...fields, topicId: subjectId };
      }),
    };
  }
  if (
    !record(value) ||
    (value.version !== 2 && value.version !== 3) ||
    !Array.isArray(value.topics) ||
    !Array.isArray(value.reviewers) ||
    !Array.isArray(value.attempts) ||
    !record(value.settings)
  )
    throw new Error("This is not a supported Mira backup (version 1, 2 or 3).");
  if (
    !value.topics.every(
      (s) =>
        record(s) &&
        string(s.id) &&
        string(s.name) &&
        s.name.trim() &&
        typeof s.color === "string" &&
        /^#[0-9a-f]{6}$/i.test(s.color),
    )
  )
    throw new Error("The backup contains an invalid topic.");
  if (
    !value.reviewers.every(
      (r) =>
        record(r) &&
        string(r.id) &&
        string(r.title) &&
        r.title.trim() &&
        string(r.description) &&
        string(r.topicId) &&
        date(r.updatedAt) &&
        Array.isArray(r.cards) &&
        r.cards.every(
          (c) =>
            record(c) &&
            string(c.id) &&
            string(c.question) &&
            c.question.trim() &&
            string(c.answer) &&
            c.answer.trim(),
        ),
    )
  )
    throw new Error("The backup contains an invalid reviewer or flashcard.");
  if (
    !value.attempts.every(
      (a) =>
        record(a) &&
        string(a.id) &&
        string(a.reviewerId) &&
        string(a.title) &&
        date(a.date) &&
        integer(a.total, 1, 100000) &&
        integer(a.correct, 0, a.total as number) &&
        (a.mode === "quiz" || a.mode === "daily"),
    )
  )
    throw new Error("The backup contains an invalid quiz result.");
  if (
    value.lastStudy !== undefined &&
    (!record(value.lastStudy) ||
      !string(value.lastStudy.reviewerId) ||
      !date(value.lastStudy.startedAt))
  )
    throw new Error("The backup contains invalid study history.");
  if (
    value.earnedBadges !== undefined &&
    (!Array.isArray(value.earnedBadges) ||
      !value.earnedBadges.every(
        (id) => typeof id === "string" && ACHIEVEMENT_IDS.includes(id),
      ))
  )
    throw new Error("The backup contains invalid achievements.");
  if (
    value.attempts.some(
      (a) =>
        a.difficulty !== undefined &&
        a.difficulty !== "normal" &&
        a.difficulty !== "hard",
    )
  )
    throw new Error("The backup contains an invalid quiz difficulty.");
  if (value.achievementVersion !== undefined && value.achievementVersion !== 2)
    throw new Error("Invalid achievement version.");
  if (value.milestones !== undefined) {
    const m = value.milestones;
    if (
      !record(m) ||
      (m.studyDates !== undefined &&
        (!Array.isArray(m.studyDates) || !m.studyDates.every(date))) ||
      (m.dueReviewDates !== undefined &&
        (!Array.isArray(m.dueReviewDates) ||
          !m.dueReviewDates.every(
            (d) =>
              typeof d === "string" &&
              /^\d{4}-\d{2}-\d{2}$/.test(d) &&
              dayKey(d + "T12:00:00") === d,
          ))) ||
      ["importedReviewer", "focusCompleted", "askedMira"].some(
        (key) => m[key] !== undefined && typeof m[key] !== "boolean",
      )
    )
      throw new Error("Invalid achievement milestones.");
  }
  if (
    value.attempts.some(
      (a) => a.fastCorrect !== undefined && typeof a.fastCorrect !== "boolean",
    )
  )
    throw new Error("Invalid answer timing milestone.");
  if (
    value.studyCompletions !== undefined &&
    (!Array.isArray(value.studyCompletions) ||
      !value.studyCompletions.every(
        (e) =>
          record(e) &&
          string(e.id) &&
          e.id &&
          date(e.date) &&
          ["cards", "quiz", "daily"].includes(e.kind as string) &&
          typeof e.offline === "boolean" &&
          typeof e.voice === "boolean" &&
          integer(e.dueCount, 0, 1000000) &&
          integer(e.reviewedDueCount, 0, e.dueCount),
      ))
  )
    throw new Error("Invalid study completion evidence.");
  if (
    Array.isArray(value.studyCompletions) &&
    !uniqueIds(value.studyCompletions)
  )
    throw new Error("Duplicate study completion evidence.");
  const s = value.settings;
  if (
    !string(s.name) ||
    !integer(s.dailyGoal, 1, 200) ||
    !integer(s.quizSize, 1, 100) ||
    (s.dailyQuizSize !== undefined && !integer(s.dailyQuizSize, 1, 100)) ||
    typeof s.autoDaily !== "boolean" ||
    typeof s.shuffle !== "boolean" ||
    (s.theme !== undefined &&
      s.theme !== "light" &&
      s.theme !== "dark" &&
      s.theme !== "system")
  )
    throw new Error("The backup contains invalid settings.");
  if (
    value.folders !== undefined &&
    (!Array.isArray(value.folders) ||
      !value.folders.every(
        (folder) =>
          record(folder) &&
          string(folder.id) &&
          string(folder.name) &&
          folder.name.trim(),
      ))
  )
    throw new Error("The backup contains an invalid folder.");
  for (const reviewer of value.reviewers)
    for (const card of reviewer.cards) {
      if (
        card.acceptedAnswers !== undefined &&
        (!Array.isArray(card.acceptedAnswers) ||
          card.acceptedAnswers.length > 20 ||
          !card.acceptedAnswers.every(
            (answer: unknown) => string(answer) && answer.trim(),
          ))
      )
        throw new Error("Invalid accepted answers.");
    }
  for (const attempt of value.attempts) {
    if (attempt.results === undefined) continue;
    if (
      !Array.isArray(attempt.results) ||
      attempt.results.length !== attempt.total ||
      !attempt.results.every(
        (r: unknown) =>
          record(r) &&
          string(r.cardId) &&
          r.cardId &&
          (r.reviewerId === undefined || string(r.reviewerId)) &&
          string(r.question) &&
          string(r.expectedAnswer) &&
          string(r.userAnswer) &&
          typeof r.correct === "boolean" &&
          integer(r.durationMs, 0, 604800000) &&
          (r.voice === undefined || typeof r.voice === "boolean"),
      ) ||
      attempt.results.filter((r: { correct: boolean }) => r.correct).length !==
        attempt.correct
    )
      throw new Error("Invalid question results.");
  }
  if (
    value.schedules !== undefined &&
    (!Array.isArray(value.schedules) ||
      !value.schedules.every(
        (s: unknown) =>
          record(s) &&
          string(s.reviewerId) &&
          string(s.cardId) &&
          date(s.lastReviewedAt) &&
          date(s.nextReviewAt) &&
          (s.needsReviewAt === undefined || date(s.needsReviewAt)) &&
          (s.recoveredAt === undefined ||
            (date(s.recoveredAt) &&
              date(s.needsReviewAt) &&
              Date.parse(String(s.recoveredAt)) >=
                Date.parse(String(s.needsReviewAt)))) &&
          integer(s.repetitions, 0, 1000000) &&
          integer(s.lapses, 0, 1000000) &&
          typeof s.intervalDays === "number" &&
          Number.isFinite(s.intervalDays) &&
          s.intervalDays > 0 &&
          s.intervalDays <= 180 &&
          Array.isArray(s.recent) &&
          s.recent.length <= 10 &&
          s.recent.every((v) => typeof v === "boolean") &&
          (s.source === "quiz" || s.source === "flashcard"),
      ))
  )
    throw new Error("Invalid card schedules.");
  const data = value as unknown as StudyData;
  const folders = data.folders ?? [];
  if (
    data.schedules &&
    new Set(data.schedules.map((s) => JSON.stringify([s.reviewerId, s.cardId])))
      .size !== data.schedules.length
  )
    throw new Error("Duplicate card schedules.");
  if (
    !uniqueIds(folders) ||
    !data.reviewers.every(
      (reviewer) =>
        reviewer.folderId === undefined ||
        reviewer.folderId === "" ||
        (typeof reviewer.folderId === "string" &&
          folders.some((folder) => folder.id === reviewer.folderId)),
    )
  )
    throw new Error(
      "The backup contains duplicate folders or missing folder references.",
    );
  if (
    !uniqueIds(data.topics) ||
    !uniqueIds(data.reviewers) ||
    !uniqueIds(data.attempts) ||
    !data.reviewers.every(
      (r) =>
        uniqueIds(r.cards) &&
        (!r.topicId || data.topics.some((s) => s.id === r.topicId)),
    )
  )
    throw new Error("The backup contains duplicate IDs or missing topics.");
  // Construct only recognized fields. Imported objects never become application state directly.
  return {
    version: data.version,
    ...(data.studyCompletions
      ? {
          studyCompletions: data.studyCompletions.map((e) => ({
            id: e.id,
            date: e.date,
            kind: e.kind,
            offline: e.offline,
            voice: e.voice,
            dueCount: e.dueCount,
            reviewedDueCount: e.reviewedDueCount,
          })),
        }
      : {}),
    topics: data.topics.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
    })),
    ...(data.folders
      ? { folders: data.folders.map((f) => ({ id: f.id, name: f.name })) }
      : {}),
    reviewers: data.reviewers.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      topicId: r.topicId,
      ...(r.folderId !== undefined ? { folderId: r.folderId } : {}),
      updatedAt: r.updatedAt,
      cards: r.cards.map((c) => ({
        id: c.id,
        question: c.question,
        answer: c.answer,
        ...(c.acceptedAnswers
          ? { acceptedAnswers: [...c.acceptedAnswers] }
          : {}),
      })),
    })),
    attempts: data.attempts.map((a) => ({
      id: a.id,
      reviewerId: a.reviewerId,
      title: a.title,
      date: a.date,
      correct: a.correct,
      total: a.total,
      mode: a.mode,
      ...(a.difficulty ? { difficulty: a.difficulty } : {}),
      ...(a.fastCorrect !== undefined ? { fastCorrect: a.fastCorrect } : {}),
      ...(a.results
        ? {
            results: a.results.map((r) => ({
              cardId: r.cardId,
              ...(r.reviewerId !== undefined
                ? { reviewerId: r.reviewerId }
                : {}),
              question: r.question,
              expectedAnswer: r.expectedAnswer,
              userAnswer: r.userAnswer,
              correct: r.correct,
              durationMs: r.durationMs,
              ...(r.voice !== undefined ? { voice: r.voice } : {}),
            })),
          }
        : {}),
    })),
    settings: {
      name: data.settings.name,
      dailyGoal: data.settings.dailyGoal,
      quizSize: data.settings.quizSize,
      ...(data.settings.dailyQuizSize !== undefined
        ? { dailyQuizSize: data.settings.dailyQuizSize }
        : {}),
      autoDaily: data.settings.autoDaily,
      shuffle: data.settings.shuffle,
      theme: data.settings.theme ?? "system",
    },
    ...(data.lastStudy
      ? {
          lastStudy: {
            reviewerId: data.lastStudy.reviewerId,
            startedAt: data.lastStudy.startedAt,
          },
        }
      : {}),
    ...(data.earnedBadges ? { earnedBadges: [...data.earnedBadges] } : {}),
    ...(data.achievementVersion
      ? { achievementVersion: data.achievementVersion }
      : {}),
    ...(data.milestones
      ? {
          milestones: {
            ...(data.milestones.dueReviewDates
              ? { dueReviewDates: [...new Set(data.milestones.dueReviewDates)] }
              : {}),
            ...(data.milestones.studyDates
              ? { studyDates: [...data.milestones.studyDates] }
              : {}),
            ...(data.milestones.importedReviewer !== undefined
              ? { importedReviewer: data.milestones.importedReviewer }
              : {}),
            ...(data.milestones.focusCompleted !== undefined
              ? { focusCompleted: data.milestones.focusCompleted }
              : {}),
            ...(data.milestones.askedMira !== undefined
              ? { askedMira: data.milestones.askedMira }
              : {}),
          },
        }
      : {}),
    ...(data.schedules
      ? {
          schedules: data.schedules.map((s) => ({
            ...(s.needsReviewAt ? { needsReviewAt: s.needsReviewAt } : {}),
            ...(s.recoveredAt ? { recoveredAt: s.recoveredAt } : {}),
            reviewerId: s.reviewerId,
            cardId: s.cardId,
            lastReviewedAt: s.lastReviewedAt,
            nextReviewAt: s.nextReviewAt,
            repetitions: s.repetitions,
            lapses: s.lapses,
            intervalDays: s.intervalDays,
            recent: [...s.recent],
            source: s.source,
          })),
        }
      : {}),
  };
}

export function readData(): { data: StudyData; error: string } {
  const snapshot = storedSnapshot();
  if (snapshot) return snapshot;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return {
      data: saved ? validateData(JSON.parse(saved)) : emptyData(),
      error: "",
    };
  } catch {
    return {
      data: emptyData(),
      error:
        "Mira could not load your saved data. Export the existing storage before saving new changes, or reload to try again.",
    };
  }
}
export function saveData(data: StudyData) {
  if (databaseReady()) return persistStudyData(data);
  if (storedSnapshot()?.error)
    throw new Error("Reload to reopen the study database before saving.");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
export function downloadJson(
  value: unknown,
  name = `mira-backup-${new Date().toISOString().slice(0, 10)}.json`,
) {
  const url = URL.createObjectURL(
    new Blob(
      [typeof value === "string" ? value : JSON.stringify(value, null, 2)],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
