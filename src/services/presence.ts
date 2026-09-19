import { signInAnonymously } from "firebase/auth";
import { goOffline, goOnline, onDisconnect, onValue, push, ref, remove, set } from "firebase/database";
import { presenceClients } from "../lib/firebase";
import type { PresenceState } from "../types/presence";

export function countConnections(value: unknown): number {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  return Object.values(value).filter(connections => connections && typeof connections === "object" && !Array.isArray(connections) && Object.values(connections).some(connected => connected === true)).length;
}

export function startPresence(notify: (state: PresenceState) => void): () => void {
  const { auth, database } = presenceClients();
  let stopped = false;
  let connected = false;
  let generation = 0;
  let count = 0;
  let ownRef: ReturnType<typeof ref> | undefined;
  const unsubscribe: (() => void)[] = [];
  const reportError = () => {
    if (!stopped) notify({ status: "unavailable", count: null, message: "Live count unavailable. Check Firebase Anonymous sign-in, database URL and presence rules." });
  };
  notify({ status: "connecting", count: null });
  async function connect() {
    await auth.authStateReady();
    if (stopped) return;
    const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
    if (stopped) return;
    goOnline(database);
    unsubscribe.push(onValue(ref(database, "presence"), snapshot => {
      count = countConnections(snapshot.val());
      if (connected && !stopped) notify({ status: "online", count });
    }, reportError));
    unsubscribe.push(onValue(ref(database, ".info/connected"), snapshot => {
      const connection = ++generation;
      connected = false;
      if (!snapshot.val()) {
        if (!stopped) notify({ status: "connecting", count: null });
        return;
      }
      const node = push(ref(database, "presence/" + user.uid));
      ownRef = node;
      // Register cleanup on the server BEFORE marking this connection online.
      void (async () => {
        await onDisconnect(node).remove();
        if (stopped || connection !== generation) return;
        await set(node, true);
        if (stopped || connection !== generation) { await remove(node); return; }
        connected = true;
        notify({ status: "online", count });
      })().catch(reportError);
    }, reportError));
  }
  void connect().catch(reportError);
  return () => {
    stopped = true;
    generation++;
    unsubscribe.forEach(stop => stop());
    // Disconnect also covers abrupt tab closure and interrupted cleanup writes.
    if (ownRef) void remove(ownRef).catch(() => { /* Server onDisconnect remains registered. */ });
    goOffline(database);
  };
}
