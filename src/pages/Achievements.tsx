import type { StudyData } from "../types/study";
import { achievements } from "../features/achievements/achievements";
import { PageHeading } from "../components/ui";
export function Achievements({ data }: { data: StudyData }) {
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
      <div className="achievement-grid">
        {badges.map((badge) => (
          <article
            key={badge.id}
            className={
              "panel achievement-card " + (badge.earned ? "earned" : "locked")
            }
          >
            <img
              src={badge.image}
              alt=""
              width={120}
              height={120}
              loading="lazy"
            />
            <span className="achievement-state">
              {badge.earned ? "Unlocked" : "Locked"}
            </span>
            <h2>{badge.title}</h2>
            <p>{badge.description}</p>
            <p className="achievement-detail mb-auto">{badge.detail}</p>
            <progress
              aria-label={badge.title + " progress"}
              value={badge.current}
              max={badge.target}
            />
            <small>
              {badge.current} / {badge.target}
            </small>
          </article>
        ))}
      </div>
    </>
  );
}
