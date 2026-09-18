import { achievements, withAchievements } from "../features/achievements/achievements";
import { useRef, useState } from "react";
import { readData, saveData } from "../services/storage";
import type { StudyData } from "../types/study";

export function useStudyData() {
  const [initial] = useState(readData);
  const [data, setData] = useState(() => withAchievements(initial.data));
  const latest = useRef(data);
  const [rewards, setRewards] = useState<ReturnType<typeof achievements>>([]);
  const [error, setError] = useState(initial.error);
  const [needsRecovery, setNeedsRecovery] = useState(Boolean(initial.error));

  function update(next: StudyData) {
    if (needsRecovery) return false;
    try {
      const saved = withAchievements(next);
      saveData(saved);
      const previous = new Set([...(latest.current.earnedBadges ?? []), ...(next.achievementVersion === 2 ? next.earnedBadges ?? [] : [])]);
      const newlyEarned = achievements(saved).filter(badge => badge.earned && !previous.has(badge.id));
      latest.current = saved;
      setData(saved);
      if (newlyEarned.length) setRewards(queue => [...queue, ...newlyEarned.filter(badge => !queue.some(item => item.id === badge.id))]);
      setError("");
      setNeedsRecovery(false);
      return true;
    } catch {
      const message =
        "Your changes could not be saved. Storage may be full or unavailable. Export a backup and free some space, then try again.";
      setError(message);
      return false;
    }
  }
  return { data, update, rewards, dismissRewards: () => setRewards([]), error, needsRecovery, allowRecovery: () => setNeedsRecovery(false) };
}
