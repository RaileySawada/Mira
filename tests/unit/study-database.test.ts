import { serialize, deserialize } from "node:v8";
import "fake-indexeddb/auto";
import { library } from "../support/fixtures";
import {
  exportStudyRecovery,
  openStudyDatabase,
  migrateStudyDatabase,
  readStudyDatabase,
  writeStudyDatabase,
  writeQuizDraft,
  readQuizDraft,
} from "../../src/services/studyDatabase";
Object.defineProperty(globalThis, "structuredClone", {
  configurable: true,
  value: (value: unknown) => deserialize(serialize(value)),
});
let db: IDBDatabase;
beforeEach(async () => {
  db = await openStudyDatabase("mira-test-" + crypto.randomUUID());
});
afterEach(() => db.close());
test("migrates v2 without changing the original and reloads all cards", async () => {
  const original = library();
  const snapshot = JSON.stringify(original);
  const result = await migrateStudyDatabase(db, original);
  expect(result.version).toBe(3);
  expect(result.reviewers).toEqual(original.reviewers);
  expect(JSON.stringify(original)).toBe(snapshot);
  expect(await readStudyDatabase(db)).toEqual(result);
});
test("migrates v1 subject references and preserves older attempt aggregates", async () => {
  const current = library();
  const { topics, ...rest } = current;
  const result = await migrateStudyDatabase(db, {
    ...rest,
    version: 1,
    subjects: topics,
    reviewers: current.reviewers.map(({ topicId, ...r }) => ({
      ...r,
      subjectId: topicId,
    })),
  });
  expect(result.topics).toEqual(topics);
  expect(result.reviewers[0].topicId).toBe(topics[0].id);
});
test("invalid writes leave the existing library intact", async () => {
  const saved = await migrateStudyDatabase(db, library());
  await expect(
    writeStudyDatabase(db, {
      ...saved,
      topics: [{ id: "bad", name: "", color: "invalid" }],
    }),
  ).rejects.toThrow();
  expect(await readStudyDatabase(db)).toEqual(saved);
});
test("existing v3 database is never overwritten by a stale legacy backup", async () => {
  const saved = await migrateStudyDatabase(db, library());
  expect(await migrateStudyDatabase(db, { invalid: true })).toEqual(saved);
});
test("draft writes are separate from library saves and can be discarded", async () => {
  await writeQuizDraft(db, { id: "draft" });
  await migrateStudyDatabase(db, library());
  expect(await readQuizDraft(db)).toEqual({ id: "draft" });
  await writeQuizDraft(db, undefined);
  expect(await readQuizDraft(db)).toBeUndefined();
});

test("question snapshots and schedules round trip in order and deletions remove stale rows", async () => {
  const data = library();
  data.attempts = [
    {
      id: "a",
      reviewerId: "reviewer-1",
      title: "Quiz",
      mode: "quiz",
      date: "2026-09-20T12:00:00Z",
      total: 1,
      correct: 1,
      results: [
        {
          cardId: "card-1",
          question: "q",
          expectedAnswer: "a",
          userAnswer: "a",
          correct: true,
          durationMs: 50,
        },
      ],
    },
  ];
  data.schedules = [
    {
      reviewerId: "reviewer-1",
      cardId: "card-1",
      lastReviewedAt: "2026-09-20T12:00:00Z",
      nextReviewAt: "2026-09-21T12:00:00Z",
      repetitions: 1,
      lapses: 0,
      intervalDays: 1,
      recent: [true],
      source: "quiz",
    },
  ];
  await writeStudyDatabase(db, data);
  const saved = await readStudyDatabase(db);
  expect(saved?.attempts[0].results).toEqual(data.attempts[0].results);
  expect(saved?.schedules).toEqual(data.schedules);
  await writeStudyDatabase(db, {
    ...data,
    reviewers: [],
    attempts: [],
    schedules: [],
  });
  expect((await readStudyDatabase(db))?.reviewers).toEqual([]);
  expect((await readStudyDatabase(db))?.attempts).toEqual([]);
});
test("an aborted transaction cannot partially replace the library", async () => {
  const saved = await migrateStudyDatabase(db, library());
  const original = db.transaction.bind(db);
  const spy = jest.spyOn(db, "transaction").mockImplementation(((
    ...args: Parameters<IDBDatabase["transaction"]>
  ) => {
    const tx = original(...args);
    queueMicrotask(() => tx.abort());
    return tx;
  }) as IDBDatabase["transaction"]);
  await expect(
    writeStudyDatabase(db, { ...saved, reviewers: [] }),
  ).rejects.toThrow();
  spy.mockRestore();
  expect(await readStudyDatabase(db)).toEqual(saved);
});

test("recovery export includes the raw library and unfinished draft", async () => {
  await migrateStudyDatabase(db, library());
  await writeQuizDraft(db, { id: "paused" });
  const recovery = await exportStudyRecovery(db);
  expect(recovery.drafts).toEqual([{ id: "paused" }]);
  expect(recovery.cards).toHaveLength(2);
  expect(recovery.metadata).toHaveLength(1);
});

test("new completion and mastery transition evidence survives IndexedDB and JSON export", async () => {
  const data = library();
  data.studyCompletions = [
    {
      id: "session",
      date: "2026-09-24T12:00:00Z",
      kind: "quiz",
      offline: true,
      voice: true,
      dueCount: 2,
      reviewedDueCount: 2,
    },
  ];
  data.earnedBadges = ["badge-1", "offline-scholar", "voice-learner"];
  data.schedules = [
    {
      reviewerId: "reviewer-1",
      cardId: "card-1",
      lastReviewedAt: "2026-09-24T12:00:00Z",
      nextReviewAt: "2026-09-30T12:00:00Z",
      repetitions: 3,
      lapses: 1,
      intervalDays: 6,
      recent: [false, true, true, true],
      source: "quiz",
      needsReviewAt: "2026-09-20T12:00:00Z",
      recoveredAt: "2026-09-24T12:00:00Z",
    },
  ];
  await writeStudyDatabase(db, data);
  const saved = await readStudyDatabase(db);
  expect(saved?.studyCompletions).toEqual(data.studyCompletions);
  expect(saved?.schedules).toEqual(data.schedules);
  expect(JSON.parse(JSON.stringify(saved)).earnedBadges).toEqual(
    data.earnedBadges,
  );
});
