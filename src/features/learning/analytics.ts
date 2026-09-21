import { scheduleCard } from "./scheduler";
import type { StudyData } from "../../types/study";
import { cardMastery } from "./mastery";
export function learningAnalytics(data: StudyData, now = new Date()) {
  const schedules = new Map(
    (data.schedules ?? []).map((s) => [
      JSON.stringify([s.reviewerId, s.cardId]),
      s,
    ]),
  );
  // Backups may contain question evidence without cached schedules.
 const recorded = new Set(schedules.keys());
 for (const attempt of [...data.attempts].sort((a,b) => Date.parse(a.date) - Date.parse(b.date))) {
  for (const result of attempt.results ?? []) {
   const reviewerId = result.reviewerId ?? attempt.reviewerId;
   const key = JSON.stringify([reviewerId,result.cardId]);
   if (!reviewerId || recorded.has(key)) continue;
   schedules.set(key,scheduleCard(schedules.get(key),reviewerId,result.cardId,result.correct,"quiz",new Date(attempt.date)));
  }
 }
 const cards = data.reviewers.flatMap((reviewer) =>
    reviewer.cards.map((card) => {
      const schedule = schedules.get(JSON.stringify([reviewer.id, card.id]));
      return {
        card,
        reviewer,
        schedule,
        mastery: cardMastery(schedule, now),
        due: !!schedule && Date.parse(schedule.nextReviewAt) <= now.getTime(),
      };
    }),
  );
  function group(kind: "reviewer" | "topic" | "folder") {
    const groups = new Map<
      string,
      {
        id: string;
        name: string;
        total: number;
        reviewed: number;
        needsReview: number;
        mastered: number;
        accuracy: number;
        answers: number;
        correct: number;
      }
    >();
    for (const item of cards) {
      const id =
        kind === "reviewer"
          ? item.reviewer.id
          : kind === "topic"
            ? item.reviewer.topicId
            : (item.reviewer.folderId ?? "");
      const name =
        kind === "reviewer"
          ? item.reviewer.title
          : kind === "topic"
            ? (data.topics.find((t) => t.id === id)?.name ?? "Uncategorized")
            : (data.folders?.find((f) => f.id === id)?.name ?? "Unfiled");
      const row = groups.get(id) ?? {
        id,
        name,
        total: 0,
        reviewed: 0,
        needsReview: 0,
        mastered: 0,
        accuracy: 0,
        answers: 0,
        correct: 0,
      };
      row.total++;
      row.reviewed += Number(!!item.schedule);
      row.needsReview += Number(item.mastery === "Needs review");
      row.mastered += Number(item.mastery === "Mastered");
      row.answers += item.schedule?.recent.length ?? 0;
      row.correct += item.schedule?.recent.filter(Boolean).length ?? 0;
      row.accuracy = row.answers
        ? Math.round((row.correct / row.answers) * 100)
        : 0;
      groups.set(id, row);
    }
    return [...groups.values()].map((g) => ({
      ...g,
      level:
        g.mastered === g.total
          ? "Mastered"
          : g.needsReview
            ? "Needs review"
            : g.accuracy >= 80 && g.reviewed > 0
              ? "Strong"
              : "Developing",
    }));
  }
  const topics = group("topic");
  return {
    cards,
    due: cards.filter((c) => c.due).length,
    needsReview: cards.filter((c) => c.mastery === "Needs review").length,
    improved: cards.filter(
      (c) => c.schedule?.recent.slice(-3).join() === "false,true,true",
    ).length,
    topics,
    reviewers: group("reviewer"),
    folders: group("folder"),
    weakestTopic: [...topics]
      .filter((t) => t.reviewed)
      .sort((a, b) => a.accuracy - b.accuracy)[0],
  };
}
