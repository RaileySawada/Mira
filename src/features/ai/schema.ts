import type { StudyData } from "../../types/study";

export interface GeneratedReviewer {
  title: string;
  description: string;
  cards: { question: string; answer: string }[];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validText(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

// Both the server and browser validate generated content before saving it.
export function parseReviewers(value: unknown): GeneratedReviewer[] {
  if (!isRecord(value) || !Array.isArray(value.reviewers) || value.reviewers.length < 1 || value.reviewers.length > 5)
    throw new Error("AI returned an invalid reviewer collection. Please try again.");
  return value.reviewers.map((reviewer: unknown) => {
    if (!isRecord(reviewer) || !validText(reviewer.title, 150) || typeof reviewer.description !== "string" || reviewer.description.length > 2000 || !Array.isArray(reviewer.cards) || reviewer.cards.length !== 5)
      throw new Error("AI returned an incomplete reviewer. Please try again.");
    return {
      title: reviewer.title.trim(), description: reviewer.description.trim(),
      cards: reviewer.cards.map((card: unknown) => {
        if (!isRecord(card) || !validText(card.question, 2000) || !validText(card.answer, 4000))
          throw new Error("AI returned an invalid flashcard. Please try again.");
        return { question: card.question.trim(), answer: card.answer.trim() };
      }),
    };
  });
}

export function addGeneratedReviewers(data: StudyData, topicName: string, drafts: GeneratedReviewer[]): StudyData {
  const existing = data.topics.find(topic => topic.name.toLowerCase() === topicName.trim().toLowerCase());
  const topic = existing || { id: crypto.randomUUID(), name: topicName.trim(), color: "#8d80b5" };
  return {
    ...data,
    topics: existing ? data.topics : [...data.topics, topic],
    reviewers: [...data.reviewers, ...drafts.map(draft => ({
      ...draft, id: crypto.randomUUID(), topicId: topic.id, updatedAt: new Date().toISOString(),
      cards: draft.cards.map(card => ({ ...card, id: crypto.randomUUID() })),
    }))],
  };
}

export interface ChatMessage { role: "user" | "assistant"; content: string; }

export function parseHistory(value: unknown): ChatMessage[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 6) throw new Error("Invalid conversation history.");
  return value.map(message => {
    if (!isRecord(message) || (message.role !== "user" && message.role !== "assistant") || !validText(message.content, 1800))
      throw new Error("Invalid conversation message.");
    return { role: message.role, content: message.content };
  });
}
