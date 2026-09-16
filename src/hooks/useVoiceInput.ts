import { useEffect, useRef, useState } from "react";

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionConstructor = new () => Recognition;
function recognitionConstructor() {
  const browser = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

export function useVoiceInput(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const transcript = useRef(onTranscript);
  const keepListening = useRef(false);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { transcript.current = onTranscript; }, [onTranscript]);
  useEffect(() => () => {
    keepListening.current = false;
    clearTimeout(restartTimer.current);
    const current = recognition.current;
    if (current) {
      current.onresult = null;
      current.onerror = null;
      current.onend = null;
      current.abort();
    }
  }, []);
  function start(prefix: string) {
    const Constructor = recognitionConstructor();
    if (!Constructor || keepListening.current || !navigator.onLine) return;
    const RecognitionClass = Constructor;
    keepListening.current = true;
    let savedText = prefix.trimEnd();
    setError("");
    setListening(true);

    function beginUtterance() {
      if (!keepListening.current || !navigator.onLine) {
        keepListening.current = false;
        setListening(false);
        return;
      }
      // A fresh single-utterance recognizer avoids reusing cumulative mobile results.
      const current = new RecognitionClass();
      recognition.current = current;
      current.lang = navigator.language || "en-US";
      current.continuous = false;
      current.interimResults = true;
      let finalText = "";
      const combine = (words: string) => [savedText, words.trim()].filter(Boolean).join(" ").slice(0, 3000);
      current.onresult = event => {
        if (recognition.current !== current) return;
        // Results are a snapshot, not new text to append on every event.
        const results = Array.from(event.results);
        finalText = results.filter(result => result.isFinal).map(result => result[0].transcript.trim()).join(" ");
        const interim = results.filter(result => !result.isFinal).map(result => result[0].transcript.trim()).join(" ");
        transcript.current(combine([finalText, interim].filter(Boolean).join(" ")));
      };
      current.onerror = event => {
        if (recognition.current !== current || event.error === "no-speech") return;
        keepListening.current = false;
        setError(event.error === "not-allowed" ? "Microphone permission was denied. Allow it in your browser or type your message." : "Could not transcribe your voice. Try again or type your message.");
      };
      current.onend = () => {
        if (recognition.current !== current) return;
        current.onresult = null;
        current.onerror = null;
        current.onend = null;
        recognition.current = null;
        // Only confirmed words carry into the next session. Interim guesses can
        // be replayed or corrected by the browser and must not become a prefix.
        savedText = combine(finalText);
        transcript.current(savedText);
        if (!keepListening.current || !navigator.onLine) {
          keepListening.current = false;
          setListening(false);
          return;
        }
        clearTimeout(restartTimer.current);
        restartTimer.current = setTimeout(beginUtterance, 500);
      };
      try { current.start(); } catch {
        recognition.current = null;
        keepListening.current = false;
        setListening(false);
        setError("Could not start the microphone. Try again or type your message.");
      }
    }
    beginUtterance();
  }

  function stop() {
    keepListening.current = false;
    clearTimeout(restartTimer.current);
    const current = recognition.current;
    recognition.current = null;
    if (current) {
      current.onresult = null;
      current.onerror = null;
      current.onend = null;
      current.abort();
    }
    setListening(false);
  }
  return { supported: Boolean(recognitionConstructor()), listening, error, start, stop };
}
