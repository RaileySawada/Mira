import type { StudyData } from "../types/study";

export const STORAGE_KEY = "mira.study.v1";
export function emptyData(): StudyData {
  return {
    version: 2,
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
    value.version !== 2 ||
    !Array.isArray(value.topics) ||
    !Array.isArray(value.reviewers) ||
    !Array.isArray(value.attempts) ||
    !record(value.settings)
  )
    throw new Error("This is not a supported Mira backup (version 1 or 2).");
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
  if (value.lastStudy !== undefined && (!record(value.lastStudy) || !string(value.lastStudy.reviewerId) || !date(value.lastStudy.startedAt)))
    throw new Error("The backup contains invalid study history.");
  if (value.earnedBadges !== undefined && (!Array.isArray(value.earnedBadges) || !value.earnedBadges.every(id => typeof id === "string" && /^badge-(?:[1-9]|10)$/.test(id))))
    throw new Error("The backup contains invalid achievements.");
  if (value.attempts.some(a => a.difficulty !== undefined && a.difficulty !== "normal" && a.difficulty !== "hard"))
    throw new Error("The backup contains an invalid quiz difficulty.");
  if (value.achievementVersion !== undefined && value.achievementVersion !== 2) throw new Error("Invalid achievement version.");
  if (value.milestones !== undefined) {
    const m = value.milestones;
    if (!record(m) || (m.studyDates !== undefined && (!Array.isArray(m.studyDates) || !m.studyDates.every(date))) ||
      ["importedReviewer", "focusCompleted", "askedMira"].some(key => m[key] !== undefined && typeof m[key] !== "boolean"))
      throw new Error("Invalid achievement milestones.");
  }
  if (value.attempts.some(a => a.fastCorrect !== undefined && typeof a.fastCorrect !== "boolean")) throw new Error("Invalid answer timing milestone.");
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
  if (value.folders !== undefined && (!Array.isArray(value.folders) || !value.folders.every(folder => record(folder) && string(folder.id) && string(folder.name) && folder.name.trim())))
    throw new Error("The backup contains an invalid folder.");
  const data = value as unknown as StudyData;
  const folders = data.folders ?? [];
  if (!uniqueIds(folders) || !data.reviewers.every(reviewer => reviewer.folderId === undefined || reviewer.folderId === "" || (typeof reviewer.folderId === "string" && folders.some(folder => folder.id === reviewer.folderId))))
    throw new Error("The backup contains duplicate folders or missing folder references.");
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
  return {
    ...data,
    settings: { ...data.settings, theme: data.settings.theme ?? "system" },
  };
}

export function readData(): { data: StudyData; error: string } {
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
