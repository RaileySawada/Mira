import type { Card, QuestionResult } from "./study";

export interface CardReference {
  reviewerId: string;
  cardId: string;
}
export interface PracticeResult {
  cardId: string;
  correct: boolean;
}

export interface QuizDraft {
  dueAtStart?: CardReference[];
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
  answerWasVoice?: boolean;
  checked: boolean;
  startedAt: string;
  elapsedMs: number;
}

export interface Session {
  dueAtStart?: CardReference[];
  title: string;
  reviewerId: string;
  mode: "cards" | "quiz" | "daily";
  cards: Card[];
  answerPool?: Card[];
  resume?: QuizDraft;
}
