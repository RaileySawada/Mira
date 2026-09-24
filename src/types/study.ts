export interface Topic {
  id: string;
  name: string;
  color: string;
}
export interface Folder {
  id: string;
  name: string;
}
export interface Card {
  id: string;
  question: string;
  answer: string;
  acceptedAnswers?: string[];
}
export interface Reviewer {
  id: string;
  title: string;
  description: string;
  topicId: string;
  folderId?: string;
  cards: Card[];
  updatedAt: string;
}
export interface QuestionResult {
  cardId: string;
  reviewerId?: string;
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  correct: boolean;
  durationMs: number;
  voice?: boolean;
}
export interface CardSchedule {
  reviewerId: string;
  cardId: string;
  lastReviewedAt: string;
  nextReviewAt: string;
  repetitions: number;
  lapses: number;
  intervalDays: number;
  recent: boolean[];
  source: "quiz" | "flashcard";
  needsReviewAt?: string;
  recoveredAt?: string;
}
export interface Attempt {
  id: string;
  reviewerId: string;
  title: string;
  date: string;
  correct: number;
  total: number;
  mode: "quiz" | "daily";
  difficulty?: "normal" | "hard";
  fastCorrect?: boolean;
  results?: QuestionResult[];
}
export type Theme = "light" | "dark" | "system";
export interface Settings {
  theme: Theme;
  name: string;
  dailyGoal: number;
  quizSize: number; // Legacy quiz preference retained for older backups.
  dailyQuizSize?: number;
  autoDaily: boolean;
  shuffle: boolean;
}
export interface StudyCompletion {
  id: string;
  date: string;
  kind: "cards" | "quiz" | "daily";
  offline: boolean;
  voice: boolean;
  dueCount: number;
  reviewedDueCount: number;
}
export interface StudyData {
  studyCompletions?: StudyCompletion[];
  version: 2 | 3;
  schedules?: CardSchedule[];
  lastStudy?: { reviewerId: string; startedAt: string };
  earnedBadges?: string[];
  achievementVersion?: 2;
  milestones?: {
    studyDates?: string[];
    dueReviewDates?: string[];
    importedReviewer?: boolean;
    focusCompleted?: boolean;
    askedMira?: boolean;
  };
  topics: Topic[];
  folders?: Folder[];
  reviewers: Reviewer[];
  attempts: Attempt[];
  settings: Settings;
}
export type Page =
  | "Mira"
  | "Home"
  | "Reviewers"
  | "Topics"
  | "Folders"
  | "Docs"
  | "Quizzes"
  | "Achievements"
  | "Activity"
  | "Settings"
  | "Guide"
  | "Terms"
  | "Privacy"
  | "Contribute"
  | "About"
  | "Not found";
