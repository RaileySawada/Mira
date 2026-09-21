import {
  achievements,
  withAchievements,
} from "../features/achievements/achievements";
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

  const pending = useRef<Promise<unknown>>(Promise.resolve());
  function update(
    input: StudyData | ((current: StudyData) => StudyData),
  ): Promise<boolean> {
    const task = pending.current.catch(() => {}).then(() =>
      commit(typeof input === "function" ? input(latest.current) : input),
    );
    pending.current = task;
    return task;
  }
  async function commit(next: StudyData) {
    if (needsRecovery) return false;
    try {
      const saved = withAchievements({ ...next, version: 3 });
      await saveData(saved);
      const previous = new Set([
        ...(latest.current.earnedBadges ?? []),
        ...(next.achievementVersion === 2 ? (next.earnedBadges ?? []) : []),
      ]);
      const newlyEarned = achievements(saved).filter(
        (badge) => badge.earned && !previous.has(badge.id),
      );
      latest.current = saved;
      setData(saved);
      if (newlyEarned.length)
        setRewards((queue) => [
          ...queue,
          ...newlyEarned.filter(
            (badge) => !queue.some((item) => item.id === badge.id),
          ),
        ]);
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
  return {
    data,
    update,
    rewards,
    dismissRewards: () => setRewards([]),
    error,
    needsRecovery,
    allowRecovery: () => setNeedsRecovery(false),
  };
}
