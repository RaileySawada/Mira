export const reviewerTool = {
  type: "function",
  function: {
    name: "prepare_reviewers",
    description: "Prepare reviewer drafts only when the user asks to create reviewers, flashcards or study sets. Use conversation context. Ask for a topic if unclear. Drafts are previewed, never automatically saved. Prepare 1 to 5 reviewers, 5 to 10 cards each. Default to 5 cards unless the user requests more.",
    parameters: {
      type: "object", additionalProperties: false, required: ["topic", "reviewers"],
      properties: {
        topic: { type: "string", maxLength: 150 },
        reviewers: { type: "array", minItems: 1, maxItems: 5, items: {
          type: "object", additionalProperties: false, required: ["title", "description", "cards"],
          properties: {
            title: { type: "string", maxLength: 150 }, description: { type: "string", maxLength: 2000 },
            cards: { type: "array", minItems: 5, maxItems: 10, items: {
              type: "object", additionalProperties: false, required: ["question", "answer"],
              properties: { question: { type: "string", maxLength: 2000 }, answer: { type: "string", maxLength: 4000 } },
            } },
          },
        } },
      },
    },
  },
};
