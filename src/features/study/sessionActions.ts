import {
  loadActiveDraft,
  persistActiveDraft,
} from "../../services/storageRuntime";
import { confirmAction } from "../../components/confirmAction";
export async function confirmNewQuiz(): Promise<boolean> {
  const draft = await loadActiveDraft();
  if (!draft) return true;
  if (
    !(await confirmAction(
      "Starting another quiz will discard the unfinished quiz. Continue?",
    ))
  )
    return false;
  await persistActiveDraft(undefined);
  return true;
}
