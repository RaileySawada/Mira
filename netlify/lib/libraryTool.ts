export const libraryTool = {
  type: "function",
  function: {
    name: "organize_library",
    description:
      "Prepare local library changes only when explicitly requested. Create folders/topics, move (cut) or copy reviewers, change their topic, or rename them. Use exact full reviewer titles; sourceFolder disambiguates duplicates. Missing destination folders/topics will be created. Use Unfiled to remove folder placement. Changes are previewed for the user to apply, not executed yet. Never delete records. Ask for clarification if the target is unclear.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["actions"],
      properties: {
        actions: {
          type: "array",
          minItems: 1,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["kind"],
            properties: {
              kind: {
                type: "string",
                enum: [
                  "create_folder",
                  "create_topic",
                  "move_reviewer",
                  "copy_reviewer",
                  "set_topic",
                  "rename_reviewer",
                ],
              },
              name: { type: "string", maxLength: 150 },
              reviewer: { type: "string", maxLength: 150 },
              sourceFolder: { type: "string", maxLength: 150 },
              destination: { type: "string", maxLength: 150 },
            },
          },
        },
      },
    },
  },
};
