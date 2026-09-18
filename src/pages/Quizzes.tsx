import { useViewPreference } from "../hooks/useViewPreference";
import type { Reviewer, StudyData } from "../types/study";
import { EmptyState, PageHeading } from "../components/ui";
import { dayKey } from "../utils/stats";
import { ViewToggle } from "../components/ViewToggle";

export function Quizzes({ data, onQuiz, onDaily }: { data: StudyData; onQuiz: (r: Reviewer) => void; onDaily: () => void }) {
  const { view, setView, error: layoutError } = useViewPreference("quizzes");
  const available = data.reviewers.filter(reviewer => reviewer.cards.length);
  const done = data.attempts.some(attempt => attempt.mode === "daily" && dayKey(attempt.date) === dayKey(new Date()));
  return <>
    {layoutError && <p role="status" className="mb-4 text-xs text-stone-500">{layoutError}</p>}
    <PageHeading eyebrow="YOUR PRACTICE SPACE" title="Put your knowledge to the test." description="Pick a reviewer to focus on, or mix things up with a daily review." />
    <section className="quiz-daily-card">
      <div>
        <span className="quiz-daily-status">{done ? "Completed today" : "A little practice, every day"}</span>
        <h2>Your daily review</h2>
        <p>{done ? "You’ve completed today’s review. Come back tomorrow or keep practicing." : "A mix of questions from your saved reviewers. Take it at your own pace."}</p>
      </div>
      <div className="quiz-daily-action">
        <button disabled={!available.length} className="button primary" onClick={onDaily}>{done ? "Practice again" : "Begin daily review"}</button>
        <small>{Math.min(data.settings.quizSize, available.reduce((total, reviewer) => total + reviewer.cards.length, 0))} questions · Mixed practice</small>
      </div>
    </section>
    <div className="collection-heading"><h2 className="section-title">Choose your focus</h2>{available.length > 0 && <ViewToggle value={view} onChange={setView} label="Quiz layout" />}</div>
    {available.length ? <div className={view === "grid" ? "quiz-collection quiz-grid" : "quiz-collection quiz-list"}>
      {available.map(reviewer => (
        <article className="panel quiz-card" key={reviewer.id}>
          <div className="quiz-card-main">
            <span className="quiz-topic">{data.topics.find(topic => topic.id === reviewer.topicId)?.name ?? "Uncategorized"}</span>
            <h3>{reviewer.title}</h3>
            <p>{Math.min(reviewer.cards.length, data.settings.quizSize)} questions</p>
          </div>
          <div className="quiz-card-footer">
            <span>Normal or hard</span>
            <button className="button secondary" onClick={() => onQuiz(reviewer)}>Start quiz →</button>
          </div>
        </article>
      ))}
    </div> : <EmptyState title="A quiz starts with a little knowledge" description="Add flashcards to a reviewer first. Your quizzes will be created from those cards." />}
  </>;
}
