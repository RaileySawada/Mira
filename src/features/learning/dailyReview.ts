import type { StudyCard } from "../../types/learning";
import type { StudyData } from "../../types/study";
import { learningAnalytics } from "./analytics";
import { shuffled } from "../../utils/stats";

export function selectDailyCards(
  data: StudyData,
  size: number,
  now = new Date(),
): StudyCard[] {
  const ranked = learningAnalytics(data, now)
    .cards.map((item) => {
      const s = item.schedule;
      const misses = s?.recent.filter((value) => !value).length ?? 0;
      const age = s ? now.getTime() - Date.parse(s.lastReviewedAt) : Infinity;
      const priority = item.due
        ? 0
        : item.mastery === "Needs review" && age > 600000
          ? 1
          : misses >= 2 && age >= 86400000
            ? 2
            : s && age >= 7 * 86400000 && item.mastery !== "Mastered"
              ? 3
              : !s
                ? 4
                : item.mastery === "Mastered"
                  ? 6
                  : 5;
      return { ...item, priority };
    })
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        (a.priority === 0
          ? Date.parse(a.schedule!.nextReviewAt) -
            Date.parse(b.schedule!.nextReviewAt)
          : Date.parse(a.schedule?.lastReviewedAt ?? "1970-01-01") -
            Date.parse(b.schedule?.lastReviewedAt ?? "1970-01-01")) ||
        a.card.id.localeCompare(b.card.id),
    );
  const selected = ranked
    .slice(0, Math.max(0, size))
    .map((item) => ({ ...item.card, reviewerId: item.reviewer.id }));
  return data.settings.shuffle ? shuffled(selected) : selected;
}
