import type { MiraMood } from "../../types/learning";

// Visual tone hints, not a sentiment score or a claim that the assistant has feelings.
export function ambientMood(busy: boolean, hasError: boolean, reply: string, hasReviewers: boolean): MiraMood {
  if (hasError) return "sad";
  if (busy) return "thinking";
  if (hasReviewers || /\b(congratulations|milestone|you did it|amazing progress)\b/i.test(reply)) return "amazed";
  if (/\b(great work|well done|you got it|excellent|nice work|keep it up)\b/i.test(reply)) return "happy";
  if (/\b(take your time|one step at a time|it's okay|it’s okay|feeling overwhelmed|sorry)\b/i.test(reply)) return "sad";
  return "normal";
}
