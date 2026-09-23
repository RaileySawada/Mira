import type { ChatMessage } from "../../types/ai";
import type { GeneratedReviewer } from "../../types/ai";
import type { StudyData } from "../../types/study";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validText(value: unknown, maximum: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maximum
  );
}

export function parseReviewers(value: unknown): GeneratedReviewer[] {
  if (
    !isRecord(value) ||
    !Array.isArray(value.reviewers) ||
    value.reviewers.length < 1 ||
    value.reviewers.length > 5
  )
    throw new Error(
      "AI returned an invalid reviewer collection. Please try again.",
    );
  return value.reviewers.map((reviewer: unknown) => {
    if (
      !isRecord(reviewer) ||
      !validText(reviewer.title, 150) ||
      typeof reviewer.description !== "string" ||
      reviewer.description.length > 2000 ||
      !Array.isArray(reviewer.cards) ||
      reviewer.cards.length < 5 ||
      reviewer.cards.length > 10
    )
      throw new Error("AI returned an incomplete reviewer. Please try again.");
    return {
      title: reviewer.title.trim(),
      description: reviewer.description.trim(),
      cards: reviewer.cards.map((card: unknown) => {
        if (
          !isRecord(card) ||
          !validText(card.question, 2000) ||
          !validText(card.answer, 4000)
        )
          throw new Error(
            "AI returned an invalid flashcard. Please try again.",
          );
        return { question: card.question.trim(), answer: card.answer.trim() };
      }),
    };
  });
}

export function addGeneratedReviewers(
  data: StudyData,
  topicName: string,
  drafts: GeneratedReviewer[],
  folderName?: string,
): StudyData {
  if (folderName !== undefined && !validText(folderName, 150))
    throw new Error("Invalid folder name.");
  const matchingFolders = (data.folders ?? []).filter(
    (folder) =>
      folder.name.trim().toLowerCase() === folderName?.trim().toLowerCase(),
  );
  if (matchingFolders.length > 1)
    throw new Error(
      "That folder name is ambiguous. Rename one of the folders first.",
    );
  const folder = folderName
    ? (matchingFolders[0] ?? {
        id: crypto.randomUUID(),
        name: folderName.trim(),
      })
    : undefined;
  const existing = data.topics.find(
    (topic) => topic.name.toLowerCase() === topicName.trim().toLowerCase(),
  );
  const topic = existing || {
    id: crypto.randomUUID(),
    name: topicName.trim(),
    color: "#8d80b5",
  };
  return {
    ...data,
    ...(folder
      ? {
          folders: matchingFolders.length
            ? data.folders
            : [...(data.folders ?? []), folder],
        }
      : {}),
    topics: existing ? data.topics : [...data.topics, topic],
    reviewers: [
      ...data.reviewers,
      ...drafts.map((draft) => ({
        ...draft,
        id: crypto.randomUUID(),
        topicId: topic.id,
        ...(folder ? { folderId: folder.id } : {}),
        updatedAt: new Date().toISOString(),
        cards: draft.cards.map((card) => ({
          ...card,
          id: crypto.randomUUID(),
        })),
      })),
    ],
  };
}

export function parseHistory(value: unknown): ChatMessage[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 6)
    throw new Error("Invalid conversation history.");
  return value.map((message) => {
    if (
      !isRecord(message) ||
      (message.role !== "user" && message.role !== "assistant") ||
      !validText(message.content, 1800)
    )
      throw new Error("Invalid conversation message.");
    return { role: message.role, content: message.content };
  });
}
