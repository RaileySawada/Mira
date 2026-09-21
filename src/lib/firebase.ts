import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { firebaseConfig } from "../config/firebase";

export function presenceClients() {
  const app =
    getApps().find((app) => app.name === "mira-presence") ??
    initializeApp(firebaseConfig, "mira-presence");
  return { auth: getAuth(app), database: getDatabase(app) };
}
