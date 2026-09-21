import { useEffect, useState } from "react";
import {
  loadActiveDraft,
  persistActiveDraft,
} from "../../services/storageRuntime";
import { parseQuizDraft } from "./quizDraft";
import { type QuizDraft } from "../../types/session";

import type { Session } from "../../types/session";

import { ProcessButton } from "../../components/ProcessButton";
import { useActionFeedback } from "../../hooks/useActionFeedback";
export function ResumeQuiz({
  active,
  completedIds,
  onResume,
}: {
  active: boolean;
  completedIds: string[];
  onResume: (session: Session) => void;
}) {
  const [draft, setDraft] = useState<QuizDraft | null>(null);
  const [error, setError] = useState("");
  const action = useActionFeedback();
  useEffect(() => {
    if (active) return;
    let disposed = false;
    void loadActiveDraft()
      .then((value) => {
        if (disposed) return;
        setDraft(null);
        setError("");
        if (!value) return;
        try {
          const parsed = parseQuizDraft(value);
          if (completedIds.includes(parsed.id)) {
            void persistActiveDraft(undefined).catch(() =>
              setError(
                "Results are saved, but the old draft could not be removed. Try Discard.",
              ),
            );
            return;
          }
          setDraft(parsed);
        } catch {
          setError(
            "An unfinished quiz could not be read. Discard it to start fresh; your completed results are safe.",
          );
        }
      })
      .catch(() => {
        if (!disposed)
          setError("Could not load the unfinished quiz. Reload to retry.");
      });
    return () => {
      disposed = true;
    };
  }, [active, completedIds]);
  if (active || (!draft && !error)) return null;
  return (
    <section className="panel mb-4 p-4" aria-label="Unfinished quiz">
      <h2 className="section-title">Continue unfinished quiz?</h2>
      {draft && (
        <p className="my-3 text-sm">
          {draft.title} · Question {draft.index + 1} of {draft.cards.length}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="flex gap-2">
        {draft && (
          <button
            className="button primary"
            onClick={() => {
              onResume({ ...draft, resume: draft });
              setDraft(null);
            }}
          >
            Continue unfinished quiz
          </button>
        )}
        <ProcessButton
          type="button"
          className="button secondary"
          state={action.state}
          label="Discard unfinished quiz"
          onClick={() =>
            void action.run(async () => {
              await persistActiveDraft(undefined);
              setDraft(null);
              setError("");
            })
          }
        />
      </div>
      {action.error && <p role="alert">{action.error}</p>}
    </section>
  );
}
