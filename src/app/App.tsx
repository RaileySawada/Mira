import { OnlineCount } from "../components/OnlineCount";
import { recoveryBackup } from "../services/storageRuntime";
import { confirmNewQuiz } from "../features/study/sessionActions";
import { cardMastery } from "../features/learning/mastery";
import { ResumeQuiz } from "../features/study/ResumeQuiz";
import { DocumentImport } from "../features/import/DocumentImport";
import { selectDailyCards } from "../features/learning/dailyReview";
import { recordAttempt, recordRating } from "../features/learning/scheduler";
import { usePresence } from "../hooks/usePresence";
import { dailyQuizSize } from "../utils/quiz";
import { AchievementCelebration } from "../features/achievements/AchievementCelebration";
import { FocusTimer } from "../features/achievements/FocusTimer";
import { Achievements } from "../pages/Achievements";
import { PolicyConsent } from "../features/consent/PolicyConsent";
import { hasPolicyConsent } from "../features/consent/policy";
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
import type { Session } from "../types/session";

import type { Reviewer, Topic } from "../types/study";
import { prepareCards } from "../utils/stats";
import { downloadJson } from "../services/storage";

export default function App() {
  const {
    data,
    update,
    rewards,
    dismissRewards,
    error,
    needsRecovery,
    allowRecovery,
  } = useStudyData();
  const page = usePage();
  const [accepted, setAccepted] = useState(hasPolicyConsent);
  const presence = usePresence(accepted);
  useEffect(() => {
    const refresh = () => setAccepted(hasPolicyConsent());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);
  const [recoveryError, setRecoveryError] = useState("");
  const changeTheme = useTheme(data.settings.theme, (theme) =>
    update({ ...data, settings: { ...data.settings, theme } }),
  );
  const [editor, setEditor] = useState<Reviewer | "new" | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    document.title = page === "Mira" ? "Mira" : `${page} | Mira`;
  }, [page]);
  async function start(reviewer: Reviewer, mode: "cards" | "quiz") {
    const cards = prepareCards(
      reviewer.cards,
      data.settings.shuffle,
      reviewer.cards.length,
    );
    if (cards.length) {
      if (mode === "quiz") {
        try {
          if (!(await confirmNewQuiz())) return;
        } catch {
          setRecoveryError(
            "Could not check your unfinished quiz. Reload before starting another.",
          );
          return;
        }
      }
      if (
        !(await update({
          ...data,
          lastStudy: {
            reviewerId: reviewer.id,
            startedAt: new Date().toISOString(),
          },
        }))
      )
        return;
      setSession({
        title: reviewer.title,
        reviewerId: reviewer.id,
        mode,
        cards,
        answerPool: reviewer.cards,
      });
    }
  }
  async function daily() {
    try {
      if (!(await confirmNewQuiz())) return;
    } catch {
      setRecoveryError(
        "Could not check your unfinished quiz. Reload before starting another.",
      );
      return;
    }
    const cards = selectDailyCards(data, dailyQuizSize(data.settings));
    if (cards.length)
      setSession({
        title: "Your daily review",
        reviewerId: "",
        mode: "daily",
        cards,
        answerPool: data.reviewers.flatMap((r) => r.cards),
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
  if (!accepted) return <PolicyConsent onAccept={() => setAccepted(true)} />;
  return (
    <div className="min-h-screen bg-page text-ink">
      <Sidebar page={page} />
      <InstallPrompt />
      <div className="flex min-h-dvh flex-col lg:ml-60">
        <MobileHeader page={page} presence={presence} />
        <header className="hidden min-h-12 items-center justify-between border-b border-line px-9 lg:flex">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span>Your workspace</span>
            <span>/</span>
            <span className="text-stone-600">{page}</span>
          </div>
          <div className="flex items-center gap-5"><OnlineCount presence={presence} /><span className="text-xs text-stone-400">
            {new Date().toLocaleDateString("en", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span></div>
        </header>
        <main className={page === "Mira" ? "app-main mira-main" : "app-main mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-8 sm:px-9 sm:py-10"}>
          <OnlineAssistant data={data} update={update} pageMode={page === "Mira"} />
          <ResumeQuiz
            active={!!session}
            completedIds={data.attempts.map((a) => a.id)}
            onResume={setSession}
          />
          <div key={page} className={page === "Mira" ? "contents" : "page-content min-w-0 flex-1"}>
            {(error || recoveryError) && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {recoveryError || error}
                <button
                  className="ml-3 underline"
                  onClick={async () => {
                    try {
                      downloadJson(
                        await recoveryBackup(),
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
                {needsRecovery && (
                  <button
                    className="ml-3 underline"
                    onClick={async () => {
                      if (
                        await confirmAction(
                          "Your existing data could not be loaded. Future saves will replace it. Export existing storage first if you need to recover it. Continue?",
                        )
                      )
                        allowRecovery();
                    }}
                  >
                    Allow replacing unreadable data
                  </button>
                )}
              </div>
            )}
            {page === "Home" && (
              <Home
                newlyEarned={rewards.length}
                data={data}
                navigate={navigate}
                onCreate={() => setEditor("new")}
                onStudy={(r) => start(r, "cards")}
                onDaily={daily}
              />
            )}
            {page === "Reviewers" && (
              <div className="mb-3">
                <DocumentImport onReviewer={setEditor} />
              </div>
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
            {page === "Folders" && (
              <Folders
                data={data}
                update={update}
                onEdit={setEditor}
                onStudy={(r) => start(r, "cards")}
              />
            )}
            {page === "Topics" && <Topics data={data} update={update} />}
            {page === "Quizzes" && (
              <Quizzes
                data={data}
                onQuiz={(r) => start(r, "quiz")}
                onDaily={daily}
              />
            )}
            {page === "Achievements" && <Achievements data={data} />}
            {page === "Activity" && <Activity data={data} />}
            {page === "Settings" && (
              <Settings
                data={data}
                update={update}
                onThemeChange={changeTheme}
              />
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
          <FocusTimer
            visible={page === "Achievements"}
            onComplete={() =>
              update({
                ...data,
                milestones: { ...data.milestones, focusCompleted: true },
              })
            }
          />
          <footer hidden={page === "Mira"} className="mt-12 flex flex-wrap justify-between gap-3 border-t border-stone-200 pt-5 text-[10px] text-stone-400">
            <span>A little wiser, every day.</span>
            <nav className="flex flex-wrap gap-4" aria-label="Footer">
              {(
                [
                  "Docs",
                  "Guide",
                  "Contribute",
                  "Privacy",
                  "Terms",
                  "About",
                ] as const
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
          mastery={session.cards.map((card) =>
            cardMastery(
              data.schedules?.find(
                (s) =>
                  s.reviewerId === session.reviewerId && s.cardId === card.id,
              ),
            ),
          )}
          onRate={(card, known) =>
            update((current) =>
              recordRating(
                current,
                session.reviewerId,
                card.id,
                known,
                "flashcard",
              ),
            )
          }
          onClose={() => setSession(null)}
          onPracticeComplete={() =>
            update((current) => ({
              ...current,
              milestones: {
                ...current.milestones,
                studyDates: [
                  ...(current.milestones?.studyDates ?? []),
                  new Date().toISOString(),
                ],
              },
            }))
          }
          onComplete={(attempt) =>
            update((current) => recordAttempt(current, attempt))
          }
        />
      )}
      <AchievementCelebration badges={rewards} onClose={dismissRewards} />
    </div>
  );
}
