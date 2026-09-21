import type { STUDY_OVERVIEW_KEYS } from "../config/ai";

export type StudyOverview = Record<(typeof STUDY_OVERVIEW_KEYS)[number], string>;
export type AiMode = "chat" | "generate";

export interface GeneratedReviewer {
  title: string;
  description: string;
  cards: { question: string; answer: string }[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ReviewerContext {
  title: string;
  cards: { number: number; question: string; answer: string }[];
  omitted: number;
}

export interface AiRequest {
  mode: AiMode;
  prompt: string;
  topic: string;
  count: number;
  cardsPerReviewer?: number;
  history?: ChatMessage[];
  overview?: StudyOverview;
  reviewerContext?: ReviewerContext;
  abuseToken?: string;
}
