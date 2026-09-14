import { useState } from "react";
import { readData, saveData } from "../services/storage";
import type { StudyData } from "../types/study";

export function useStudyData() {
  const [initial] = useState(readData);
  const [data, setData] = useState(initial.data);
  const [error, setError] = useState(initial.error);
  const [needsRecovery, setNeedsRecovery] = useState(Boolean(initial.error));

  function update(next: StudyData) {
    if (
      needsRecovery &&
      !confirm(
        "Your existing data could not be loaded. Saving will replace it. Export existing storage first if you need to recover it. Continue?",
      )
    )
      return false;
    try {
      saveData(next);
      setData(next);
      setError("");
      setNeedsRecovery(false);
      return true;
    } catch {
      const message =
        "Your changes could not be saved. Storage may be full or unavailable. Export a backup and free some space, then try again.";
      setError(message);
      alert(message);
      return false;
    }
  }
  return { data, update, error };
}
