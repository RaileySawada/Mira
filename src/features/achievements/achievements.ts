import type { AchievementDefinition } from "./types";
import { adaptiveProgress } from "./evaluators";
import { PASS_RATIO } from "../../config/learning";
import { studyDates, longestStudyStreak } from "../learning/streak";
import type { StudyData } from "../../types/study";

export function achievements(
  data: StudyData,
  now = new Date(),
): AchievementDefinition[] {
  const progress = adaptiveProgress(data, now);
  const dates = studyDates(data);
  const longest = longestStudyStreak(data);
  const definitions: Omit<AchievementDefinition, "earned">[] = [
    {
      id: "badge-1",
      image: "/rewards/1.webp",
      category: "milestone",
      title: "First Step",
      description: "Completed your first study session",
      detail: "Finish a flashcard session or save a completed quiz.",
      current: dates.length,
      target: 1,
    },
    {
      id: "badge-2",
      image: "/rewards/2.webp",
      category: "milestone",
      title: "Study Streak",
      description: "Reviewed 3 days in a row",
      detail:
        "Complete a flashcard session or quiz on three consecutive local-calendar days.",
      current: longest,
      target: 3,
    },
    {
      id: "badge-3",
      image: "/rewards/3.webp",
      category: "challenge",
      title: "Quiz Master",
      description: "Passed 10 quizzes",
      detail:
        "Save ten quizzes or daily reviews with a score of at least 80% each.",
      current: data.attempts.filter((a) => a.correct / a.total >= PASS_RATIO)
        .length,
      target: 10,
    },
    {
      id: "badge-4",
      image: "/rewards/4.webp",
      category: "challenge",
      title: "Perfect Score",
      description: "Got 100% on a quiz",
      detail: "Save any quiz or daily review with every answer correct.",
      current: data.attempts.filter((a) => a.correct === a.total).length,
      target: 1,
    },
    {
      id: "badge-5",
      image: "/rewards/5.webp",
      category: "milestone",
      title: "Bookworm",
      description: "Uploaded your first reviewer",
      detail:
        "Import a JSON backup containing at least one reviewer in Settings. Your data stays on this device.",
      current: Number(Boolean(data.milestones?.importedReviewer)),
      target: 1,
    },
    {
      id: "badge-6",
      image: "/rewards/6.webp",
      category: "challenge",
      title: "Night Owl",
      description: "Studied after midnight",
      detail:
        "Complete a flashcard session or quiz between midnight and 5:59 a.m. in your device’s timezone.",
      current: Number(dates.some((date) => new Date(date).getHours() < 6)),
      target: 1,
    },
    {
      id: "badge-7",
      image: "/rewards/7.webp",
      category: "milestone",
      title: "Focus Mode",
      description: "Finished a full study timer",
      detail:
        "Complete the 25-minute focus timer below. It pauses when the app is hidden.",
      current: Number(Boolean(data.milestones?.focusCompleted)),
      target: 1,
    },
    {
      id: "badge-8",
      image: "/rewards/8.webp",
      category: "challenge",
      title: "Fast Learner",
      description: "Answered quickly and correctly",
      detail:
        "Answer a quiz question correctly within 10 seconds of it appearing, then finish and save that quiz.",
      current: Number(data.attempts.some((a) => a.fastCorrect)),
      target: 1,
    },
    {
      id: "badge-9",
      image: "/rewards/9.webp",
      category: "milestone",
      title: "Helper",
      description: "Asked MIRA for guidance",
      detail: "Send Mira a study question and receive a response while online.",
      current: Number(Boolean(data.milestones?.askedMira)),
      target: 1,
    },
    {
      id: "badge-10",
      image: "/rewards/10.webp",
      category: "milestone",
      title: "Century Club",
      description: "Answered 100 questions",
      detail:
        "Answer 100 questions across completed, saved quizzes and daily reviews.",
      current: data.attempts.reduce((sum, a) => sum + a.total, 0),
      target: 100,
    },
    {
      id: "master-first-card",
      image: "/rewards/master-first-card.webp",
      title: "Getting the Hang of It",
      description: "Master your first flashcard.",
      detail: "Reach Mastered using saved card ratings or quiz answers.",
      category: "milestone",
      target: 1,
      current: progress.mastered,
    },
    {
      id: "master-25-cards",
      image: "/rewards/master-25-cards.webp",
      title: "Memory Keeper",
      description: "Master 25 unique cards.",
      detail: "Have 25 different cards in the Mastered state.",
      category: "milestone",
      target: 25,
      current: progress.mastered,
    },
    {
      id: "comeback-kid",
      image: "/rewards/comeback-kid.webp",
      title: "Comeback Kid",
      description: "Bring a Needs review card to Mastered.",
      detail:
        "A saved Needs review state must precede the same card becoming Mastered.",
      category: "challenge",
      target: 1,
      current: progress.comeback,
    },
    {
      id: "clear-due-queue",
      image: "/rewards/clear-due-queue.webp",
      title: "No Card Left Behind",
      description: "Clear the due queue in one session.",
      detail:
        "Correctly review every card due at the start of a completed session. The starting queue must not be empty.",
      category: "challenge",
      target: 1,
      current: progress.clearedDue,
    },
    {
      id: "due-five-days",
      image: "/rewards/due-five-days.webp",
      title: "On Schedule",
      description: "Review due cards on 5 different days.",
      detail: "Save a correct due-card review on five local-calendar days.",
      category: "milestone",
      target: 5,
      current: progress.dueDays,
    },
    {
      id: "topic-tamer",
      image: "/rewards/topic-tamer.webp",
      title: "Topic Tamer",
      description: "Master a topic with at least 10 cards.",
      detail: "Every card in one topic must be Mastered at the same time.",
      category: "challenge",
      target: 1,
      current: progress.topics,
    },
    {
      id: "rising-scholar",
      image: "/rewards/rising-scholar.webp",
      title: "Rising Scholar",
      description: "Improve a reviewer score by 20 points.",
      detail:
        "Finish a later quiz for the same reviewer at least 20 percentage points above an earlier attempt.",
      category: "challenge",
      target: 20,
      current: progress.improvement,
    },
    {
      id: "second-chance",
      image: "/rewards/second-chance.webp",
      title: "Second Chance",
      description: "Recover 5 previously missed cards.",
      detail:
        "Correctly answer five unique cards in a later completed quiz after getting them wrong.",
      category: "challenge",
      target: 5,
      current: progress.recovered,
    },
    {
      id: "voice-learner",
      image: "/rewards/voice-learner.webp",
      title: "Voice Learner",
      description: "Complete your first Voice Study session.",
      detail:
        "Finish and save a Hard quiz with a voice transcript for every answer. Editing transcripts is welcome.",
      category: "milestone",
      target: 1,
      current: progress.voice,
    },
    {
      id: "offline-scholar",
      image: "/rewards/offline-scholar.webp",
      title: "Offline Scholar",
      description: "Complete a study session offline.",
      detail:
        "Rate every flashcard or finish a quiz or daily review while offline at completion.",
      category: "milestone",
      target: 1,
      current: progress.offline,
    },
  ];
  return definitions.map((definition) => {
    const id = definition.id;
    const earned =
      definition.current >= definition.target ||
      (data.earnedBadges ?? []).includes(id);
    return {
      ...definition,
      id,
      current: earned
        ? definition.target
        : Math.min(definition.current, definition.target),
      earned,
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
