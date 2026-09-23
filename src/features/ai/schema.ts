import type { ChatMessage } from "../../types/ai";
import type { GeneratedReviewer } from "../../types/ai";

import { isRecord, validText } from "../../utils/validation";

export function parseReviewers(value: unknown): GeneratedReviewer[] {
  if (
    !isRecord(value) ||
    !Array.isArray(value.reviewers) ||
    value.reviewers.length < 1 ||
    value.reviewers.length > 5
  )
    throw new Error(
      "AI returned an invalid reviewer collection. Please try again.",
    );
  return value.reviewers.map((reviewer: unknown) => {
    if (
      !isRecord(reviewer) ||
      !validText(reviewer.title, 150) ||
      typeof reviewer.description !== "string" ||
      reviewer.description.length > 2000 ||
      !Array.isArray(reviewer.cards) ||
      reviewer.cards.length < 5 ||
      reviewer.cards.length > 10
    )
      throw new Error("AI returned an incomplete reviewer. Please try again.");
    return {
      title: reviewer.title.trim(),
      description: reviewer.description.trim(),
      cards: reviewer.cards.map((card: unknown) => {
        if (
          !isRecord(card) ||
          !validText(card.question, 2000) ||
          !validText(card.answer, 4000)
        )
          throw new Error(
            "AI returned an invalid flashcard. Please try again.",
          );
        return { question: card.question.trim(), answer: card.answer.trim() };
      }),
    };
  });
}

export function parseHistory(value: unknown): ChatMessage[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 6)
    throw new Error("Invalid conversation history.");
  return value.map((message) => {
    if (
      !isRecord(message) ||
      (message.role !== "user" && message.role !== "assistant") ||
      !validText(message.content, 1800)
    )
      throw new Error("Invalid conversation message.");
    return { role: message.role, content: message.content };
  });
}
