import test from "node:test";
import assert from "node:assert/strict";
import { emptyData, validateData } from "../src/services/storage.ts";
import {
  dayKey,
  percentage,
  streak,
  weekActivity,
  prepareCards,
  normalizeAnswer,
} from "../src/utils/stats.ts";

const attempt = (date, correct = 2, total = 3) => ({
  id: crypto.randomUUID(),
  reviewerId: "",
  title: "Daily review",
  date: date.toISOString(),
  correct,
  total,
  mode: "daily",
});
test("empty library survives a JSON round trip", () => {
  const data = emptyData();
  assert.deepEqual(validateData(JSON.parse(JSON.stringify(data))), data);
});
test("backup validation rejects malformed scores, references and settings", () => {
  const data = emptyData();
  assert.throws(() =>
    validateData({ ...data, attempts: [attempt(new Date(), 4, 3)] }),
  );
  assert.throws(() =>
    validateData({ ...data, settings: { ...data.settings, quizSize: 0 } }),
  );
  assert.throws(() =>
    validateData({
      ...data,
      reviewers: [
        {
          id: "r",
          title: "Test",
          description: "",
          topicId: "missing",
          cards: [],
          updatedAt: new Date().toISOString(),
        },
      ],
    }),
  );
  assert.throws(() =>
    validateData({
      ...data,
      topics: [
        { id: "s", name: "Biology", color: "#ffffff" },
        { id: "s", name: "Math", color: "#ffffff" },
      ],
    }),
  );
  assert.throws(() => validateData({ version: 2 }));
});
test("accuracy weights questions, not quiz percentages", () => {
  assert.equal(percentage([]), 0);
  assert.equal(
    percentage([attempt(new Date(), 1, 1), attempt(new Date(), 0, 9)]),
    10,
  );
});
test("streak uses consecutive local dates and permits yesterday", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const prior = new Date();
  prior.setDate(prior.getDate() - 2);
  assert.equal(streak([]), 0);
  assert.equal(streak([attempt(yesterday), attempt(prior)]), 2);
  assert.equal(
    streak([attempt(new Date()), attempt(yesterday), attempt(prior)]),
    3,
  );
  assert.equal(streak([attempt(prior)]), 0);
});
test("weekly activity sums answered questions on the right local day", () => {
  const today = new Date();
  const week = weekActivity([attempt(today, 1, 3), attempt(today, 1, 2)]);
  assert.equal(week.length, 7);
  assert.equal(week[6].total, 5);
  assert.match(dayKey(today), /^\d{4}-\d{2}-\d{2}$/);
});
test("question preparation preserves the source and respects quiz size", () => {
  const cards = Array.from({ length: 20 }, (_, i) => ({
    id: String(i),
    question: "Q" + i,
    answer: "A" + i,
  }));
  const original = JSON.stringify(cards);
  assert.deepEqual(prepareCards(cards, false, 2), cards.slice(0, 2));
  assert.equal(
    new Set(prepareCards(cards, true, 100).map((c) => c.id)).size,
    20,
  );
  assert.equal(JSON.stringify(cards), original);
  assert.equal(normalizeAnswer("  Cell   WALL  "), "cell wall");
});

test("old backups default to system theme and invalid theme values are rejected", () => {
  const data = emptyData();
  delete data.settings.theme;
  assert.equal(validateData(data).settings.theme, "system");
  assert.throws(() =>
    validateData({ ...data, settings: { ...data.settings, theme: "rainbow" } }),
  );
});

test("version-1 subjects migrate to topics without losing reviewer associations or results", () => {
  const old = {
    ...emptyData(),
    version: 1,
    subjects: [{ id: "biology", name: "Biology", color: "#8d80b5" }],
    reviewers: [
      {
        id: "r",
        title: "Cells",
        description: "Notes",
        subjectId: "biology",
        cards: [{ id: "c", question: "Q", answer: "A" }],
        updatedAt: new Date().toISOString(),
      },
    ],
    attempts: [attempt(new Date())],
  };
  delete old.topics;
  const migrated = validateData(JSON.parse(JSON.stringify(old)));
  assert.equal(migrated.version, 2);
  assert.equal(migrated.topics[0].name, "Biology");
  assert.equal(migrated.reviewers[0].topicId, "biology");
  assert.deepEqual(migrated.attempts, old.attempts);
  assert.equal("subjects" in migrated, false);
  assert.equal("subjectId" in migrated.reviewers[0], false);
});
