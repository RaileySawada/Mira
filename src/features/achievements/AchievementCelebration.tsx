import { Modal } from "../../components/ui";
import type { achievements } from "./achievements";

export function AchievementCelebration({ badges, onClose }: { badges: ReturnType<typeof achievements>; onClose: () => void }) {
  if (!badges.length) return null;
  return <Modal title="A little win worth celebrating" onClose={onClose} className="achievement-celebration">
    <div className="reward-celebration-heading"><p>YOU DID IT!</p><h3>Congratulations!</h3><span>{badges.length === 1 ? "You’ve unlocked a new achievement." : "You’ve unlocked " + badges.length + " new achievements."}</span></div>
    <div className="reward-celebration-badges">{badges.map(badge => <article key={badge.id}>
      <img src={badge.image} alt={badge.title + " badge"} width={180} height={180} />
      <h4>{badge.title}</h4><p>{badge.description}</p>
    </article>)}</div>
    <p className="reward-celebration-note">Saved to your achievements. A little wiser, every day.</p>
    <button autoFocus className="button primary w-full" onClick={onClose}>Keep learning</button>
  </Modal>;
}
