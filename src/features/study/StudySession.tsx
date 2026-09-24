import type { PracticeResult } from "../../types/session";
import type { Session } from "../../types/session";
import type { QuizDraft } from "../../types/session";

import { persistActiveDraft } from "../../services/storageRuntime";
import { VoiceStudy } from "./VoiceStudy";
import { matchesAnswer } from "../learning/answers";
import type { QuestionResult } from "../../types/study";
import { FAST_ANSWER_MS } from "../../config/learning";

import { makeChoices } from "./choices";
import { FlashcardPractice } from "./FlashcardPractice";
import { confirmAction } from "../../components/confirmAction";
import { ProcessButton } from "../../components/ProcessButton";
import { useActionFeedback } from "../../hooks/useActionFeedback";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Attempt, Card } from "../../types/study";
import { Modal } from "../../components/ui";
import { normalizeAnswer } from "../../utils/stats";

export function StudySession({
  session,
  onClose,
  onComplete,
  onPracticeComplete,
  onRate,
  mastery,
}: {
  session: Session;
  mastery?: string[];
  onClose: () => void;
  onComplete: (a: Attempt) => boolean | Promise<boolean>;
  onPracticeComplete?: (
    results: PracticeResult[],
  ) => boolean | Promise<boolean>;
  onRate?: (card: Card, known: boolean) => boolean | Promise<boolean>;
}) {
  const voiceAnswer = useRef(session.resume?.answerWasVoice ?? false);
  const questionStarted = useRef(0);
  const fastCorrect = useRef(
    session.resume?.answers.some(
      (answer) => answer.correct && answer.durationMs <= FAST_ANSWER_MS,
    ) ?? false,
  );
  const save = useActionFeedback();
  const [choicePool] = useState(() =>
    session.mode === "cards"
      ? []
      : [
          ...new Map(
            (session.answerPool ?? session.cards).map((card) => [
              normalizeAnswer(card.answer),
              card,
            ]),
          ).values(),
        ],
  );
  const canChoose = choicePool.length >= 2;
  const [difficulty, setDifficulty] = useState<"normal" | "hard">(
    session.resume?.difficulty ?? (canChoose ? "normal" : "hard"),
  );
  const [index, setIndex] = useState(session.resume?.index ?? 0);
  useEffect(() => {
    questionStarted.current = performance.now();
  }, [index]);
  const [answer, setAnswer] = useState(session.resume?.answer ?? "");
  const [answers, setAnswers] = useState<
    (QuestionResult & { answer: string })[]
  >(session.resume?.answers ?? []);
  const [checked, setChecked] = useState(session.resume?.checked ?? false);
  const [complete, setComplete] = useState(false);
  const [attemptId] = useState(() => session.resume?.id ?? crypto.randomUUID());
  const [startedAt] = useState(
    () => session.resume?.startedAt ?? new Date().toISOString(),
  );
  const [draftError, setDraftError] = useState("");
  const completed = useRef(false);
  const elapsedOffset =
    index === session.resume?.index ? session.resume.elapsedMs : 0;
  const draft = useRef<QuizDraft | undefined>(undefined);
  useEffect(() => {
    if (session.mode === "cards" || complete || completed.current) return;
    draft.current = {
      dueAtStart: session.dueAtStart,
      id: attemptId,
      title: session.title,
      reviewerId: session.reviewerId,
      mode: session.mode,
      cards: session.cards,
      answerPool: session.answerPool,
      difficulty,
      index,
      answers,
      answer,
      answerWasVoice: voiceAnswer.current,
      checked,
      startedAt,
      elapsedMs: Math.min(
        604800000,
        elapsedOffset + Math.round(performance.now() - questionStarted.current),
      ),
    };
    const saveDraft = () => {
      if (completed.current || !draft.current) return;
      draft.current.elapsedMs = Math.min(
        604800000,
        elapsedOffset + Math.round(performance.now() - questionStarted.current),
      );
      void persistActiveDraft(draft.current).catch(() =>
        setDraftError(
          "Could not save your unfinished quiz. Keep this page open and try again.",
        ),
      );
    };
    const timer = window.setTimeout(saveDraft, 250);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveDraft();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", saveDraft);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", saveDraft);
    };
  }, [
    session,
    complete,
    attemptId,
    difficulty,
    index,
    answers,
    answer,
    checked,
    startedAt,
    elapsedOffset,
  ]);
  const card = session.cards[index];
  const choices = useMemo(
    () =>
      makeChoices(
        card,
        Array.from(
          { length: Math.min(4, choicePool.length) },
          (_, offset) => choicePool[(index * 3 + offset) % choicePool.length],
        ),
      ),
    [card, choicePool, index],
  );
  const score = answers.filter((a) => a.correct).length;
  async function close() {
    if (
      complete ||
      save.state === "success" ||
      session.mode === "cards" ||
      (await confirmAction(
        "Pause this quiz? Your unfinished answers will be saved so you can continue later.",
      ))
    ) {
      if (!complete && !completed.current && session.mode !== "cards") {
        try {
          if (draft.current) {
            draft.current.elapsedMs = Math.min(
              604800000,
              elapsedOffset +
                Math.round(performance.now() - questionStarted.current),
            );
          }
          await persistActiveDraft(draft.current);
        } catch {
          setDraftError(
            "Could not save this quiz. Keep it open and try again.",
          );
          return;
        }
      }
      onClose();
    }
  }
  function next() {
    if (index === session.cards.length - 1) {
      void save.run(
        async () => {
          const saved = await onComplete({
            id: attemptId,
            reviewerId: session.reviewerId,
            title: session.title,
            date: new Date().toISOString(),
            correct: score,
            total: session.cards.length,
            mode: session.mode === "daily" ? "daily" : "quiz",
            difficulty,
            fastCorrect: fastCorrect.current,
            results: answers.map(({ answer: _answer, ...result }) => result),
          });
          if (!saved) return false;
          completed.current = true;
          await persistActiveDraft(undefined);
          return true;
        },
        () => setComplete(true),
      );
    } else {
      voiceAnswer.current = false;
      setIndex(index + 1);
      setAnswer("");
      setChecked(false);
    }
  }
  return (
    <Modal title={session.title} onClose={close} className="study-modal">
      {draftError && <p role="alert">{draftError}</p>}
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
          {session.mode !== "cards" && (
            <>
              {index === 0 && !checked && (
                <div className="quiz-mode-picker" aria-label="Quiz difficulty">
                  <button
                    type="button"
                    disabled={!canChoose}
                    aria-pressed={difficulty === "normal"}
                    onClick={() => {
                      voiceAnswer.current = false;
                      setDifficulty("normal");
                      setAnswer("");
                    }}
                  >
                    Normal · Multiple choice
                  </button>
                  <button
                    type="button"
                    aria-pressed={difficulty === "hard"}
                    onClick={() => {
                      voiceAnswer.current = false;
                      setDifficulty("hard");
                      setAnswer("");
                    }}
                  >
                    Hard · Written recall
                  </button>
                </div>
              )}
              {!canChoose && index === 0 && !checked && (
                <p className="mb-4 text-xs text-stone-500">
                  Add at least two different answers to this reviewer to unlock
                  multiple choice. You can practice written recall now.
                </p>
              )}
              <div className="mb-4 flex justify-between text-xs text-stone-500">
                <span>
                  {session.mode === "daily"
                    ? "DAILY REVIEW"
                    : difficulty === "normal"
                      ? "MULTIPLE CHOICE"
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
            </>
          )}
          {session.mode === "cards" ? (
            <FlashcardPractice
              cards={session.cards}
              onClose={onClose}
              onComplete={onPracticeComplete}
              onRate={onRate}
              mastery={mastery}
            />
          ) : (
            <>
              <h3 className="mb-6 whitespace-pre-wrap text-xl leading-8">
                {card.question}
              </h3>
              {difficulty === "hard" && (
                <VoiceStudy
                  question={card.question}
                  answer={answer}
                  onAnswer={(text) => {
                    voiceAnswer.current ||=
                      Boolean(text.trim()) && text.trim() !== answer.trim();
                    setAnswer(text);
                  }}
                  disabled={checked}
                />
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (checked) {
                    next();
                    return;
                  }
                  if (!answer.trim()) return;
                  if (
                    matchesAnswer(answer, card) &&
                    performance.now() -
                      questionStarted.current +
                      elapsedOffset <=
                      FAST_ANSWER_MS
                  )
                    fastCorrect.current = true;
                  setAnswers([
                    ...answers,
                    {
                      voice: difficulty === "hard" && voiceAnswer.current,
                      answer: answer.trim(),
                      correct: matchesAnswer(answer, card),
                      cardId: card.id,
                      reviewerId:
                        (card as Card & { reviewerId?: string }).reviewerId ??
                        session.reviewerId,
                      question: card.question,
                      expectedAnswer: card.answer,
                      userAnswer: answer.trim(),
                      durationMs: Math.max(
                        0,
                        Math.round(
                          performance.now() -
                            questionStarted.current +
                            elapsedOffset,
                        ),
                      ),
                    },
                  ]);
                  setChecked(true);
                }}
              >
                {difficulty === "normal" ? (
                  <fieldset className="quiz-options" disabled={checked}>
                    <legend className="mb-3 text-sm">Choose your answer</legend>
                    {choices.map((option, i) => (
                      <label
                        key={option}
                        className={
                          "quiz-option " + (answer === option ? "selected" : "")
                        }
                      >
                        <input
                          type="radio"
                          name="quiz-answer"
                          value={option}
                          checked={answer === option}
                          onChange={() => setAnswer(option)}
                          required
                        />
                        <span className="quiz-option-letter" aria-hidden="true">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{option}</span>
                      </label>
                    ))}
                  </fieldset>
                ) : (
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
                )}
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
                {save.error && (
                  <p role="alert" className="mt-4 text-sm text-red-600">
                    {save.error}
                  </p>
                )}
                <ProcessButton
                  className="button primary mt-5 w-full"
                  state={save.state}
                  successLabel="Saved"
                  label={
                    checked
                      ? index === session.cards.length - 1
                        ? "Finish & save results"
                        : "Next question"
                      : "Check answer"
                  }
                >
                  {checked
                    ? index === session.cards.length - 1
                      ? "Finish & save results"
                      : "Next question"
                    : "Check answer"}
                </ProcessButton>
              </form>
              <p className="mt-4 text-xs leading-5 text-stone-400">
                {difficulty === "normal"
                  ? "Options come from saved definitions in your study set. Everything works offline."
                  : "Answers match your saved definition, accepting saved alternatives and harmless punctuation or spacing differences. Use short, specific answers for the fairest results."}
              </p>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
