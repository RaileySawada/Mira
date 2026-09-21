import { useState } from "react";
import type { Reviewer } from "../../types/study";
import type { learningAnalytics } from "../learning/analytics";

interface LearningInsightsProps {
  insights: ReturnType<typeof learningAnalytics>;
  onStudy: (reviewer: Reviewer) => void;
}

export function LearningInsights({ insights, onStudy }: LearningInsightsProps) {
  const [category, setCategory] = useState<"topics" | "folders" | "reviewers">("topics");
  const [expanded, setExpanded] = useState(false);
  const groups = insights[category];
  const visible = expanded ? groups : groups.slice(0, 5);
  const weakCards = insights.cards.filter(item => item.mastery === "Needs review").slice(0, 3);

  return (
    <section className="learning-insights" aria-label="Learning insights">
      <header>
        <div><p className="eyebrow">YOUR PROGRESS, A LITTLE CLEARER</p><h2>Learning insights</h2></div>
        <p>See what’s settling in and where a little practice can help.</p>
      </header>
      <div className="insight-tabs" role="group" aria-label="Group learning insights">
        {(["topics", "folders", "reviewers"] as const).map(item => (
          <button key={item} aria-pressed={category === item} onClick={() => { setCategory(item); setExpanded(false); }}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <div className="insight-layout">
        <div>
          {visible.length ? <ul className="insight-groups">
            {visible.map(group => (
              <li key={group.id}>
                <div className="insight-row-heading"><h3>{group.name}</h3><span>{group.mastered}/{group.total} mastered</span></div>
                <progress value={group.mastered} max={Math.max(1, group.total)} aria-label={`${group.name} mastery`} />
                <p>{group.reviewed === 0 ? "Ready for your first review" : group.needsReview ? `${group.needsReview} cards to revisit` : "Keep building on your progress"}</p>
              </li>
            ))}
          </ul> : <p className="insight-empty">Your progress will appear here once you add a reviewer.</p>}
          {groups.length > 5 && <button className="text-button insight-show-more" onClick={() => setExpanded(!expanded)}>{expanded ? "Show less" : `Show all ${groups.length}`}</button>}
        </div>
        <aside className="insight-practice">
          <h3>Your next small win</h3>
          <p>{weakCards.length ? "Start with a card that could use another look." : "Review a few cards to discover what to practice next."}</p>
          {weakCards.map(item => (
            <button key={item.reviewer.id + item.card.id} onClick={() => onStudy(item.reviewer)}>
              <span>{item.card.question}</span><small>{item.reviewer.title}</small><span className="insight-practice-action">Practice this reviewer ↗</span>
            </button>
          ))}
        </aside>
      </div>
      <p className="insight-note">Based on recent answers and self-ratings—not a measure of your ability.</p>
    </section>
  );
}
