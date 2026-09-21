import type { learningAnalytics } from "../learning/analytics";

interface LearningPathProps {
  insights: ReturnType<typeof learningAnalytics>;
  onStart: () => void;
}

export function LearningPath({ insights, onStart }: LearningPathProps) {
  const total = insights.cards.length;
  const mastered = insights.cards.filter(
    (card) => card.mastery === "Mastered",
  ).length;
  const steps = [
    { count: insights.due, label: "due now", description: "Refresh what you’ve learned." },
    {
      count: insights.needsReview,
      label: "to revisit",
      description: insights.weakestTopic
        ? `Give ${insights.weakestTopic.name} a little attention.`
        : "Build confidence, one card at a time.",
    },
    { count: insights.improved, label: "improved", description: "Small wins add up." },
  ];

  return (
    <section className="learning-path" aria-label="Adaptive learning">
      <div className="learning-path-heading">
        <div>
          <p className="eyebrow">A SMALL STEP FORWARD</p>
          <h2>Today’s learning path</h2>
        </div>
        <button className="button secondary" disabled={!total} onClick={onStart}>
          Let’s practice <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div className="learning-path-steps">
        {steps.map((step, index) => (
          <div key={step.label}>
            <span className="path-step-number">0{index + 1}</span>
            <div>
              <strong>{step.count} <span>{step.label}</span></strong>
              <p>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="learning-path-progress">
        <span>
          {total
            ? `${mastered} of ${total} cards mastered`
            : "Add your first reviewer to build your path."}
        </span>
        <progress value={mastered} max={Math.max(total, 1)} aria-label="Cards mastered" />
      </div>
    </section>
  );
}
