import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { Card } from "../../types/study";

export function FlashcardPractice({ cards, onClose }: { cards: Card[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const lastSwipe = useRef(0);
  const card = cards[index];
  function move(next: number) { setIndex(next); setFlipped(false); }
  function rate(known: boolean) {
    setRatings(current => ({ ...current, [index]: known }));
    if (index === cards.length - 1) setFinished(true);
    else move(index + 1);
  }
  const keyPressed = useEffectEvent((event: KeyboardEvent) => {
    if (finished || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable)) return;
    const dialog = root.current?.closest("dialog");
    if (!dialog || document.querySelectorAll("dialog[open]").length > 1 || (target instanceof HTMLElement && !dialog.contains(target))) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); rate(false); }
    if (event.key === "ArrowRight") { event.preventDefault(); rate(true); }
    if (event.code === "Space" || event.key === " ") { event.preventDefault(); setFlipped(value => !value); }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyPressed(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  if (finished) return <div className="practice-summary">
    <h3 className="text-2xl font-semibold">Practice complete.</h3>
    <p className="mt-3">{Object.values(ratings).filter(Boolean).length} known · {Object.values(ratings).filter(value => !value).length} to practice</p>
    <p className="mt-3 text-sm text-stone-500">These are your self-ratings for this session. Take a quiz to record accuracy and your streak.</p>
    <div className="mt-6 flex flex-wrap gap-3"><button className="button secondary" onClick={() => { setRatings({}); move(0); setFinished(false); }}>Practice again</button><button className="button primary" onClick={onClose}>Back to learning</button></div>
  </div>;
  return <div ref={root} className="flashcard-practice">
    <div className="mb-4 flex justify-between text-xs text-stone-500"><span>FLASHCARD PRACTICE</span><span>{index + 1} / {cards.length}</span></div>
    <button className={"study-card " + (flipped ? "is-flipped" : "")} aria-pressed={flipped}
      aria-label={(flipped ? "Answer: " + card.answer : "Question: " + card.question) + ". Click to " + (flipped ? "see question" : "reveal answer")}
      onClick={() => { if (Date.now() - lastSwipe.current > 350) setFlipped(value => !value); }}
      onTouchStart={event => { if (event.touches.length === 1) gesture.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; else gesture.current = null; }}
      onTouchCancel={() => { gesture.current = null; }}
      onTouchEnd={event => {
        const start = gesture.current;
        gesture.current = null;
        if (!start || !event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - start.x;
        const dy = event.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) >= 65 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          lastSwipe.current = Date.now();
          rate(dx > 0);
        }
      }}>
      <span className="study-card-inner">
        <span className="study-card-face study-card-front"><span className="eyebrow mb-6">QUESTION</span><span className="study-card-copy">{card.question}</span><span className="study-card-hint">Tap or press Space to reveal</span></span>
        <span className="study-card-face study-card-back"><span className="eyebrow mb-6">ANSWER</span><span className="study-card-copy">{card.answer}</span><span className="study-card-hint">Tap or press Space to flip</span></span>
      </span>
    </button>
    <div className="practice-ratings"><button className="button secondary" onClick={() => rate(false)}>← I don’t know</button><button className="button primary" onClick={() => rate(true)}>I know →</button></div>
    <p className="text-center text-xs text-stone-500">Swipe left or right, or use the arrow keys. Tap or Space flips the card.</p>
    <div className="mt-4 flex justify-between"><button className="text-button" disabled={index === 0} onClick={() => move(index - 1)}>Previous</button><button className="text-button" onClick={() => index === cards.length - 1 ? onClose() : move(index + 1)}>{index === cards.length - 1 ? "Finish practice" : "Next card"}</button></div>
  </div>;
}
