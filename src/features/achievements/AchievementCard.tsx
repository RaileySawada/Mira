import { LockKeyhole } from "lucide-react";
import type { AchievementDefinition } from "./types";

export function AchievementCard({ badge }: { badge: AchievementDefinition }) {
  const secret = badge.hidden && !badge.earned;
  const title = secret ? "???" : badge.title;
  return (
    <article
      className={
        "panel achievement-card " + (badge.earned ? "earned" : "locked")
      }
    >
      {secret ? (
        <div
          className="flex h-30 items-center justify-center"
          aria-hidden="true"
        >
          <LockKeyhole size={48} />
        </div>
      ) : (
        <img src={badge.image} alt="" width={120} height={120} loading="lazy" />
      )}
      <span className="achievement-state">
        {badge.earned ? "Unlocked" : "Locked"}
      </span>
      <h2>{title}</h2>
      <p>{secret ? "Secret achievement" : badge.description}</p>
      {!secret && (
        <>
          <p className="achievement-detail mb-auto">{badge.detail}</p>
          <progress
            aria-label={title + " progress"}
            value={badge.current}
            max={badge.target}
          />
          <small>
            {Math.floor(badge.current * 10) / 10} / {badge.target}
          </small>
        </>
      )}
    </article>
  );
}
