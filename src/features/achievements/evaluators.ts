import type { StudyData } from "../../types/study";
import { cardMastery } from "../learning/mastery";
import { cardKey } from "../learning/sessionEvidence";
import { dayKey } from "../../utils/stats";

export function adaptiveProgress(data: StudyData, now = new Date()) {
  const schedules = new Map(
    (data.schedules ?? []).map(s => [cardKey(s.reviewerId, s.cardId), s]),
  );
  const mastered = new Set(data.reviewers.flatMap(reviewer => reviewer.cards
    .filter(card => cardMastery(schedules.get(cardKey(reviewer.id, card.id)), now) === "Mastered")
    .map(card => cardKey(reviewer.id, card.id)),
  ));
  const topics = data.topics.filter(topic => {
    const cards = data.reviewers
      .filter(reviewer => reviewer.topicId === topic.id)
      .flatMap(reviewer => reviewer.cards.map(card => cardKey(reviewer.id, card.id)));
    return cards.length >= 10 && cards.every(key => mastered.has(key));
  }).length;
  const events = data.studyCompletions ?? [];
  const wrong = new Map<string, number>();
  const recovered = new Set<string>();
  const lowest = new Map<string, { date: number; previous: number; current: number }>();
  let improvement = 0;
  const chronological = [...data.attempts].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  for (const attempt of chronological) {
    const date = Date.parse(attempt.date);
    if (attempt.mode === "quiz" && attempt.reviewerId && attempt.total > 0) {
      const score = attempt.correct / attempt.total * 100;
      const earlier = lowest.get(attempt.reviewerId);
      // Equal timestamps cannot establish an earlier/later improvement.
      const previous = !earlier ? Infinity : earlier.date < date
        ? Math.min(earlier.previous, earlier.current)
        : earlier.previous;
      // Remove floating-point noise at exact percentage-point boundaries.
      improvement = Math.max(improvement, Math.round((score - previous) * 1e9) / 1e9);
      lowest.set(attempt.reviewerId, {
        date,
        previous,
        current: earlier?.date === date ? Math.min(earlier.current, score) : score,
      });
    }
    for (const result of attempt.results ?? []) {
      const reviewerId = result.reviewerId ?? attempt.reviewerId;
      if (!reviewerId) continue;
      const key = cardKey(reviewerId, result.cardId);
      if (result.correct && (wrong.get(key) ?? Infinity) < date) recovered.add(key);
      if (!result.correct && !wrong.has(key)) wrong.set(key, date);
    }
  }
  return {
    mastered: mastered.size,
    comeback: [...schedules.values()].filter(s =>
      s.needsReviewAt && s.recoveredAt &&
      Date.parse(s.recoveredAt) >= Date.parse(s.needsReviewAt),
    ).length,
    clearedDue: events.filter(e => e.dueCount > 0 && e.reviewedDueCount === e.dueCount).length,
    dueDays: new Set([
      ...(data.milestones?.dueReviewDates ?? []),
      ...events.filter(e => e.reviewedDueCount > 0).map(e => dayKey(e.date)),
    ]).size,
    topics,
    improvement,
    recovered: recovered.size,
    voice: events.filter(e => e.voice).length,
    offline: events.filter(e => e.offline).length,
  };
}
