export type AchievementCategory = "milestone" | "challenge" | "hidden";
export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  detail: string;
  category: AchievementCategory;
  target: number;
  current: number;
  earned: boolean;
  image: string;
  hidden?: boolean;
}
