import type { Card } from "../../types/study";
import { normalizeAnswer, shuffled } from "../../utils/stats";
// Reuse saved definitions so practice never needs a network request.
export function makeChoices(card: Card, pool: Card[]): string[] {
  const unique = new Map<string, string>();
  pool.forEach(item => {
    const key = normalizeAnswer(item.answer);
    if (key && key !== normalizeAnswer(card.answer)) unique.set(key, item.answer);
  });
  return shuffled([card.answer, ...shuffled([...unique.values()]).slice(0, 3)]);
}
