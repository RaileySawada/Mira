export interface Topic {
  id: string;
  name: string;
  color: string;
}
export interface Folder { id: string; name: string; }
export interface Card {
  id: string;
  question: string;
  answer: string;
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
export interface StudyData {
  version: 2;
  lastStudy?: { reviewerId: string; startedAt: string };
  earnedBadges?: string[];
  achievementVersion?: 2;
  milestones?: { studyDates?: string[]; importedReviewer?: boolean; focusCompleted?: boolean; askedMira?: boolean };
  topics: Topic[];
  folders?: Folder[];
  reviewers: Reviewer[];
  attempts: Attempt[];
  settings: Settings;
}
export type Page =
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
