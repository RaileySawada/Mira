export interface PresenceState {
  status: "connecting" | "online" | "offline" | "unavailable" | "disabled";
  count: number | null;
  message?: string;
}

export interface PresenceConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  databaseURL: string;
}
