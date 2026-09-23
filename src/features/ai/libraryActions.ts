import type { LibraryAction } from "../../types/agent";
import type { StudyData } from "../../types/study";
import { isRecord, validText } from "../../utils/validation";

export function parseLibraryActions(value: unknown): LibraryAction[] {
  if (!Array.isArray(value) || !value.length || value.length > 10)
    throw new Error("Mira returned an invalid action list.");
  return value.map((action) => {
    if (!isRecord(action)) throw new Error("Invalid library action.");
    if (action.kind === "create_folder" || action.kind === "create_topic") {
      if (!validText(action.name, 150))
        throw new Error("Enter a valid folder or topic name.");
      return { kind: action.kind, name: action.name.trim() };
    }
    if (
      action.kind !== "move_reviewer" &&
      action.kind !== "copy_reviewer" &&
      action.kind !== "set_topic" &&
      action.kind !== "rename_reviewer"
    )
      throw new Error("Unsupported library action.");
    if (
      !validText(action.reviewer, 150) ||
      !validText(action.destination, 150) ||
      (action.sourceFolder !== undefined &&
        !validText(action.sourceFolder, 150))
    )
      throw new Error("Mira needs a reviewer and destination name.");
    return {
      kind: action.kind,
      reviewer: action.reviewer.trim(),
      destination: action.destination.trim(),
      ...(typeof action.sourceFolder === "string"
        ? { sourceFolder: action.sourceFolder.trim() }
        : {}),
    };
  });
}

const sameName = (a: string, b: string) =>
  a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

// Work on copies: a failed action never partially changes the saved library.
export function applyLibraryActions(
  data: StudyData,
  input: LibraryAction[],
): StudyData {
  const actions = parseLibraryActions(input);
  const next = {
    ...data,
    folders: [...(data.folders ?? [])],
    topics: [...data.topics],
    reviewers: [...data.reviewers],
  };
  const folderId = (name: string) => {
    if (sameName(name, "Unfiled")) return undefined;
    const matches = next.folders.filter((folder) =>
      sameName(folder.name, name),
    );
    if (matches.length > 1)
      throw new Error(
        `More than one folder is named “${name}”. Rename one first.`,
      );
    if (matches[0]) return matches[0].id;
    const folder = { id: crypto.randomUUID(), name };
    next.folders.push(folder);
    return folder.id;
  };
  const topicId = (name: string) => {
    const matches = next.topics.filter((topic) => sameName(topic.name, name));
    if (matches.length > 1)
      throw new Error(
        `More than one topic is named “${name}”. Rename one first.`,
      );
    if (matches[0]) return matches[0].id;
    const topic = { id: crypto.randomUUID(), name, color: "#8d80b5" };
    next.topics.push(topic);
    return topic.id;
  };
  for (const action of actions) {
    if (action.kind === "create_folder") {
      folderId(action.name);
      continue;
    }
    if (action.kind === "create_topic") {
      topicId(action.name);
      continue;
    }
    if (!("reviewer" in action)) continue;
    const matches = next.reviewers.filter(
      (reviewer) =>
        sameName(reviewer.title, action.reviewer) &&
        (!action.sourceFolder ||
          sameName(
            next.folders.find((folder) => folder.id === reviewer.folderId)
              ?.name ?? "Unfiled",
            action.sourceFolder,
          )),
    );
    if (matches.length !== 1)
      throw new Error(
        matches.length
          ? `“${action.reviewer}” matches several reviewers. Specify its source folder.`
          : `Could not find “${action.reviewer}”. Use its full saved title.`,
      );
    const reviewer = matches[0];
    const updated = { ...reviewer, updatedAt: new Date().toISOString() };
    if (action.kind === "move_reviewer" || action.kind === "copy_reviewer")
      updated.folderId = folderId(action.destination);
    if (action.kind === "set_topic")
      updated.topicId = topicId(action.destination);
    if (action.kind === "rename_reviewer") updated.title = action.destination;
    if (action.kind === "copy_reviewer")
      next.reviewers.push({
        ...updated,
        id: crypto.randomUUID(),
        cards: updated.cards.map((card) => ({
          ...card,
          id: crypto.randomUUID(),
        })),
      });
    else
      next.reviewers = next.reviewers.map((item) =>
        item.id === reviewer.id ? updated : item,
      );
  }
  return next;
}

export function describeLibraryAction(action: LibraryAction): string {
  if ("name" in action)
    return `${action.kind === "create_folder" ? "Create folder" : "Create topic"}: ${action.name}`;
  const verb = {
    move_reviewer: "Move",
    copy_reviewer: "Copy",
    set_topic: "Set topic for",
    rename_reviewer: "Rename",
  }[action.kind];
  return `${verb} “${action.reviewer}”${action.sourceFolder ? ` from “${action.sourceFolder}”` : ""} → ${action.destination}`;
}
