import type { StudyData } from "../../types/study";
import { dayKey } from "../../utils/stats";
export function studyDates(data: StudyData): string[] {
  return [
    ...data.attempts.map((a) => a.date),
    ...(data.milestones?.studyDates ?? []),
  ];
}
export function studyStreak(data: StudyData, now = new Date()): number {
  const days = new Set(studyDates(data).map(dayKey));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(dayKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
export function longestStudyStreak(data: StudyData): number {
  const days = [...new Set(studyDates(data).map(dayKey))].sort();
  let longest = 0,
    run = 0;
  days.forEach((day, index) => {
    const prior = new Date(day + "T12:00:00");
    prior.setDate(prior.getDate() - 1);
    run = index > 0 && days[index - 1] === dayKey(prior) ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  return longest;
}
