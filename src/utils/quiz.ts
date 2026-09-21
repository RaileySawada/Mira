import type { Settings } from "../types/study";

export function dailyQuizSize(settings: Settings): number {
  return settings.dailyQuizSize ?? Math.min(100, settings.quizSize + 5);
}
