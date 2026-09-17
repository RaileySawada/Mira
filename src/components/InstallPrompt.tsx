import { useEffect, useRef, useState } from "react";
import { ProcessButton } from "./ProcessButton";
import { useActionFeedback } from "../hooks/useActionFeedback";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
const SEEN_KEY = "mira.install-prompt.seen";
function installed() {
  return matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}
function seen() {
  try { return sessionStorage.getItem(SEEN_KEY) === "true"; } catch { return false; }
}
function appleMobile() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
export function InstallPrompt() {
  const [visible, setVisible] = useState(() => !installed() && !seen() && appleMobile());
  const [manual, setManual] = useState(false);
  const offered = useRef(visible);
  const event = useRef<InstallEvent | null>(null);
  const install = useActionFeedback();
  useEffect(() => {
    if (offered.current) {
      try { sessionStorage.setItem(SEEN_KEY, "true"); } catch { /* The mounted prompt still appears only once. */ }
    }
    const available = (incoming: Event) => {
      incoming.preventDefault();
      if (installed() || offered.current || seen()) return;
      offered.current = true;
      event.current = incoming as InstallEvent;
      try { sessionStorage.setItem(SEEN_KEY, "true"); } catch { /* Keep the in-memory guard when storage is blocked. */ }
      setVisible(true);
    };
    const complete = () => { event.current = null; setVisible(false); };
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", complete);
    return () => {
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);
  if (!visible) return null;
  return <aside className="install-prompt" role="region" aria-label="Install Mira">
    <div><strong>Keep Mira close.</strong><p>{manual ? "Open your browser’s Share menu, choose Add to Home Screen, then Add." : "Install Mira for quick access and offline studying."}</p>{install.error && <p role="alert">{install.error}</p>}</div>
    <div className="flex shrink-0 gap-2">
      <button className="button secondary" disabled={install.state === "loading"} onClick={() => setVisible(false)}>Not now</button>
      <ProcessButton label={manual ? "Got it" : "Install Mira"} state={install.state} onClick={() => {
        if (!event.current) { if (manual) setVisible(false); else setManual(true); return; }
        void install.run(async () => {
          const pending = event.current!;
          event.current = null;
          await pending.prompt();
          await pending.userChoice;
          setVisible(false);
        });
      }} />
    </div>
  </aside>;
}
