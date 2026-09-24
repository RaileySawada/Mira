import { useState } from "react";
import { AchievementCard } from "../features/achievements/AchievementCard";
import type { AchievementCategory } from "../features/achievements/types";
import type { StudyData } from "../types/study";
import { achievements } from "../features/achievements/achievements";
import { PageHeading } from "../components/ui";
export function Achievements({ data }: { data: StudyData }) {
  const [category, setCategory] = useState<AchievementCategory | "all">("all");
  const badges = achievements(data);
  const count = badges.filter((b) => b.earned).length;
  return (
    <>
      <PageHeading
        eyebrow="YOUR LITTLE WINS"
        title="Look how far you’ve come."
        description="Every badge starts with a small step. Make progress at your own pace."
      />
      <div className="achievement-summary">
        <strong>
          {count} of {badges.length} unlocked
        </strong>
        <progress
          aria-label="Achievements unlocked"
          value={count}
          max={badges.length}
        />
      </div>
      <div
        className="mb-5 flex flex-wrap gap-2"
        role="group"
        aria-label="Achievement categories"
      >
        {(
          [
            ["all", "All"],
            ["milestone", "Milestones"],
            ["challenge", "Challenges"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={category === value}
            className={
              "button " + (category === value ? "primary" : "secondary")
            }
            onClick={() => setCategory(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="achievement-grid">
        {badges
          .filter((badge) => category === "all" || badge.category === category)
          .map((badge) => (
            <AchievementCard key={badge.id} badge={badge} />
          ))}
      </div>
    </>
  );
}
