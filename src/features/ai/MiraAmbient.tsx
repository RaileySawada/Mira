import { useEffect, useState } from "react";
import type { MiraMood } from "../../types/learning";
import "./MiraAmbient.css";

export function MiraAmbient({ mood }: { mood: MiraMood }) {
  const [paused, setPaused] = useState(() => document.hidden);
  useEffect(() => {
    const update = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return (
    <div className="mira-ambient" data-mood={mood} data-paused={paused} aria-hidden="true">
      {(["normal", "thinking", "happy", "amazed", "sad"] as const).map(tone => (
        <div key={tone} className="mira-ambient-palette" data-tone={tone} data-active={tone === mood}>
          <span /><span />
        </div>
      ))}
    </div>
  );
}
