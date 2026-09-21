import {
  useEffect,
  useLayoutEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import type { Card } from "../../types/study";

export function FlashcardPractice({
  cards,
  onClose,
  onComplete,
  onRate,
  mastery,
}: {
  cards: Card[];
  mastery?: string[];
  onClose: () => void;
  onComplete?: () => boolean | Promise<boolean>;
  onRate?: (card: Card, known: boolean) => boolean | Promise<boolean>;
}) {
  const saved = useRef(false);
  const savingRating = useRef(false);
  const [saveError, setSaveError] = useState("");
  async function savePractice() {
    if (saved.current) return true;
    const success = (await onComplete?.()) ?? true;
    if (success) saved.current = true;
    return success;
  }
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const cardElement = useRef<HTMLButtonElement>(null);
  const animation = useRef<Animation | null>(null);
  const busy = useRef(false);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const lastSwipe = useRef(0);
  const card = cards[index];
  function resetDrag() {
    const element = cardElement.current;
    if (!element) return;
    element.style.transform = "";
    element.style.removeProperty("--swipe-known");
    element.style.removeProperty("--swipe-unknown");
  }
  function move(next: number) {
    if (busy.current || savingRating.current) return;
    resetDrag();
    setIndex(next);
    setFlipped(false);
  }
  useEffect(
    () => () => {
      animation.current?.cancel();
    },
    [],
  );
  useLayoutEffect(() => {
    if (
      finished ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const entrance = cardElement.current?.animate?.(
      [
        { transform: "scale(.985)", opacity: 0.45 },
        { transform: "scale(1)", opacity: 1 },
      ],
      { duration: 280, easing: "cubic-bezier(.16,1,.3,1)" },
    );
    animation.current = entrance ?? null;
    return () => entrance?.cancel();
  }, [index, finished]);
  function settle() {
    if (busy.current) return;
    const element = cardElement.current;
    if (!element) return;
    const from = element.style.transform || "none";
    resetDrag();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      animation.current = element.animate?.(
        [{ transform: from }, { transform: "none" }],
        { duration: 240, easing: "cubic-bezier(.2,.9,.3,1.15)" },
      );
  }
  function rate(known: boolean) {
    if (busy.current) return;
    const element = cardElement.current;
    if (
      !element?.animate ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      finishRating(known);
      return;
    }
    animation.current?.cancel();
    busy.current = true;
    const distance =
      (window.innerWidth + element.offsetWidth) * (known ? 1 : -1);
    animation.current = element.animate(
      [
        { transform: element.style.transform || "none", opacity: 1 },
        {
          transform:
            "translateX(" +
            distance +
            "px) rotate(" +
            (known ? 20 : -20) +
            "deg)",
          opacity: 0,
        },
      ],
      { duration: 240, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" },
    );
    if (!animation.current) {
      busy.current = false;
      resetDrag();
      finishRating(known);
      return;
    }
    animation.current.onfinish = () => {
      const exit = animation.current;
      animation.current = null;
      busy.current = false;
      resetDrag();
      void finishRating(known).finally(() => exit?.cancel());
    };
  }
  async function finishRating(known: boolean) {
    if (savingRating.current) return;
    savingRating.current = true;
    setSaveError("");
    try {
      if (onRate && !(await onRate(card, known))) {
        setSaveError("Could not save this rating. Please try again.");
        return;
      }
      if (index === cards.length - 1) {
        if (await savePractice())
          flushSync(() => {
            setRatings((current) => ({ ...current, [index]: known }));
            setFinished(true);
          });
      } else
        flushSync(() => {
          setRatings((current) => ({ ...current, [index]: known }));
          setIndex(index + 1);
          setFlipped(false);
        });
    } finally {
      savingRating.current = false;
    }
  }
  const keyPressed = useEffectEvent((event: KeyboardEvent) => {
    if (
      busy.current ||
      finished ||
      event.repeat ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.matches("input, textarea, select") || target.isContentEditable)
    )
      return;
    const dialog = root.current?.closest("dialog");
    if (
      !dialog ||
      document.querySelectorAll("dialog[open]").length > 1 ||
      (target instanceof HTMLElement && !dialog.contains(target))
    )
      return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      rate(false);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      rate(true);
    }
    if (event.code === "Space" || event.key === " ") {
      event.preventDefault();
      setFlipped((value) => !value);
    }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyPressed(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  if (finished)
    return (
      <div className="practice-summary">
        <h3 className="text-2xl font-semibold">Practice complete.</h3>
        <p className="mt-3">
          {Object.values(ratings).filter(Boolean).length} known ·{" "}
          {Object.values(ratings).filter((value) => !value).length} to practice
        </p>
        <p className="mt-3 text-sm text-stone-500">
          Your ratings schedule your next review. Completing practice counts
          toward your study streak.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="button secondary"
            onClick={() => {
              setRatings({});
              move(0);
              setFinished(false);
            }}
          >
            Practice again
          </button>
          <button className="button primary" onClick={onClose}>
            Back to learning
          </button>
        </div>
      </div>
    );
  return (
    <div ref={root} className="flashcard-practice">
      {saveError && <p role="alert">{saveError}</p>}
      <div className="mb-4 flex justify-between text-xs text-stone-500">
        <span>
          FLASHCARD PRACTICE{mastery?.[index] ? " · " + mastery[index] : ""}
        </span>
        <span>
          {index + 1} / {cards.length}
        </span>
      </div>
      <div className="study-card-stage">
        <button
          ref={cardElement}
          className={"study-card " + (flipped ? "is-flipped" : "")}
          aria-pressed={flipped}
          aria-label={
            (flipped
              ? "Answer: " + card.answer
              : "Question: " + card.question) +
            ". Click to " +
            (flipped ? "see question" : "reveal answer")
          }
          onClick={() => {
            if (!busy.current && Date.now() - lastSwipe.current > 350)
              setFlipped((value) => !value);
          }}
          onTouchStart={(event) => {
            if (!busy.current) animation.current?.cancel();
            if (!busy.current && event.touches.length === 1)
              gesture.current = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
              };
            else {
              gesture.current = null;
              settle();
            }
          }}
          onTouchMove={(event) => {
            const start = gesture.current;
            const element = cardElement.current;
            if (
              !start ||
              !element ||
              busy.current ||
              event.touches.length !== 1
            )
              return;
            const dx = event.touches[0].clientX - start.x;
            const dy = event.touches[0].clientY - start.y;
            if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
            lastSwipe.current = Date.now();
            element.style.transform =
              "translateX(" +
              dx +
              "px) rotate(" +
              Math.max(-14, Math.min(14, dx / 18)) +
              "deg)";
            element.style.setProperty(
              "--swipe-known",
              String(Math.min(1, Math.max(0, dx / 65))),
            );
            element.style.setProperty(
              "--swipe-unknown",
              String(Math.min(1, Math.max(0, -dx / 65))),
            );
          }}
          onTouchCancel={() => {
            gesture.current = null;
            settle();
          }}
          onTouchEnd={(event) => {
            const start = gesture.current;
            gesture.current = null;
            if (!start || !event.changedTouches.length) return;
            const dx = event.changedTouches[0].clientX - start.x;
            const dy = event.changedTouches[0].clientY - start.y;
            if (Math.abs(dx) >= 65 && Math.abs(dx) > Math.abs(dy) * 1.5) {
              lastSwipe.current = Date.now();
              rate(dx > 0);
            } else settle();
          }}
        >
          <span className="swipe-label swipe-unknown" aria-hidden="true">
            Practice again
          </span>
          <span className="swipe-label swipe-known" aria-hidden="true">
            I know this
          </span>
          <span key={index} className="study-card-inner">
            <span className="study-card-face study-card-front">
              <span className="eyebrow mb-6">QUESTION</span>
              <span className="study-card-copy">{card.question}</span>
              <span className="study-card-hint">
                Tap or press Space to reveal
              </span>
            </span>
            <span className="study-card-face study-card-back">
              <span className="eyebrow mb-6">ANSWER</span>
              <span className="study-card-copy">{card.answer}</span>
              <span className="study-card-hint">
                Tap or press Space to flip
              </span>
            </span>
          </span>
        </button>
      </div>
      <div className="practice-ratings">
        <button className="button secondary" onClick={() => rate(false)}>
          ← I don’t know
        </button>
        <button className="button primary" onClick={() => rate(true)}>
          I know →
        </button>
      </div>
      <p className="text-center text-xs text-stone-500">
        Swipe left or right, or use the arrow keys. Tap or Space flips the card.
      </p>
      <div className="mt-4 flex justify-between">
        <button
          className="text-button"
          disabled={index === 0}
          onClick={() => move(index - 1)}
        >
          Previous
        </button>
        <button
          className="text-button"
          onClick={async () => {
            if (!busy.current) {
              if (index === cards.length - 1) {
                if (await savePractice()) onClose();
              } else move(index + 1);
            }
          }}
        >
          {index === cards.length - 1 ? "Finish practice" : "Next card"}
        </button>
      </div>
    </div>
  );
}
