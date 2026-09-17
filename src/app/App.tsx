import { InstallPrompt } from "../components/InstallPrompt";
import { Folders } from "../pages/Folders";
import { confirmAction } from "../components/confirmAction";
import { OnlineAssistant } from "../features/ai/OnlineAssistant";
import { useEffect, useState } from "react";
import { navigate, usePage } from "../hooks/usePage";
import { RouteLink } from "../components/RouteLink";
import { useTheme } from "../hooks/useTheme";
import { Documentation } from "../pages/Documentation";
import { Sidebar, MobileHeader } from "../components/Navigation";
import { useStudyData } from "../hooks/useStudyData";
import { Home } from "../pages/Home";
import { Reviewers } from "../pages/Reviewers";
import { Topics } from "../pages/Topics";
import { Quizzes } from "../pages/Quizzes";
import { Activity } from "../pages/Activity";
import { Settings } from "../pages/Settings";
import { ReviewerEditor } from "../features/reviewers/ReviewerEditor";
import { StudySession } from "../features/study/StudySession";
import type { Session } from "../features/study/StudySession";
import type { Reviewer, Topic } from "../types/study";
import { prepareCards } from "../utils/stats";
import { downloadJson, STORAGE_KEY } from "../services/storage";

export default function App() {
  const { data, update, error, needsRecovery, allowRecovery } = useStudyData();
  const page = usePage();
  const [recoveryError, setRecoveryError] = useState("");
  const changeTheme = useTheme(data.settings.theme, (theme) =>
    update({ ...data, settings: { ...data.settings, theme } }),
  );
  const [editor, setEditor] = useState<Reviewer | "new" | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    document.title = `${page} · Mira — A little wiser, every day`;
  }, [page]);
  function start(reviewer: Reviewer, mode: "cards" | "quiz") {
    const cards = prepareCards(
      reviewer.cards,
      data.settings.shuffle,
      mode === "cards" ? reviewer.cards.length : data.settings.quizSize,
    );
    if (cards.length)
      setSession({
        title: reviewer.title,
        reviewerId: reviewer.id,
        mode,
        cards,
      });
  }
  function daily() {
    const cards = prepareCards(
      data.reviewers.flatMap((r) => r.cards),
      data.settings.shuffle,
      data.settings.quizSize,
    );
    if (cards.length)
      setSession({
        title: "Your daily review",
        reviewerId: "",
        mode: "daily",
        cards,
      });
  }
  function saveReviewer(reviewer: Reviewer, topic?: Topic) {
    return update({
      ...data,
      topics: topic ? [...data.topics, topic] : data.topics,
      reviewers: data.reviewers.some((r) => r.id === reviewer.id)
        ? data.reviewers.map((r) => (r.id === reviewer.id ? reviewer : r))
        : [...data.reviewers, reviewer],
    });
  }
  return (
    <div className="min-h-screen bg-page text-ink">
      <Sidebar page={page} />
      <InstallPrompt />
      <div className="flex min-h-dvh flex-col lg:ml-60">
        <MobileHeader page={page} />
        <header className="hidden min-h-12 items-center justify-between border-b border-line px-9 lg:flex">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span>Your workspace</span>
            <span>/</span>
            <span className="text-stone-600">{page}</span>
          </div>
          <span className="text-xs text-stone-400">
            {new Date().toLocaleDateString("en", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </header>
        <main className="app-main mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-8 sm:px-9 sm:py-10">
          <OnlineAssistant data={data} update={update} />
          <div key={page} className="page-content min-w-0 flex-1">
          {(error || recoveryError) && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              {recoveryError || error}
              <button
                className="ml-3 underline"
                onClick={() => {
                  try {
                    downloadJson(
                      localStorage.getItem(STORAGE_KEY) || "{}",
                      "mira-recovery.json",
                    );
                  } catch {
                    setRecoveryError(
                      "Browser storage is unavailable. Please check your browser permissions.",
                    );
                  }
                }}
              >
                Export existing storage
              </button>
              {needsRecovery && <button className="ml-3 underline" onClick={async () => {
                if (await confirmAction("Your existing data could not be loaded. Future saves will replace it. Export existing storage first if you need to recover it. Continue?")) allowRecovery();
              }}>Allow replacing unreadable data</button>}
            </div>
          )}
          {page === "Home" && (
            <Home
              data={data}
              navigate={navigate}
              onCreate={() => setEditor("new")}
              onStudy={(r) => start(r, "cards")}
              onDaily={daily}
            />
          )}
          {page === "Reviewers" && (
            <Reviewers
              data={data}
              onCreate={() => setEditor("new")}
              onEdit={setEditor}
              onDelete={async (r) => {
                if (
                  await confirmAction(
                    `Delete “${r.title}” and its cards? Past quiz results will be kept.`,
                  )
                )
                  update({
                    ...data,
                    reviewers: data.reviewers.filter(
                      (item) => item.id !== r.id,
                    ),
                  });
              }}
              onStudy={(r) => start(r, "cards")}
              onQuiz={(r) => start(r, "quiz")}
            />
          )}
          {page === "Folders" && <Folders data={data} update={update} onEdit={setEditor} onStudy={r => start(r, "cards")} />}
          {page === "Topics" && <Topics data={data} update={update} />}
          {page === "Quizzes" && (
            <Quizzes
              data={data}
              onQuiz={(r) => start(r, "quiz")}
              onDaily={daily}
            />
          )}
          {page === "Activity" && <Activity data={data} />}
          {page === "Settings" && (
            <Settings data={data} update={update} onThemeChange={changeTheme} />
          )}
          {[
            "Docs",
            "Guide",
            "Contribute",
            "Privacy",
            "Terms",
            "About",
            "Not found",
          ].includes(page) && <Documentation page={page} />}
          </div>
          <footer className="mt-12 flex flex-wrap justify-between gap-3 border-t border-stone-200 pt-5 text-[10px] text-stone-400">
            <span>A little wiser, every day.</span>
            <nav className="flex flex-wrap gap-4" aria-label="Footer">
              {(
                ["Docs", "Guide", "Contribute", "Privacy", "Terms", "About"] as const
              ).map((item) => (
                <RouteLink
                  key={item}
                  page={item}
                  className="hover:text-violet-500"
                >
                  {item === "Terms" ? "Terms & conditions" : item}
                </RouteLink>
              ))}
            </nav>
          </footer>
        </main>
      </div>
      {editor && (
        <ReviewerEditor
          reviewer={editor === "new" ? undefined : editor}
          topics={data.topics}
          folders={data.folders}
          onSave={saveReviewer}
          onClose={() => setEditor(null)}
        />
      )}
      {session && (
        <StudySession
          session={session}
          onClose={() => setSession(null)}
          onComplete={(attempt) =>
            update({ ...data, attempts: [...data.attempts, attempt] })
          }
        />
      )}
    </div>
  );
}
