import type { GeneratedReviewer } from "../../src/types/ai";

export function generated(title = "Cell structures"): GeneratedReviewer {
  return {
    title,
    description: "Cell biology",
    cards: Array.from({ length: 5 }, (_, i) => ({
      question: "Question " + i,
      answer: "Answer " + i,
    })),
  };
}
