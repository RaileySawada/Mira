export interface PresenceState {
  status: "connecting" | "online" | "offline" | "unavailable" | "disabled";
  count: number | null;
  message?: string;
}
