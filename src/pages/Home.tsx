import { LearningInsights } from "../features/home/LearningInsights";
import { LearningPath } from "../features/home/LearningPath";
import { learningAnalytics } from "../features/learning/analytics";
import { studyStreak } from "../features/learning/streak";
import { MiraInteraction } from "../features/home/MiraInteraction";
import { homeMessages } from "../features/home/miraMessages";
import { lazy, Suspense, useMemo, useState } from "react";
import type { Page, Reviewer, StudyData } from "../types/study";
import { dayKey, percentage } from "../utils/stats";
import { EmptyState, PageHeading } from "../components/ui";

const StudyCharts = lazy(() => import("../components/StudyCharts"));

export function Home({
  data,
  navigate,
  onCreate,
  onStudy,
  onDaily,
  newlyEarned = 0,
}: {
  data: StudyData;
  newlyEarned?: number;
  navigate: (page: Page) => void;
  onCreate: () => void;
  onStudy: (reviewer: Reviewer) => void;
  onDaily: () => void;
}) {
  const [messageVariant] = useState(() => Math.floor(Math.random() * 100000));
  const greetings = useMemo(
    () => homeMessages(data, new Date(), messageVariant, newlyEarned),
    [data, messageVariant, newlyEarned],
  );
  const adaptive = useMemo(() => learningAnalytics(data), [data]);
  const current = data.reviewers.find(
    (r) => r.id === data.lastStudy?.reviewerId,
  );
  const folder = data.folders?.find((f) => f.id === current?.folderId);
  const today = data.attempts.filter(
    (a) => dayKey(a.date) === dayKey(new Date()),
  );
  const studied = today.reduce((n, a) => n + a.total, 0);
  const accuracy = percentage(data.attempts);
  const currentStreak = studyStreak(data);
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
            New reviewer
          </button>
        }
      />
      <section className="mira-welcome" aria-labelledby="mira-greeting">
        <MiraInteraction key={JSON.stringify(greetings)} messages={greetings} />
        <div className="mira-welcome-footer">
          <p className="mira-welcome-progress">
            {today.length ? (
              <>
                <strong>
                  {today.length} {today.length === 1 ? "quiz" : "quizzes"}{" "}
                  completed today
                </strong>
                <span>
                  {studied} {studied === 1 ? "question" : "questions"} practiced
                </span>
              </>
            ) : cards === 0 ? (
              "Add your first reviewer to begin."
            ) : (
              "A fresh page for today. Start whenever you’re ready."
            )}
          </p>
          <button
            className="button secondary"
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
          </button>
        </div>
      </section>
      <LearningPath insights={adaptive} onStart={onDaily} />
      <LearningInsights insights={adaptive} onStudy={onStudy} />
      <section className="panel current-study">
        <div>
          <p className="mira-welcome-label">
            {current ? "PICK UP WHERE YOU LEFT OFF" : "YOUR STUDY DESK"}
          </p>
          <h2>{current?.title ?? "What would you like to learn?"}</h2>
          <p>
            {current
              ? (folder?.name ?? "Unfiled") +
                " / " +
                (data.topics.find((t) => t.id === current.topicId)?.name ??
                  "Uncategorized") +
                " · " +
                current.cards.length +
                " cards"
              : "Open a reviewer to keep your current study set and its folder here."}
          </p>
        </div>
        <button
          className="button primary"
          onClick={() => (current ? onStudy(current) : navigate("Reviewers"))}
        >
          {current ? "Continue studying" : "Choose a reviewer"}
        </button>
      </section>
      <div className="home-study-grid grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section>
          <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
            <h2 className="section-title">Keep the curiosity going</h2>
            <button
              className="text-button"
              onClick={() => navigate("Reviewers")}
            >
              View all
            </button>
          </div>
          {data.reviewers.length === 0 ? (
            <EmptyState
              title="Your first chapter is waiting"
              description="Create a reviewer with your own notes and flashcards. All your learning stays right here, on your device."
              action={
                <button className="button secondary" onClick={onCreate}>
                  Create a reviewer
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
                      <p className="mt-1 break-words text-xs text-stone-400">
                        {data.topics.find((s) => s.id === reviewer.topicId)
                          ?.name || "Uncategorized"}{" "}
                        · {reviewer.cards.length} card
                        {reviewer.cards.length === 1 ? "" : "s"}
                      </p>
                    </div>
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
              className="h-full rounded-full bg-[#8d80b5]"
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
              A REMINDER FROM MIRA
            </span>
          </div>
        </section>
      </div>
      <div className="mt-8">
        {" "}
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
        <Suspense
          fallback={
            <div className="mb-8 h-72" role="status">
              Loading charts…
            </div>
          }
        >
          <StudyCharts attempts={data.attempts} />
        </Suspense>
      </div>
    </>
  );
}
