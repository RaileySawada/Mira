import { addGeneratedReviewers, isRecord, parseReviewers, validText } from "../src/features/ai/schema";
import { validateData } from "../src/services/storage";
import { library } from "./fixtures";
import { generated } from "./ai-fixtures";

test("AI text and object guards reject invalid data", () => {
  for (const value of [null, undefined, [], true, "hello"]) expect(isRecord(value)).toBe(false);
  expect(isRecord({})).toBe(true);
  for (const value of [null, 2, "", "  ", "long text"]) expect(validText(value, 3)).toBe(false);
  expect(validText("yes", 3)).toBe(true);
});

test.each([null, [], {}, { reviewers: {} }, { reviewers: [] }, { reviewers: Array(6).fill(generated()) }])("rejects invalid collections %p", value => {
  expect(() => parseReviewers(value)).toThrow("collection");
});

test.each([null, {}, { ...generated(), title: "" }, { ...generated(), description: null }, { ...generated(), description: "a".repeat(2001) }, { ...generated(), cards: null }, { ...generated(), cards: [] }])("rejects incomplete reviewers %p", value => {
  expect(() => parseReviewers({ reviewers: [value] })).toThrow("incomplete");
});

test.each([null, {}, { question: "", answer: "ok" }, { question: "ok", answer: "" }])("rejects invalid cards %p", value => {
  const draft = generated();
  expect(() => parseReviewers({ reviewers: [{ ...draft, cards: [value, ...draft.cards.slice(1)] }] })).toThrow("flashcard");
});

test("validates, trims, and saves batches without losing existing data", () => {
  const data = library();
  const drafts = parseReviewers({ reviewers: [{ ...generated(" Cells "), description: " Biology ", cards: generated().cards.map(card => ({ question: " " + card.question, answer: card.answer + " " })) }, generated("DNA")] });
  expect(drafts[0].title).toBe("Cells");
  expect(drafts[0].cards[0].answer).toBe("Answer 0");
  const next = addGeneratedReviewers(data, " biology ", drafts);
  expect(next.topics).toBe(data.topics);
  expect(next.reviewers).toHaveLength(3);
  expect(next.reviewers[1].topicId).toBe("topic-1");
  expect(validateData(next)).toEqual(next);
  expect(new Set(next.reviewers.flatMap(r => r.cards.map(c => c.id))).size).toBe(12);
  const other = addGeneratedReviewers(data, " Chemistry ", drafts);
  expect(other.topics).toHaveLength(2);
  expect(other.topics[1].name).toBe("Chemistry");
  expect(data.reviewers).toHaveLength(1);
  expect(validateData(other)).toEqual(other);
});
