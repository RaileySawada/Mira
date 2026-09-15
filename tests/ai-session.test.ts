import { AI_SESSION_KEY, clearAiSession, readAiSession, saveAiSession } from "../src/services/aiSession";

test("keeps a valid Mira transcript for the current tab", () => {
  saveAiSession([{ role: "user", content: "What is a cell?" }, { role: "assistant", content: "A cell is a basic unit of life." }]);
  expect(readAiSession()).toEqual([{ role: "user", content: "What is a cell?" }, { role: "assistant", content: "A cell is a basic unit of life." }]);
});

test("removes malformed or closed sessions", () => {
  sessionStorage.setItem(AI_SESSION_KEY, "not json");
  expect(readAiSession()).toEqual([]);
  saveAiSession([{ role: "user", content: "Keep this briefly." }]);
  clearAiSession();
  expect(sessionStorage.getItem(AI_SESSION_KEY)).toBeNull();
});
