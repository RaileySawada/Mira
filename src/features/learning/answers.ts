import type { Card } from "../../types/study";

export function normalizeWrittenAnswer(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.,!?;:]+$/g, "")
    .replace(/[,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function matchesAnswer(answer: string, card: Card): boolean {
  const normalized = normalizeWrittenAnswer(answer);
  return (
    !!normalized &&
    [card.answer, ...(card.acceptedAnswers ?? [])].some(
      (expected) => normalizeWrittenAnswer(expected) === normalized,
    )
  );
}
