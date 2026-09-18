import { useEffect, useRef, useState } from "react";
import { FOCUS_SECONDS } from "./achievements";

export function FocusTimer({ visible, onComplete }: { visible: boolean; onComplete: () => boolean }) {
  const [remaining, setRemaining] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const elapsed = useRef(0);
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      elapsed.current = Math.min(FOCUS_SECONDS * 1000, elapsed.current + now - last);
      last = now;
      const left = Math.ceil(FOCUS_SECONDS - elapsed.current / 1000);
      setRemaining(left);
      if (left === 0) setRunning(false);
    };
    const hide = () => { if (document.hidden) { tick(); setRunning(false); } };
    const timer = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", hide);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", hide); };
  }, [running]);
  if (!visible && !running && remaining === FOCUS_SECONDS) return null;
  return <section className="panel focus-timer" aria-label="Study focus timer">
    <div><h2>Focus Mode</h2><p>25 minutes for your next chapter. Pauses when you leave the app; resume when you’re ready.</p></div>
    <strong role="timer" aria-label="Time remaining">{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</strong>
    {remaining > 0 ? <button className="button secondary" onClick={() => setRunning(value => !value)}>{running ? "Pause timer" : remaining === FOCUS_SECONDS ? "Start focus timer" : "Resume timer"}</button> : <button className="button primary" disabled={saved} onClick={() => { const success = onComplete(); setSaved(success); setError(!success); }}>{saved ? "Focus badge saved ✓" : "Save completed timer"}</button>}
    {remaining < FOCUS_SECONDS && <button className="text-button" onClick={() => { setRunning(false); setRemaining(FOCUS_SECONDS); elapsed.current = 0; setSaved(false); setError(false); }}>Reset timer</button>}
    {error && <p role="alert">Could not save this timer. Please try again.</p>}
  </section>;
}
