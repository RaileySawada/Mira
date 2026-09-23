export type LibraryAction =
  | { kind: "create_folder" | "create_topic"; name: string }
  | {
      kind: "move_reviewer" | "copy_reviewer" | "set_topic" | "rename_reviewer";
      reviewer: string;
      sourceFolder?: string;
      destination: string;
    };
