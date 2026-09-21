import type { MiraMood } from "../../types/learning";
import type { StudyData } from "../../types/study";
import { dayKey, percentage } from "../../utils/stats";
import { learningAnalytics } from "./analytics";
import { studyDates, studyStreak } from "./streak";

export function miraMood(
  data: StudyData,
  now = new Date(),
  newlyEarned = 0,
): { mood: MiraMood; message: string } {
  const recent = [...data.attempts]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 6);
  const latest = recent[0];
  const score = latest ? (latest.correct / latest.total) * 100 : undefined;
  const fresh = latest && now.getTime() - Date.parse(latest.date) < 86400000;
  const average = percentage(recent.slice(0, 3));
  const previous = percentage(recent.slice(3));
  const dates = studyDates(data);
  const last = dates.reduce((latest, date) => Math.max(latest, Date.parse(date)), 0);
  const analytics = learningAnalytics(data, now);
  const today = data.attempts
    .filter((a) => dayKey(a.date) === dayKey(now))
    .reduce((n, a) => n + a.total, 0);
  if (newlyEarned || (fresh && score === 100))
    return {
      mood: "amazed",
      message:
        "Your practice is paying off. Take a moment to celebrate this step!",
    };
  if (dates.length && now.getTime() - last > 7 * 86400000)
    return {
      mood: "sad",
      message:
        "Welcome back. There is no catching up to do—one gentle step is enough.",
    };
  if (fresh && score !== undefined && score < 40)
    return {
      mood: "sad",
      message:
        "That was a tough round. It is practice, not a verdict. We can revisit it together.",
    };
  if (
    (recent.length >= 4 && average + 15 < previous) ||
    analytics.needsReview > 0 ||
    (fresh && average < 70)
  )
    return {
      mood: "thinking",
      message: analytics.needsReview
        ? analytics.needsReview +
          " cards could use another look. Let’s take them one at a time."
        : "Let’s slow down and connect the tricky parts together.",
    };
  if (
    today >= data.settings.dailyGoal ||
    studyStreak(data, now) >= 3 ||
    (recent.length >= 4 && average >= previous + 10) ||
    (fresh && average >= 80)
  )
    return {
      mood: "happy",
      message: "Your steady effort is building confidence. Keep your own pace.",
    };
  return {
    mood: "normal",
    message:
      "A little curiosity is enough. What would you like to explore today?",
  };
}
