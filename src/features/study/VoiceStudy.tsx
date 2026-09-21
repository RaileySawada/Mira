import { useEffect, useEffectEvent, useState } from "react";
import { useVoiceInput } from "../../hooks/useVoiceInput";
export function VoiceStudy({
  question,
  answer,
  onAnswer,
  disabled,
}: {
  question: string;
  answer: string;
  onAnswer: (text: string) => void;
  disabled: boolean;
}) {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const voice = useVoiceInput(onAnswer);
  const stopRecognition = useEffectEvent(() => voice.stop());
  useEffect(() => {
    stopRecognition();
  }, [question, disabled]);
  const canSpeak =
    typeof speechSynthesis !== "undefined" &&
    typeof SpeechSynthesisUtterance !== "undefined";
  function repeat() {
    voice.stop();
    if (canSpeak) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.lang = navigator.language;
      speechSynthesis.speak(utterance);
    }
  }
  useEffect(() => {
    if (active && !paused && canSpeak && !disabled) {
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(question));
    }
    return () => {
      if (canSpeak) speechSynthesis.cancel();
    };
  }, [question, active, paused, canSpeak, disabled]);
  return (
    <section className="panel mb-4 p-3" aria-label="Voice study mode">
      <div className="flex flex-wrap gap-2">
        {!active ? (
          <button
            type="button"
            className="button secondary"
            disabled={disabled}
            onClick={() => {
              setActive(true);
              setPaused(false);
            }}
          >
            Start voice study
          </button>
        ) : (
          <>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                voice.stop();
                if (canSpeak) speechSynthesis.cancel();
                setPaused(!paused);
              }}
            >
              {paused ? "Resume voice" : "Pause voice"}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                voice.stop();
                if (canSpeak) speechSynthesis.cancel();
                setActive(false);
              }}
            >
              Stop voice study
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={paused || disabled || !canSpeak}
              onClick={repeat}
            >
              Repeat question
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={
                paused || disabled || !voice.supported || !navigator.onLine
              }
              onClick={() => {
                if (voice.listening) voice.stop();
                else {
                  if (canSpeak) speechSynthesis.cancel();
                  voice.start(answer);
                }
              }}
            >
              {voice.listening ? "Stop microphone" : "Speak answer"}
            </button>
          </>
        )}
      </div>
      {active && (
        <p className="mt-2 text-xs" role="status">
          {voice.listening
            ? "Listening. Stop the microphone, edit your transcript below, then check your answer."
            : "Review the transcript before submitting. Speech is never submitted automatically."}{" "}
          {!canSpeak &&
            "Read the question on screen; speech playback is unavailable."}{" "}
          {(!voice.supported || !navigator.onLine) &&
            "Voice recognition is unavailable here. You can still type your answer."}
        </p>
      )}
      {active && (
        <p className="mt-2 text-xs text-stone-500">
          Microphone transcription may use your browser’s online speech service.
        </p>
      )}
      {voice.error && <p role="alert">{voice.error}</p>}
    </section>
  );
}
