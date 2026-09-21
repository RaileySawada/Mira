import type { StudyData, Reviewer, Card, Attempt, QuestionResult, CardSchedule } from "../types/study";
import { validateData } from "./storage";
const STORE_NAMES = [
  "metadata",
  "reviewers",
  "cards",
  "attempts",
  "results",
  "schedules",
  "drafts",
] as const;
type StoreName = (typeof STORE_NAMES)[number];
type ReviewerRow = Omit<Reviewer, "cards"> & { order: number };
type CardRow = Card & { reviewerId: string; order: number };
type AttemptRow = Omit<Attempt, "results"> & { order: number; hasResults: boolean };
type ResultRow = QuestionResult & { attemptId: string; order: number };
export function openStudyDatabase(name = "mira-study"): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 3);
    request.onupgradeneeded = () => {
      for (const store of STORE_NAMES)
        if (!request.result.objectStoreNames.contains(store))
          request.result.createObjectStore(store);
    };
    request.onerror = () => reject(request.error ?? new Error("The study database request failed."));
    let blocked = false;
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Close other Mira tabs to update the study database."));
    };
    request.onsuccess = () => {
      const db = request.result;
      if (blocked) {
        db.close();
        return;
      }
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}
function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(tx.error ?? new Error("The study save was cancelled."));
    tx.onerror = () => reject(tx.error ?? new Error("The study save failed."));
  });
}
type Row = [IDBValidKey, unknown];
export function libraryRows(
  input: StudyData,
): Record<Exclude<StoreName, "drafts">, Row[]> {
  const data = validateData(input);
  const { reviewers, attempts, schedules, ...metadata } = data;
  return {
    metadata: [["library", { ...metadata, version: 3 }]],
    reviewers: reviewers.map((r, order) => {
      const { cards: _cards, ...fields } = r;
      return [r.id, { ...fields, order }];
    }),
    cards: reviewers.flatMap((r) =>
      r.cards.map(
        (c, order) => [[r.id, c.id], { ...c, reviewerId: r.id, order }] as Row,
      ),
    ),
    attempts: attempts.map((a, order) => {
      const { results: _results, ...fields } = a;
      return [a.id, { ...fields, order, hasResults: a.results !== undefined }];
    }),
    results: attempts.flatMap((a) =>
      (a.results ?? []).map(
        (r, index) =>
          [[a.id, index], { ...r, attemptId: a.id, order: index }] as Row,
      ),
    ),
    schedules: (schedules ?? []).map((s) => [[s.reviewerId, s.cardId], s]),
  };
}
// All changes commit together. A failed transaction leaves the previous library intact.
export async function writeStudyDatabase(
  db: IDBDatabase,
  data: StudyData,
): Promise<void> {
  const rows = libraryRows(data);
  const tx = db.transaction(Object.keys(rows), "readwrite");
  const done = transactionDone(tx);
  for (const [name, entries] of Object.entries(rows)) {
    const store = tx.objectStore(name);
    const desired = new Set(entries.map(([key]) => JSON.stringify(key)));
    const cursor = store.openKeyCursor();
    cursor.onsuccess = () => {
      const item = cursor.result;
      if (!item) return;
      if (!desired.has(JSON.stringify(item.key))) store.delete(item.key);
      item.continue();
    };
    for (const [key, value] of entries) store.put(value, key);
  }
  await done;
}
export async function readStudyDatabase(
  db: IDBDatabase,
): Promise<StudyData | undefined> {
  const tx = db.transaction(
    STORE_NAMES.filter((s) => s !== "drafts"),
    "readonly",
  );
  const metadataPromise = requestValue(
    tx.objectStore("metadata").get("library"),
  );
  const reviewersPromise = requestValue<ReviewerRow[]>(tx.objectStore("reviewers").getAll());
  const cardsPromise = requestValue<CardRow[]>(tx.objectStore("cards").getAll());
  const attemptsPromise = requestValue<AttemptRow[]>(tx.objectStore("attempts").getAll());
  const resultsPromise = requestValue<ResultRow[]>(tx.objectStore("results").getAll());
  const schedulesPromise = requestValue<CardSchedule[]>(tx.objectStore("schedules").getAll());
  const [metadata, reviewers, cards, attempts, results, schedules] =
    await Promise.all([
      metadataPromise,
      reviewersPromise,
      cardsPromise,
      attemptsPromise,
      resultsPromise,
      schedulesPromise,
    ]);
  if (!metadata) return undefined;
  const cardsByReviewer = new Map<string, CardRow[]>();
  for (const card of cards) {
    const group = cardsByReviewer.get(card.reviewerId) ?? [];
    group.push(card);
    cardsByReviewer.set(card.reviewerId, group);
  }
  const resultsByAttempt = new Map<string, ResultRow[]>();
  for (const result of results) {
    const group = resultsByAttempt.get(result.attemptId) ?? [];
    group.push(result);
    resultsByAttempt.set(result.attemptId, group);
  }
  return validateData({
    ...metadata,
    reviewers: reviewers
      .sort((a, b) => a.order - b.order)
      .map((r) => ({
        ...r,
        cards: (cardsByReviewer.get(r.id) ?? [])
          .sort((a, b) => a.order - b.order),
      })),
    attempts: attempts
      .sort((a, b) => a.order - b.order)
      .map((a) => ({
        ...a,
        ...(a.hasResults
          ? {
              results: (resultsByAttempt.get(a.id) ?? [])
                .sort((a, b) => a.order - b.order),
            }
          : {}),
      })),
    schedules,
  });
}
export async function migrateStudyDatabase(
  db: IDBDatabase,
  legacy: unknown,
): Promise<StudyData> {
  const existing = await readStudyDatabase(db);
  if (existing) return existing;
  const migrated: StudyData = {
    ...validateData(legacy),
    version: 3,
    schedules: validateData(legacy).schedules ?? [],
  };
  await writeStudyDatabase(db, migrated);
  const verified = await readStudyDatabase(db);
  if (JSON.stringify(verified) !== JSON.stringify(validateData(migrated)))
    throw new Error(
      "Migration verification failed. The original backup has not been removed.",
    );
  return verified!;
}
export async function writeQuizDraft(
  db: IDBDatabase,
  draft: unknown,
): Promise<void> {
  const tx = db.transaction("drafts", "readwrite");
  const done = transactionDone(tx);
  if (draft === undefined) tx.objectStore("drafts").delete("active");
  else tx.objectStore("drafts").put(draft, "active");
  await done;
}
export async function readQuizDraft(db: IDBDatabase): Promise<unknown> {
  return requestValue(
    db.transaction("drafts").objectStore("drafts").get("active"),
  );
}

export async function exportStudyRecovery(db: IDBDatabase): Promise<Record<string, unknown>> {
 const tx = db.transaction([...STORE_NAMES], "readonly");
 const records = await Promise.all(STORE_NAMES.map(async store => [store, await requestValue(tx.objectStore(store).getAll())] as const));
 return Object.fromEntries(records);
}
