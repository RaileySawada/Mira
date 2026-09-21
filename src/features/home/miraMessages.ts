import type { MiraMessage } from "../../types/learning";
import { messageVariant } from "./messageVariants";
import type { StudyData } from "../../types/study";
import { achievements } from "../achievements/achievements";
import { dayKey } from "../../utils/stats";
import { miraMood } from "../learning/mood";

export function homeMessages(
  data: StudyData,
  now = new Date(),
  variant = 0,
  newlyEarned = 0,
): MiraMessage[] {
  const hour = now.getHours();
  const salutation =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = data.settings.name.trim();
  const sequence: MiraMessage[] = [
    {
      mood: "happy",
      text: messageVariant("greeting", variant, {
        greeting: salutation + (name ? ", " + name : ""),
      }),
    },
  ];
  const cards = data.reviewers.reduce(
    (sum, reviewer) => sum + reviewer.cards.length,
    0,
  );
  if (!data.reviewers.length) {
    sequence.push({ mood: "normal", text: messageVariant("empty", variant) });
  } else {
    sequence.push({
      mood: "normal",
      text: messageVariant("library", variant, {
        library:
          data.reviewers.length +
          " reviewer" +
          (data.reviewers.length === 1 ? "" : "s") +
          " and " +
          cards +
          " flashcard" +
          (cards === 1 ? "" : "s"),
      }),
    });
    const current = data.reviewers.find(
      (reviewer) => reviewer.id === data.lastStudy?.reviewerId,
    );
    const folder = data.folders?.find((item) => item.id === current?.folderId);
    if (current)
      sequence.push({
        mood: "thinking",
        text: messageVariant("resume", variant, {
          reviewer:
            "“" +
            current.title +
            "”" +
            (folder ? " in “" + folder.name + "”" : ""),
        }),
      });
    else
      sequence.push({
        mood: "thinking",
        text: messageVariant("organize", variant, {
          organization:
            data.topics.length +
            " topic" +
            (data.topics.length === 1 ? "" : "s") +
            " and " +
            (data.folders?.length ?? 0) +
            " folder" +
            (data.folders?.length === 1 ? "" : "s"),
        }),
      });
  }
  const today = dayKey(now);
  const practice = (data.milestones?.studyDates ?? []).filter(
    (date) => dayKey(date) === today,
  ).length;
  const quizzes = data.attempts.filter(
    (attempt) => dayKey(attempt.date) === today,
  );
  if (practice || quizzes.length)
    sequence.push({
      mood: "happy",
      text: messageVariant("activity", variant, {
        sessions:
          practice +
          quizzes.length +
          " study session" +
          (practice + quizzes.length === 1 ? "" : "s"),
      }),
    });
  const earned = achievements(data).filter((badge) => badge.earned).length;
  if (earned)
    sequence.push({
      mood: "amazed",
      text: messageVariant("badges", variant, {
        badges: earned + " badge" + (earned === 1 ? "" : "s"),
      }),
    });
  sequence.push({ mood: "normal", text: messageVariant("closing", variant) });
  const state = miraMood(data, now, newlyEarned);
  sequence.splice(1, 0, { mood: state.mood, text: state.message });
  return sequence.map((message) => ({ ...message, mood: state.mood }));
}
