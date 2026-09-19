import type { StudyOverview } from "../features/ai/studyOverview";
import { isRecord, type ChatMessage } from "../features/ai/schema";

export interface AiRequest {
  mode: "chat" | "generate";
  prompt: string;
  topic: string;
  count: number;
  cardsPerReviewer?: number;
  history?: ChatMessage[];
  overview?: StudyOverview;
}

export async function requestAi(input: AiRequest, signal: AbortSignal): Promise<unknown> {
  if (!navigator.onLine) throw new Error("You are offline. Saved reviewers are still available.");
  const response = await fetch("/.netlify/functions/ai", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input), signal, cache: "no-store",
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(response.status === 429 ? "Too many requests. Please try again in a minute." : "AI requires a Netlify deployment or Netlify Dev.");
  const result: unknown = await response.json();
  if (!response.ok) throw new Error(isRecord(result) && typeof result.error === "string" ? result.error : "AI is unavailable. Please try again.");
  return result;
}
