import type { QuizDraft } from "../../types/session";
import type { Card } from "../../types/study";
import { validateData, emptyData } from "../../services/storage";

export function parseQuizDraft(value: unknown): QuizDraft {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid quiz draft.");
  const v = value as Record<string, unknown>;
  if (
    typeof v.id !== "string" ||
    !v.id ||
    typeof v.title !== "string" ||
    typeof v.reviewerId !== "string" ||
    (v.mode !== "quiz" && v.mode !== "daily") ||
    (v.difficulty !== "normal" && v.difficulty !== "hard") ||
    typeof v.answer !== "string" ||
    v.answer.length > 20000 ||
    typeof v.checked !== "boolean" ||
    (v.answerWasVoice !== undefined && typeof v.answerWasVoice !== "boolean") ||
    typeof v.startedAt !== "string" ||
    !Number.isFinite(Date.parse(v.startedAt)) ||
    !Number.isInteger(v.index) ||
    !Array.isArray(v.cards) ||
    !v.cards.length ||
    v.cards.length > 10000 ||
    Number(v.index) < 0 ||
    Number(v.index) >= v.cards.length ||
    !Array.isArray(v.answers) ||
    v.answers.length !== Number(v.index) + Number(v.checked) ||
    !Number.isInteger(v.elapsedMs) ||
    Number(v.elapsedMs) < 0 ||
    Number(v.elapsedMs) > 604800000
  )
    throw new Error("Invalid quiz draft.");
  if (
    v.dueAtStart !== undefined &&
    (!Array.isArray(v.dueAtStart) ||
      v.dueAtStart.length > 100000 ||
      !v.dueAtStart.every(
        (c) =>
          c &&
          typeof c === "object" &&
          typeof c.reviewerId === "string" &&
          c.reviewerId &&
          typeof c.cardId === "string" &&
          c.cardId,
      ))
  )
    throw new Error("Invalid starting due queue.");
  const data = validateData({
    ...emptyData(),
    reviewers: [
      {
        id: "draft",
        title: v.title,
        description: "",
        topicId: "",
        updatedAt: v.startedAt,
        cards: v.cards.map((card, index) => {
          if (
            !card ||
            typeof card !== "object" ||
            typeof card.id !== "string" ||
            !card.id
          )
            throw new Error("Invalid draft card.");
          return { ...card, id: String(index) };
        }),
      },
    ],
    attempts: v.answers.length
      ? [
          {
            id: "draft",
            reviewerId: v.reviewerId,
            title: v.title,
            date: v.startedAt,
            mode: v.mode,
            total: v.answers.length,
            correct: v.answers.filter((a) => a?.correct === true).length,
            results: v.answers,
          },
        ]
      : [],
  });
  let answerPool: Card[] | undefined;
  if (v.answerPool !== undefined) {
    if (!Array.isArray(v.answerPool) || v.answerPool.length > 100000)
      throw new Error("Invalid draft answer pool.");
    answerPool = validateData({
      ...emptyData(),
      reviewers: [
        {
          id: "pool",
          title: "Pool",
          description: "",
          topicId: "",
          updatedAt: v.startedAt,
          cards: v.answerPool.map((c, index) => ({ ...c, id: String(index) })),
        },
      ],
    }).reviewers[0].cards;
  }
  const cards = data.reviewers[0].cards.map((card, index) => {
    const source = v.cards as Record<string, unknown>[];
    return {
      ...card,
      id: source[index].id as string,
      ...(typeof source[index].reviewerId === "string"
        ? { reviewerId: source[index].reviewerId as string }
        : {}),
    };
  });
  const results = data.attempts[0]?.results ?? [];
  if (
    results.some((result, index) => {
      const card = cards[index];
      return (
        result.cardId !== card.id ||
        result.question !== card.question ||
        result.expectedAnswer !== card.answer ||
        (result.reviewerId !== undefined &&
          result.reviewerId !== (card.reviewerId ?? v.reviewerId))
      );
    })
  )
    throw new Error("Quiz draft answers do not match its cards.");
  return {
    ...(v.dueAtStart
      ? {
          dueAtStart: (
            v.dueAtStart as { reviewerId: string; cardId: string }[]
          ).map((c) => ({ reviewerId: c.reviewerId, cardId: c.cardId })),
        }
      : {}),
    id: v.id,
    title: v.title,
    reviewerId: v.reviewerId,
    mode: v.mode,
    cards,
    difficulty: v.difficulty,
    index: Number(v.index),
    answers: (data.attempts[0]?.results ?? []).map((r) => ({
      ...r,
      answer: r.userAnswer,
    })),
    answer: v.answer,
    ...(v.answerWasVoice !== undefined
      ? { answerWasVoice: v.answerWasVoice as boolean }
      : {}),
    checked: v.checked,
    startedAt: v.startedAt,
    elapsedMs: Number(v.elapsedMs),
    answerPool: answerPool ?? cards,
  };
}
