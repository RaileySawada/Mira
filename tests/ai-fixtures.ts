import type { GeneratedReviewer } from "../src/features/ai/schema";
export function generated(title = "Cell structures"): GeneratedReviewer {
  return { title, description: "Cell biology", cards: Array.from({ length: 5 }, (_, i) => ({ question: "Question " + i, answer: "Answer " + i })) };
}
