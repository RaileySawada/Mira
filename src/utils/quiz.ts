import type { Settings } from "../types/study";
// Older libraries get five extra daily questions; explicit daily preferences win.
export function dailyQuizSize(settings: Settings): number {
  return settings.dailyQuizSize ?? Math.min(100, settings.quizSize + 5);
}
