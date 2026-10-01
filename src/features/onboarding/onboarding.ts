import { ONBOARDING_KEY } from "../../config/storage";
import type { StudyData, Settings } from "../../types/study";

export type SetupSettings = Pick<Settings, "name" | "theme" | "dailyGoal">;
export type StartChoice = "explore" | "create" | "import";

export function needsIntroduction(data: StudyData): boolean {
  if (
    data.reviewers.length ||
    data.topics.length ||
    data.folders?.length ||
    data.attempts.length ||
    data.settings.name ||
    data.lastStudy ||
    data.earnedBadges?.length ||
    data.milestones?.studyDates?.length
  )
    return false;
  try {
    return localStorage.getItem(ONBOARDING_KEY) !== "done";
  } catch {
    return true;
  }
}

export function completeIntroduction() {
  try {
    localStorage.setItem(ONBOARDING_KEY, "done");
  } catch {
    throw new Error(
      "Could not remember your setup. Allow browser storage and try again.",
    );
  }
}
