import type { ReviewerContext } from "../../types/ai";
import type { Reviewer } from "../../types/study";
import { isRecord, validText } from "./schema";

export function buildReviewerContext(reviewer: Reviewer): ReviewerContext {
  const cards: ReviewerContext["cards"] = [];
  let length = 0;
  for (const [index, card] of reviewer.cards.entries()) {
    const next = {
      number: index + 1,
      question: card.question.slice(0, 1000),
      answer: card.answer.slice(0, 2000),
    };
    if (cards.length >= 30 || length + JSON.stringify(next).length > 12000)
      break;
    cards.push(next);
    length += JSON.stringify(next).length;
  }
  return {
    title: reviewer.title.slice(0, 150),
    cards,
    omitted: reviewer.cards.length - cards.length,
  };
}
export function parseReviewerContext(
  value: unknown,
): ReviewerContext | undefined {
  if (value === undefined) return;
  if (
    !isRecord(value) ||
    !validText(value.title, 150) ||
    !Array.isArray(value.cards) ||
    value.cards.length > 30 ||
    !Number.isInteger(value.omitted) ||
    Number(value.omitted) < 0 ||
    JSON.stringify(value).length > 13000
  )
    throw new Error("Invalid reviewer context.");
  return {
    title: value.title,
    omitted: Number(value.omitted),
    cards: value.cards.map((card) => {
      if (
        !isRecord(card) ||
        !Number.isInteger(card.number) ||
        Number(card.number) < 1 ||
        !validText(card.question, 1000) ||
        !validText(card.answer, 2000)
      )
        throw new Error("Invalid reviewer card context.");
      return {
        number: Number(card.number),
        question: card.question,
        answer: card.answer,
      };
    }),
  };
}
