import type { Attempt, Card } from "../types/study";
export function dayKey(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function percentage(attempts: Attempt[]): number {
  const total = attempts.reduce((n, a) => n + a.total, 0);
  return total
    ? Math.round((attempts.reduce((n, a) => n + a.correct, 0) / total) * 100)
    : 0;
}
export function streak(attempts: Attempt[]): number {
  const days = new Set(attempts.map((a) => dayKey(a.date)));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(dayKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
export function weekActivity(attempts: Attempt[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    const total = attempts
      .filter((a) => dayKey(a.date) === dayKey(date))
      .reduce((n, a) => n + a.total, 0);
    return {
      label: date.toLocaleDateString("en", { weekday: "short" }),
      total,
    };
  });
}
export function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function normalizeAnswer(answer: string) {
  return answer.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}
export function prepareCards(cards: Card[], shuffle: boolean, size: number) {
  return (shuffle ? shuffled(cards) : [...cards]).slice(0, size);
}
