import { useEffect, useRef, useState } from "react";

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
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
    if (!Constructor || recognition.current || !navigator.onLine) return;
    const current = new Constructor();
    recognition.current = current;
    current.lang = navigator.language || "en-US";
    keepListening.current = true;
    let savedText = prefix.trimEnd();
    let latestText = savedText;
    current.continuous = true;
    current.interimResults = true;
    current.onresult = event => {
      const words = Array.from(event.results).map(result => result[0].transcript).join(" ");
      latestText = (savedText + (savedText ? " " : "") + words).slice(0, 3000);
      transcript.current(latestText);
    };
    current.onerror = event => {
      if (event.error === "no-speech") return;
      keepListening.current = false;
      setError(event.error === "not-allowed" ? "Microphone permission was denied. Allow it in your browser or type your message." : "Could not transcribe your voice. Try again or type your message.");
    };
    current.onend = () => {
      if (!keepListening.current || !navigator.onLine) {
        recognition.current = null;
        setListening(false);
        return;
      }
      // Some browsers end even continuous recognition after silence.
      // Preserve this session's text before the next result list starts over.
      savedText = latestText;
      restartTimer.current = setTimeout(() => {
        try { current.start(); } catch {
          keepListening.current = false;
          recognition.current = null;
          setListening(false);
          setError("Listening stopped. Tap the microphone to continue.");
        }
      }, 500);
    };
    setError("");
    setListening(true);
    try { current.start(); } catch {
      keepListening.current = false;
      recognition.current = null;
      setListening(false);
      setError("Could not start the microphone. Try again or type your message.");
    }
  }
  function stop() {
    keepListening.current = false;
    clearTimeout(restartTimer.current);
    recognition.current?.stop();
    recognition.current = null;
    setListening(false);
  }
  return { supported: Boolean(recognitionConstructor()), listening, error, start, stop };
}
