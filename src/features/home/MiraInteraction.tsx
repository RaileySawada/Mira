import { useEffect, useState } from "react";
import type { MiraMessage } from "../../types/learning";

export function MiraInteraction({ messages }: { messages: MiraMessage[] }) {
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const message = messages[index];
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visibility = () => setHidden(document.hidden);
    const motion = () => setReduced(media.matches);
    document.addEventListener("visibilitychange", visibility);
    media.addEventListener("change", motion);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", motion);
    };
  }, []);
  useEffect(() => {
    if (!message || hidden) return;
    if (!reduced && count < message.text.length) {
      const timer = window.setTimeout(
        () => setCount((value) => Math.min(message.text.length, value + 2)),
        35,
      );
      return () => window.clearTimeout(timer);
    }
    if (index < messages.length - 1) {
      const timer = window.setTimeout(() => {
        setIndex((value) => value + 1);
        setCount(0);
      }, 4500);
      return () => window.clearTimeout(timer);
    }
  }, [count, index, messages.length, message, hidden, reduced]);
  if (!message) return null;
  const typing = !reduced && count < message.text.length;
  return (
    <div className="mira-welcome-scene">
      <img
        src={"/expressions/" + message.mood + ".webp"}
        alt={"Mira looks " + message.mood}
        width={160}
        height={160}
        fetchPriority="high"
      />
      <div className="mira-speech">
        <p className="mira-speech-name">Mira</p>
        <h2 id="mira-greeting" aria-label={message.text}>
          <span className="mira-message-space" aria-hidden="true">
            {message.text}
          </span>
          <span className="mira-message-typed" aria-hidden="true">
            {reduced ? message.text : message.text.slice(0, count)}
            {typing && <span className="mira-type-cursor">|</span>}
          </span>
        </h2>
        <span className="sr-only" role="status">
          {!typing ? message.text : ""}
        </span>
      </div>
    </div>
  );
}
