import { PASS_RATIO } from "../../config/learning";
import { studyDates, longestStudyStreak } from "../learning/streak";
import type { StudyData } from "../../types/study";

export function achievements(data: StudyData) {
  const dates = studyDates(data);
  const longest = longestStudyStreak(data);
  const definitions = [
    {
      title: "First Step",
      description: "Completed your first study session",
      detail: "Finish a flashcard session or save a completed quiz.",
      current: dates.length,
      target: 1,
    },
    {
      title: "Study Streak",
      description: "Reviewed 3 days in a row",
      detail:
        "Complete a flashcard session or quiz on three consecutive local-calendar days.",
      current: longest,
      target: 3,
    },
    {
      title: "Quiz Master",
      description: "Passed 10 quizzes",
      detail:
        "Save ten quizzes or daily reviews with a score of at least 80% each.",
      current: data.attempts.filter((a) => a.correct / a.total >= PASS_RATIO)
        .length,
      target: 10,
    },
    {
      title: "Perfect Score",
      description: "Got 100% on a quiz",
      detail: "Save any quiz or daily review with every answer correct.",
      current: data.attempts.filter((a) => a.correct === a.total).length,
      target: 1,
    },
    {
      title: "Bookworm",
      description: "Uploaded your first reviewer",
      detail:
        "Import a JSON backup containing at least one reviewer in Settings. Your data stays on this device.",
      current: Number(Boolean(data.milestones?.importedReviewer)),
      target: 1,
    },
    {
      title: "Night Owl",
      description: "Studied after midnight",
      detail:
        "Complete a flashcard session or quiz between midnight and 5:59 a.m. in your device’s timezone.",
      current: Number(dates.some((date) => new Date(date).getHours() < 6)),
      target: 1,
    },
    {
      title: "Focus Mode",
      description: "Finished a full study timer",
      detail:
        "Complete the 25-minute focus timer below. It pauses when the app is hidden.",
      current: Number(Boolean(data.milestones?.focusCompleted)),
      target: 1,
    },
    {
      title: "Fast Learner",
      description: "Answered quickly and correctly",
      detail:
        "Answer a quiz question correctly within 10 seconds of it appearing, then finish and save that quiz.",
      current: Number(data.attempts.some((a) => a.fastCorrect)),
      target: 1,
    },
    {
      title: "Helper",
      description: "Asked MIRA for guidance",
      detail: "Send Mira a study question and receive a response while online.",
      current: Number(Boolean(data.milestones?.askedMira)),
      target: 1,
    },
    {
      title: "Century Club",
      description: "Answered 100 questions",
      detail:
        "Answer 100 questions across completed, saved quizzes and daily reviews.",
      current: data.attempts.reduce((sum, a) => sum + a.total, 0),
      target: 100,
    },
  ];
  return definitions.map((definition, index) => {
    const id = "badge-" + (index + 1);
    // Old numbered badges described different missions. Re-evaluate from evidence.
    const earned =
      definition.current >= definition.target ||
      (data.achievementVersion === 2 && (data.earnedBadges ?? []).includes(id));
    return {
      ...definition,
      id,
      current: earned
        ? definition.target
        : Math.min(definition.current, definition.target),
      earned,
      image: "/rewards/" + (index + 1) + ".webp",
    };
  });
}
export function withAchievements(data: StudyData): StudyData {
  return {
    ...data,
    achievementVersion: 2,
    earnedBadges: achievements(data)
      .filter((b) => b.earned)
      .map((b) => b.id),
  };
}
