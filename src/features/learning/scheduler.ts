import { dayKey } from "../../utils/stats";
import { cardMastery } from "./mastery";
import { DAY_MS } from "../../config/time";
import type { Attempt, CardSchedule, StudyData } from "../../types/study";

export function scheduleCard(
  previous: CardSchedule | undefined,
  reviewerId: string,
  cardId: string,
  correct: boolean,
  source: CardSchedule["source"],
  now = new Date(),
): CardSchedule {
  const repetitions = correct ? (previous?.repetitions ?? 0) + 1 : 0;
  const intervalDays = !correct
    ? 10 / 1440
    : repetitions === 1
      ? 1
      : repetitions === 2
        ? 3
        : Math.min(180, Math.max(3, previous?.intervalDays ?? 3) * 2);
  const next: CardSchedule = {
    reviewerId,
    cardId,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: new Date(now.getTime() + intervalDays * DAY_MS).toISOString(),
    repetitions,
    lapses: (previous?.lapses ?? 0) + Number(!correct),
    intervalDays,
    recent: [...(previous?.recent ?? []), correct].slice(-10),
    source,
    ...(previous?.needsReviewAt
      ? { needsReviewAt: previous.needsReviewAt }
      : {}),
    ...(previous?.recoveredAt ? { recoveredAt: previous.recoveredAt } : {}),
  };
  if (
    cardMastery(previous, now) === "Needs review" ||
    cardMastery(next, now) === "Needs review"
  )
    next.needsReviewAt ??= now.toISOString();
  if (next.needsReviewAt && cardMastery(next, now) === "Mastered")
    next.recoveredAt ??= now.toISOString();
  return next;
}
export function recordRating(
  data: StudyData,
  reviewerId: string,
  cardId: string,
  correct: boolean,
  source: CardSchedule["source"],
  now = new Date(),
): StudyData {
  const schedules = data.schedules ?? [];
  const previous = schedules.find(
    (s) => s.reviewerId === reviewerId && s.cardId === cardId,
  );
  return {
    ...data,
    version: 3,
    ...(correct &&
    previous &&
    new Date(previous.nextReviewAt).getTime() <= now.getTime()
      ? {
          milestones: {
            ...data.milestones,
            dueReviewDates: [
              ...new Set([
                ...(data.milestones?.dueReviewDates ?? []),
                dayKey(now),
              ]),
            ],
          },
        }
      : {}),
    schedules: [
      ...schedules.filter((s) => s !== previous),
      scheduleCard(previous, reviewerId, cardId, correct, source, now),
    ],
  };
}
export function recordAttempt(data: StudyData, attempt: Attempt): StudyData {
  if (data.attempts.some((a) => a.id === attempt.id)) return data;
  let next = data;
  for (const result of attempt.results ?? []) {
    const reviewerId = result.reviewerId ?? attempt.reviewerId;
    if (reviewerId)
      next = recordRating(
        next,
        reviewerId,
        result.cardId,
        result.correct,
        "quiz",
        new Date(attempt.date),
      );
  }
  return { ...next, attempts: [...next.attempts, attempt] };
}
