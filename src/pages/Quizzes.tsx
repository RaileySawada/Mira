import type { Reviewer, StudyData } from "../types/study";
import { EmptyState, PageHeading } from "../components/ui";
import { dayKey } from "../utils/stats";
export function Quizzes({
  data,
  onQuiz,
  onDaily,
}: {
  data: StudyData;
  onQuiz: (r: Reviewer) => void;
  onDaily: () => void;
}) {
  const available = data.reviewers.filter((r) => r.cards.length);
  const done = data.attempts.some(
    (a) => a.mode === "daily" && dayKey(a.date) === dayKey(new Date()),
  );
  return (
    <>
      <PageHeading
        eyebrow="TURN LEARNING INTO KNOWING"
        title="Let’s see what’s sticking."
        description="Test your recall with written answers. Every attempt is a chance to grow."
      />
      <section className="mb-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-violet-200 bg-violet-50 p-7">
        <div>
          <span className="eyebrow">A FRESH LITTLE CHALLENGE</span>
          <h2 className="mt-2 text-xl font-semibold">Your daily review</h2>
          <p className="mt-2 text-sm text-stone-500">
            {done
              ? "You’ve completed today’s review. Extra practice is always welcome."
              : `Up to ${data.settings.quizSize} questions from across your reviewers.`}
          </p>
          <p className="mt-2 text-xs text-stone-400">
            Daily review on Home is{" "}
            {data.settings.autoDaily ? "enabled" : "disabled"} in Settings.
          </p>
        </div>
        <button
          disabled={!available.length}
          className="button primary"
          onClick={onDaily}
        >
          {done ? "Practice again" : "Begin daily review"}
        </button>
      </section>
      <h2 className="section-title mb-4">Choose your focus</h2>
      {available.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {available.map((r) => (
            <div className="panel p-6" key={r.id}>
              <h3 className="font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm text-stone-500">
                {Math.min(r.cards.length, data.settings.quizSize)} questions ·
                Written recall
              </p>
              <button
                className="button secondary mt-5"
                onClick={() => onQuiz(r)}
              >
                Start quiz →
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="A quiz starts with a little knowledge"
          description="Add flashcards to a reviewer first. Your quizzes will be created from those cards."
        />
      )}
    </>
  );
}
