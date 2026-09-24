import type {
  CardReference,
  PracticeResult,
  Session,
} from "../../types/session";
import type { StudyData } from "../../types/study";

export function cardKey(reviewerId: string, cardId: string): string {
  return JSON.stringify([reviewerId, cardId]);
}

export function captureDueCards(
  data: StudyData,
  reviewerId?: string,
  now = new Date(),
): CardReference[] {
  const existing = new Set(
    data.reviewers.flatMap((r) => r.cards.map((c) => cardKey(r.id, c.id))),
  );
  return (data.schedules ?? [])
    .filter(
      (s) =>
        (!reviewerId || s.reviewerId === reviewerId) &&
        existing.has(cardKey(s.reviewerId, s.cardId)) &&
        new Date(s.nextReviewAt).getTime() <= now.getTime(),
    )
    .map(({ reviewerId, cardId }) => ({ reviewerId, cardId }));
}

export function recordStudyCompletion(
  data: StudyData,
  session: Session,
  id: string,
  results: (PracticeResult & { reviewerId?: string; voice?: boolean })[],
  offline: boolean,
  now = new Date(),
): StudyData {
  if (
    !session.cards.length ||
    data.studyCompletions?.some((event) => event.id === id)
  )
    return data;
  const resultMap = new Map(
    results.map((r) => [
      cardKey(r.reviewerId ?? session.reviewerId, r.cardId),
      r,
    ]),
  );
  const cards = session.cards as ((typeof session.cards)[number] & {
    reviewerId?: string;
  })[];
  if (
    !cards.every((c) =>
      resultMap.has(cardKey(c.reviewerId ?? session.reviewerId, c.id)),
    )
  )
    return data;
  const due = new Set(
    (session.dueAtStart ?? []).map((c) => cardKey(c.reviewerId, c.cardId)),
  );
  const reviewedDueCount = [...due].filter(
    (key) => resultMap.get(key)?.correct,
  ).length;
  const event = {
    id,
    date: now.toISOString(),
    kind: session.mode,
    offline,
    voice:
      session.mode !== "cards" &&
      cards.every(
        (c) =>
          resultMap.get(cardKey(c.reviewerId ?? session.reviewerId, c.id))
            ?.voice === true,
      ),
    dueCount: due.size,
    reviewedDueCount,
  };
  return {
    ...data,
    studyCompletions: [...(data.studyCompletions ?? []), event],
  };
}
