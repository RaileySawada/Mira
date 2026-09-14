export interface Topic {
  id: string;
  name: string;
  color: string;
}
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
}
export type Theme = "light" | "dark" | "system";
export interface Settings {
  theme: Theme;
  name: string;
  dailyGoal: number;
  quizSize: number;
  autoDaily: boolean;
  shuffle: boolean;
}
export interface StudyData {
  version: 2;
  topics: Topic[];
  reviewers: Reviewer[];
  attempts: Attempt[];
  settings: Settings;
}
export type Page =
  | "Home"
  | "Reviewers"
  | "Topics"
  | "Quizzes"
  | "Activity"
  | "Settings"
  | "Guide"
  | "Terms"
  | "Privacy"
  | "Contribute"
  | "About"
  | "Not found";
