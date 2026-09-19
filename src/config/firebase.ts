export interface PresenceConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  databaseURL: string;
}
declare const __MIRA_FIREBASE_CONFIG__: PresenceConfig;
export const firebaseConfig: PresenceConfig = typeof __MIRA_FIREBASE_CONFIG__ === "undefined"
  ? { apiKey: "", authDomain: "", projectId: "", appId: "", databaseURL: "" }
  : __MIRA_FIREBASE_CONFIG__;
export const presenceConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.databaseURL);
