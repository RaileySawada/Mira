import type { StudyData } from "../types/study";
import { emptyData, validateData } from "./storage";
import { STORAGE_KEY, PREFERENCES_KEY, QUIZ_DRAFT_KEY } from "../config/storage";

import {
  openStudyDatabase,
  readStudyDatabase,
  migrateStudyDatabase,
  writeStudyDatabase,
  readQuizDraft,
  writeQuizDraft,
  exportStudyRecovery,
} from "./studyDatabase";
let database: IDBDatabase | undefined;
let snapshot: { data: StudyData; error: string } | undefined;
export function storedSnapshot() {
  return snapshot;
}
export async function initializeStudyStorage(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    database = await openStudyDatabase();
    const saved = await readStudyDatabase(database);
    const legacy = saved ? undefined : localStorage.getItem(STORAGE_KEY);
    const data =
      saved ??
      (await migrateStudyDatabase(
        database,
        legacy ? JSON.parse(legacy) : emptyData(),
      ));
    snapshot = { data: validateData(data), error: "" };
  } catch {
    snapshot = {
      data: emptyData(),
      error:
        "Your study database could not be opened. Existing data and the original localStorage backup are untouched. Reload to retry or export recovery data before replacing anything.",
    };
  }
}
export async function persistStudyData(data: StudyData): Promise<void> {
  if (!database)
    throw new Error("The study database is not open. Reload to retry.");
  await writeStudyDatabase(database, data);
  snapshot = { data: { ...data, version: 3 }, error: "" };
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(data.settings));
  } catch {}
}
export function databaseReady() {
  return !!database;
}
export async function loadActiveDraft() {
  if (database) return readQuizDraft(database);
  if (snapshot?.error) throw new Error("The study database is unavailable.");
  const saved = localStorage.getItem(QUIZ_DRAFT_KEY);
  return saved ? JSON.parse(saved) : undefined;
}
let draftWrites: Promise<void> = Promise.resolve();
export function persistActiveDraft(draft: unknown): Promise<void> {
  const task = draftWrites
    .catch(() => {})
    .then(async () => {
      if (database) await writeQuizDraft(database, draft);
      else {
        if (snapshot?.error) throw new Error("The study database is unavailable.");
        if (draft === undefined) localStorage.removeItem(QUIZ_DRAFT_KEY);
        else localStorage.setItem(QUIZ_DRAFT_KEY, JSON.stringify(draft));
      }
    });
  draftWrites = task;
  return task;
}

export async function recoveryBackup(): Promise<unknown> {
 const legacy = localStorage.getItem(STORAGE_KEY);
 return database ? { format: "mira-recovery-v3", legacy, stores: await exportStudyRecovery(database) } : legacy ?? "{}";
}
export async function clearStudyRecoveryAndDraft(): Promise<void> {
 await persistActiveDraft(undefined);
 localStorage.removeItem(STORAGE_KEY);
}
