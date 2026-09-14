import type { Page, Reviewer, StudyData } from "../types/study";
import { dayKey, percentage, streak, weekActivity } from "../utils/stats";
import { Icon } from "../components/Icon";
import { EmptyState, PageHeading } from "../components/ui";

export function Home({
  data,
  navigate,
  onCreate,
  onStudy,
  onDaily,
}: {
  data: StudyData;
  navigate: (page: Page) => void;
  onCreate: () => void;
  onStudy: (reviewer: Reviewer) => void;
  onDaily: () => void;
}) {
  const today = data.attempts.filter(
    (a) => dayKey(a.date) === dayKey(new Date()),
  );
  const studied = today.reduce((n, a) => n + a.total, 0);
  const accuracy = percentage(data.attempts);
  const currentStreak = streak(data.attempts);
  const week = weekActivity(data.attempts);
  const maximum = Math.max(
    data.settings.dailyGoal,
    ...week.map((d) => d.total),
    1,
  );
  const cards = data.reviewers.reduce((n, r) => n + r.cards.length, 0);
  const dailyDone = today.some((a) => a.mode === "daily");
  const stats = [
    {
      label: "Total reviewers",
      value: data.reviewers.length,
      note: `${cards} flashcard${cards === 1 ? "" : "s"} to explore`,
    },
    {
      label: "Current streak",
      value: `${currentStreak} day${currentStreak === 1 ? "" : "s"}`,
      note: "One day at a time",
    },
    {
      label: "Quiz accuracy",
      value: data.attempts.length ? `${accuracy}%` : "—",
      note: "Based on completed tests",
    },
    {
      label: "Quizzes completed",
      value: data.attempts.length,
      note: `${today.length} completed today`,
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="A LITTLE PROGRESS, EVERY DAY"
        title={`Your next chapter starts here${data.settings.name ? `, ${data.settings.name}` : ""}.`}
        description="Make room for a little learning. Your future self will thank you."
        action={
          <button className="button primary" onClick={onCreate}>
            <Icon name="plus" size={17} /> New reviewer
          </button>
        }
      />
      <section className="relative mb-7 overflow-hidden rounded-2xl border border-line bg-sage p-6 sm:p-8">
        <div className="relative z-10 max-w-[65%] sm:max-w-[70%]">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-accent-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-[#788962]" /> YOUR
            DAILY DOSE OF GROWTH
          </span>
          <h2 className="mt-4 text-2xl font-medium tracking-tight sm:text-3xl">
            Small steps. Big possibilities.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-stone-600">
            {dailyDone
              ? "Daily review, done. Look at you showing up for yourself."
              : data.settings.autoDaily
                ? "A fresh daily review is ready when you are. Let’s turn what you’re learning into what you know."
                : "Pick up your flashcards and give your curiosity a little space to grow."}
          </p>
          <button
            className="button dark mt-5"
            onClick={
              data.settings.autoDaily ? onDaily : () => navigate("Reviewers")
            }
            disabled={data.settings.autoDaily && cards === 0}
          >
            {data.settings.autoDaily
              ? dailyDone
                ? "Practice again"
                : "Start daily review"
              : "Explore reviewers"}
            <Icon name="arrow" size={16} />
          </button>
          {cards === 0 && (
            <p className="mt-3 text-xs text-stone-500">
              Add your first reviewer to begin.
            </p>
          )}
        </div>
        <div className="book-art" aria-hidden="true">
          <span className="art-spark">✧</span>
          <div className="book book-back" />
          <div className="book book-front">
            <span>MIRA</span>
            <div className="book-flower">✳</div>
            <small>
              a little wiser
              <br />
              every day.
            </small>
          </div>
          <span className="art-dot" />
        </div>
      </section>
      <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <div className="panel p-5" key={stat.label}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-stone-500">{stat.label}</p>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {stat.value}
            </p>
            <p className="mt-2 text-[11px] text-stone-400">{stat.note}</p>
          </div>
        ))}
      </div>
      <div className="mb-8 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section className="panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">Your learning rhythm</h2>
              <p className="mt-1 text-xs text-stone-500">
                Questions answered over the last 7 days
              </p>
            </div>
            <span className="badge">This week</span>
          </div>
          <div
            className="mt-6 flex h-40 gap-3"
            role="img"
            aria-label={week
              .map((d) => `${d.label}: ${d.total} questions`)
              .join(", ")}
          >
            <div className="flex flex-col justify-between pb-6 text-[10px] text-stone-400">
              <span>{maximum}</span>
              <span>{Math.round(maximum / 2)}</span>
              <span>0</span>
            </div>
            <div className="chart-grid flex flex-1 items-end justify-around gap-3">
              {week.map((day, i) => (
                <div
                  key={i}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <div
                    className={`chart-bar ${i === 6 ? "bg-[#8d80b5]" : "bg-[#dfd9ec]"}`}
                    style={{
                      height: `${Math.max(2, (day.total / maximum) * 115)}px`,
                    }}
                    title={`${day.total} questions`}
                  />
                  <span className="text-[10px] text-stone-400">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel p-6">
          <h2 className="section-title">A little more knowledgeable</h2>
          <p className="mt-1 text-xs text-stone-500">
            Your all-time quiz performance
          </p>
          <div className="mt-6 flex items-center justify-around gap-5">
            <div
              className="donut"
              style={{
                background: `conic-gradient(#8d80b5 ${accuracy}%, var(--chart-track) 0)`,
              }}
              role="img"
              aria-label={`${accuracy}% correct answers`}
            >
              <div>
                <strong className="text-3xl font-semibold">
                  {data.attempts.length ? `${accuracy}%` : "—"}
                </strong>
                <span className="mt-1 text-[10px] text-stone-500">
                  accuracy
                </span>
              </div>
            </div>
            <div className="space-y-4 text-xs">
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#8d80b5]" />
                Correct answers
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#e7e3ed]" />
                Room to grow
              </p>
              <p className="max-w-32 leading-5 text-stone-400">
                A guide to your progress, not a measure of your potential.
              </p>
            </div>
          </div>
        </section>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Keep the curiosity going</h2>
            <button
              className="text-button"
              onClick={() => navigate("Reviewers")}
            >
              View all <Icon name="arrow" size={14} />
            </button>
          </div>
          {data.reviewers.length === 0 ? (
            <EmptyState
              title="Your first chapter is waiting"
              description="Create a reviewer with your own notes and flashcards. All your learning stays right here, on your device."
              action={
                <button className="button secondary" onClick={onCreate}>
                  <Icon name="plus" size={15} /> Create a reviewer
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {[...data.reviewers]
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .slice(0, 3)
                .map((reviewer) => (
                  <button
                    key={reviewer.id}
                    className="panel flex w-full items-center gap-4 p-4 text-left transition hover:border-violet-300"
                    onClick={() => onStudy(reviewer)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {reviewer.title}
                      </p>
                      <p className="mt-1 text-xs text-stone-400">
                        {data.topics.find((s) => s.id === reviewer.topicId)
                          ?.name || "Uncategorized"}{" "}
                        · {reviewer.cards.length} card
                        {reviewer.cards.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Icon name="arrow" size={16} />
                  </button>
                ))}
            </div>
          )}
        </section>
        <section className="panel self-start p-6">
          <div className="flex items-center gap-2">
            <h2 className="section-title">Today, for you</h2>
          </div>
          <p className="mt-5 text-sm text-stone-600">
            A little practice goes a long way.
          </p>
          <div className="mt-5 flex justify-between text-xs">
            <span className="text-stone-500">Daily question goal</span>
            <span className="font-medium">
              {studied} / {data.settings.dailyGoal}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-[#9caa83]"
              style={{
                width: `${Math.min(100, (studied / data.settings.dailyGoal) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-stone-400">
            {studied >= data.settings.dailyGoal
              ? "You reached your goal. Take a moment to celebrate!"
              : `${Math.max(0, data.settings.dailyGoal - studied)} more questions to reach your daily goal.`}
          </p>
          <div className="mt-6 border-t border-stone-100 pt-5 text-sm italic leading-6 text-stone-500">
            “You don’t have to be perfect.
            <br />
            You just have to keep going.”
            <span className="mt-2 block text-[10px] not-italic tracking-widest text-stone-400">
              A REMINDER FROM MIRA ♡
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
