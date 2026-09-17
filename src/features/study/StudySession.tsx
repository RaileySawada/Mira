import { FlashcardPractice } from "./FlashcardPractice";
import { confirmAction } from "../../components/confirmAction";
import { ProcessButton } from "../../components/ProcessButton";
import { useActionFeedback } from "../../hooks/useActionFeedback";
import { useState } from "react";
import type { Attempt, Card } from "../../types/study";
import { Modal } from "../../components/ui";
import { normalizeAnswer } from "../../utils/stats";
export interface Session {
  title: string;
  reviewerId: string;
  mode: "cards" | "quiz" | "daily";
  cards: Card[];
}
export function StudySession({
  session,
  onClose,
  onComplete,
}: {
  session: Session;
  onClose: () => void;
  onComplete: (a: Attempt) => boolean;
}) {
  const save = useActionFeedback();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<
    { answer: string; correct: boolean }[]
  >([]);
  const [checked, setChecked] = useState(false);
  const [complete, setComplete] = useState(false);
  const [attemptId] = useState(() => crypto.randomUUID());
  const card = session.cards[index];
  const score = answers.filter((a) => a.correct).length;
  async function close() {
    if (
      complete || save.state === "success" ||
      session.mode === "cards" ||
      await confirmAction("Leave this quiz? Unfinished answers will not be saved.")
    )
      onClose();
  }
  function next() {
    if (index === session.cards.length - 1) {
      void save.run(() => onComplete({
          id: attemptId,
          reviewerId: session.reviewerId,
          title: session.title,
          date: new Date().toISOString(),
          correct: score,
          total: session.cards.length,
          mode: session.mode === "daily" ? "daily" : "quiz",
        }), () => setComplete(true));
    } else {
      setIndex(index + 1);
      setAnswer("");
      setChecked(false);
    }
  }
  return (
    <Modal title={session.title} onClose={close} className="study-modal">
      {complete ? (
        <div>
          <div className="py-5 text-center">
            <p className="text-4xl font-semibold">
              {Math.round((score / session.cards.length) * 100)}%
            </p>
            <h3 className="mt-3 text-xl font-medium">Another step forward.</h3>
            <p className="mt-2 text-sm text-stone-500">
              {score} of {session.cards.length} correct. Your progress is saved.
            </p>
          </div>
          <div className="mb-5 space-y-3">
            {session.cards.map((c, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 ${answers[i].correct ? "border-green-200 bg-green-50/50" : "border-orange-200 bg-orange-50/50"}`}
              >
                <p className="text-sm font-medium">{c.question}</p>
                <p className="mt-2 whitespace-pre-wrap text-xs text-stone-500">
                  Your answer: {answers[i].answer}
                </p>
                {!answers[i].correct && (
                  <p className="mt-2 whitespace-pre-wrap text-xs text-stone-700">
                    Expected: {c.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
          <button className="button primary w-full" onClick={onClose}>
            Back to learning
          </button>
        </div>
      ) : (
        <>
          {session.mode !== "cards" && <>
          <div className="mb-4 flex justify-between text-xs text-stone-500">
            <span>
              {session.mode === "daily"
                  ? "DAILY REVIEW"
                  : "WRITTEN QUIZ"}
            </span>
            <span>
              {index + 1} / {session.cards.length}
            </span>
          </div>
          <div className="mb-6 h-1 rounded bg-stone-200">
            <div
              className="h-full rounded bg-[#8d80b5]"
              style={{
                width: `${((index + 1) / session.cards.length) * 100}%`,
              }}
            />
          </div>
          </>}
          {session.mode === "cards" ? (
            <FlashcardPractice cards={session.cards} onClose={onClose} />
          ) : (
            <>
              <h3 className="mb-6 whitespace-pre-wrap text-xl leading-8">
                {card.question}
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (checked) {
                    next();
                    return;
                  }
                  if (!answer.trim()) return;
                  setAnswers([
                    ...answers,
                    {
                      answer: answer.trim(),
                      correct:
                        normalizeAnswer(answer) ===
                        normalizeAnswer(card.answer),
                    },
                  ]);
                  setChecked(true);
                }}
              >
                <label className="field">
                  Your answer
                  <textarea
                    autoFocus
                    rows={3}
                    required
                    disabled={checked}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Take a breath. You've got this."
                  />
                </label>
                {checked && (
                  <div
                    className={`mt-4 rounded-xl p-4 text-sm ${answers[index].correct ? "bg-green-50 text-green-800" : "bg-orange-50 text-orange-800"}`}
                  >
                    <p className="font-medium">
                      {answers[index].correct
                        ? "That’s right. Nicely done!"
                        : "A little more practice for this one."}
                    </p>
                    {!answers[index].correct && (
                      <p className="mt-2 whitespace-pre-wrap">
                        Expected answer: {card.answer}
                      </p>
                    )}
                  </div>
                )}
                {save.error && <p role="alert" className="mt-4 text-sm text-red-600">{save.error}</p>}
                <ProcessButton className="button primary mt-5 w-full" state={save.state} successLabel="Saved" label={checked ? index === session.cards.length - 1 ? "Finish & save results" : "Next question" : "Check answer"}>
                  {checked
                    ? index === session.cards.length - 1
                      ? "Finish & save results"
                      : "Next question"
                    : "Check answer"}
                </ProcessButton>
              </form>
              <p className="mt-4 text-xs leading-5 text-stone-400">
                Answers match your saved definition, ignoring letter case and
                extra spaces. Use short, specific answers for the fairest
                results.
              </p>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
