import type { Card, QuestionResult } from "./study";

export interface QuizDraft {
  id: string;
  title: string;
  reviewerId: string;
  mode: "quiz" | "daily";
  cards: (Card & { reviewerId?: string })[];
  answerPool?: Card[];
  difficulty: "normal" | "hard";
  index: number;
  answers: (QuestionResult & { answer: string })[];
  answer: string;
  checked: boolean;
  startedAt: string;
  elapsedMs: number;
}

export interface Session {
  title: string;
  reviewerId: string;
  mode: "cards" | "quiz" | "daily";
  cards: Card[];
  answerPool?: Card[];
  resume?: QuizDraft;
}
