import type { ChatMessage } from "../features/ai/schema";

export const AI_SESSION_KEY = "mira.ai.session.v1";
const MAX_MESSAGES = 40;

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as { role?: unknown; content?: unknown };
  return (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= 80000;
}

export function readAiSession(): ChatMessage[] {
  try {
    const saved = sessionStorage.getItem(AI_SESSION_KEY);
    if (!saved) return [];
    const messages: unknown = JSON.parse(saved);
    if (!Array.isArray(messages) || messages.length > MAX_MESSAGES || !messages.every(isChatMessage)) {
      clearAiSession();
      return [];
    }
    return messages;
  } catch {
    return [];
  }
}

export function saveAiSession(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(AI_SESSION_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch {
    // Session storage is optional. The open conversation remains available in memory.
  }
}

export function clearAiSession() {
  try {
    sessionStorage.removeItem(AI_SESSION_KEY);
  } catch {
    // Some browsers may block storage. There is no persistent session to remove.
  }
}
