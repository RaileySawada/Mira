import type { StudyData } from "../../types/study";
import type { GeneratedReviewer } from "../../types/ai";
import { validText } from "../../utils/validation";

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
