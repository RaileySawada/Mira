import { useEffect, useState } from "react";
import { presenceConfigured } from "../config/firebase";
import type { PresenceState } from "../types/presence";
import { useOnline } from "./useOnline";

export function usePresence(enabled: boolean): PresenceState {
  const online = useOnline();
  const [state, setState] = useState<PresenceState>({
    status: "connecting",
    count: null,
  });
  useEffect(() => {
    if (!enabled || !online || !presenceConfigured) return;
    let disposed = false;
    let stop: (() => void) | undefined;
    void import("../services/presence")
      .then((service) => {
        if (disposed) return;
        stop = service.startPresence((next) => {
          if (!disposed) setState(next);
        });
      })
      .catch(() => {
        if (!disposed)
          setState({
            status: "unavailable",
            count: null,
            message: "Live count unavailable. Reconnect to try again.",
          });
      });
    return () => {
      disposed = true;
      stop?.();
    };
  }, [enabled, online]);
  if (!enabled) return { status: "disabled", count: null };
  if (!online) return { status: "offline", count: null };
  if (!presenceConfigured)
    return {
      status: "unavailable",
      count: null,
      message:
        "Online count is not configured for this release. Set the Firebase build environment variables in Netlify and redeploy.",
    };
  return state;
}
