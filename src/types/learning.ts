import type { Card } from "./study";

export type Mastery = "New" | "Learning" | "Needs review" | "Mastered";

export type MiraMood = "normal" | "happy" | "amazed" | "thinking" | "sad";

export type StudyCard = Card & { reviewerId?: string };

export interface MiraMessage {
  mood: MiraMood;
  text: string;
}
