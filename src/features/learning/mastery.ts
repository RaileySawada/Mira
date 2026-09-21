import type { Mastery } from "../../types/learning";
import type { CardSchedule } from "../../types/study";

export function cardMastery(
  schedule?: CardSchedule,
  now = new Date(),
): Mastery {
  if (!schedule || !schedule.recent.length) return "New";
  if (
    !schedule.recent.at(-1) ||
    new Date(schedule.nextReviewAt).getTime() <= now.getTime()
  )
    return "Needs review";
  if (schedule.repetitions >= 3 && schedule.recent.slice(-3).every(Boolean))
    return "Mastered";
  return "Learning";
}
