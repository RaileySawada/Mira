import { FAST_ANSWER_MS } from "../achievements/achievements";
import { makeChoices } from "./choices";
import { FlashcardPractice } from "./FlashcardPractice";
import { confirmAction } from "../../components/confirmAction";
import { ProcessButton } from "../../components/ProcessButton";
import { useActionFeedback } from "../../hooks/useActionFeedback";
import { useEffect, useRef, useState } from "react";
import type { Attempt, Card } from "../../types/study";
import { Modal } from "../../components/ui";
import { normalizeAnswer } from "../../utils/stats";
export interface Session {
  title: string;
  reviewerId: string;
  mode: "cards" | "quiz" | "daily";
  cards: Card[];
  answerPool?: Card[];
}
export function StudySession({
  session,
  onClose,
  onComplete,
  onPracticeComplete,
}: {
  session: Session;
  onClose: () => void;
  onComplete: (a: Attempt) => boolean;
  onPracticeComplete?: () => boolean;
}) {
  const questionStarted = useRef(0);
  const fastCorrect = useRef(false);
  const save = useActionFeedback();
  const [choices] = useState(() => session.mode === "cards" ? [] : session.cards.map(card => makeChoices(card, session.answerPool ?? session.cards)));
  const canChoose = choices.every(options => options.length >= 2);
  const [difficulty, setDifficulty] = useState<"normal" | "hard">(canChoose ? "normal" : "hard");
  const [index, setIndex] = useState(0);
  useEffect(() => { questionStarted.current = performance.now(); }, [index]);
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
          difficulty,
          fastCorrect: fastCorrect.current,
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
          {index === 0 && !checked && <div className="quiz-mode-picker" aria-label="Quiz difficulty">
            <button type="button" disabled={!canChoose} aria-pressed={difficulty === "normal"} onClick={() => { setDifficulty("normal"); setAnswer(""); }}>Normal · Multiple choice</button>
            <button type="button" aria-pressed={difficulty === "hard"} onClick={() => { setDifficulty("hard"); setAnswer(""); }}>Hard · Written recall</button>
          </div>}
          {!canChoose && index === 0 && !checked && <p className="mb-4 text-xs text-stone-500">Add at least two different answers to this reviewer to unlock multiple choice. You can practice written recall now.</p>}
          <div className="mb-4 flex justify-between text-xs text-stone-500">
            <span>
              {session.mode === "daily"
                  ? "DAILY REVIEW"
                  : difficulty === "normal" ? "MULTIPLE CHOICE" : "WRITTEN QUIZ"}
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
            <FlashcardPractice cards={session.cards} onClose={onClose} onComplete={onPracticeComplete} />
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
                  if (normalizeAnswer(answer) === normalizeAnswer(card.answer) && performance.now() - questionStarted.current <= FAST_ANSWER_MS) fastCorrect.current = true;
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
                {difficulty === "normal" ? <fieldset className="quiz-options" disabled={checked}>
                  <legend className="mb-3 text-sm">Choose your answer</legend>
                  {choices[index].map((option, i) => <label key={option} className={"quiz-option " + (answer === option ? "selected" : "")}>
                    <input type="radio" name="quiz-answer" value={option} checked={answer === option} onChange={() => setAnswer(option)} required />
                    <span className="quiz-option-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span><span>{option}</span>
                  </label>)}
                </fieldset> : <label className="field">
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
                </label>}
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
                {difficulty === "normal" ? "Options come from saved definitions in your study set. Everything works offline." : "Answers match your saved definition, ignoring letter case and extra spaces. Use short, specific answers for the fairest results."}
              </p>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
