import type { PresenceState } from "../types/presence";
export function OnlineCount({ presence }: { presence?: PresenceState }) {
  if (!presence || presence.status === "disabled" || presence.status === "offline") return null;
  const available = presence.status === "online";
  return <div className={"online-count " + (available ? "is-online" : "")} role="status" title={presence.message ?? "Connected browsers right now. Tabs in the same browser count once; separate devices count separately."}>
    <span aria-hidden="true" className="online-count-dot" />
    <span>{available ? (presence.count ?? 0).toLocaleString() + " online" : presence.status === "connecting" ? "Connecting…" : "Count unavailable"}</span>
  </div>;
}
