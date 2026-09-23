import { useId, useLayoutEffect, useRef, type SubmitEvent } from "react";
import { ArrowUp, Mic, Square } from "lucide-react";
import { ProcessButton } from "../../components/ProcessButton";

interface ChatComposerProps {
  prompt: string;
  setPrompt: (value: string) => void;
  busy: boolean;
  succeeded: boolean;
  online: boolean;
  error: string;
  sharesOverview: boolean;
  currentReviewerTitle?: string;
  useReviewer: boolean;
  setUseReviewer: (enabled: boolean) => void;
  submit: (event: SubmitEvent<HTMLFormElement>) => void;
  cancelRequest: () => void;
  voice: {
    supported: boolean;
    listening: boolean;
    error: string;
    start: (text: string) => void;
    stop: () => void;
  };
}

// Presentation and input sizing only; requests and persistence belong to the parent.
export function ChatComposer({
  prompt,
  setPrompt,
  busy,
  succeeded,
  online,
  error,
  sharesOverview,
  currentReviewerTitle,
  useReviewer,
  setUseReviewer,
  submit,
  cancelRequest,
  voice,
}: ChatComposerProps) {
  const contextDescriptionId = useId();
  const composerInput = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const input = composerInput.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 160) + "px";
    input.style.overflowY = input.scrollHeight > 160 ? "auto" : "hidden";
  }, [prompt]);
  return (
    <div className="chat-composer-wrap">
      {error && (
        <p className="ai-inline-error" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={submit} className="chat-composer">
        <label className="chat-input-label">
          <span className="sr-only">Your study question</span>
          <textarea
            ref={composerInput}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            required
            maxLength={3000}
            disabled={busy || voice.listening}
            onKeyDown={(event) => {
              const isMobile = window.matchMedia("(max-width: 640px)").matches;

              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !isMobile &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                if (!busy && online && prompt.trim() && !voice.listening)
                  event.currentTarget.form?.requestSubmit();
              }
            }}
            enterKeyHint="enter"
            placeholder="Message Mira…"
            rows={1}
            style={{ overflowY: "hidden" }}
          />
        </label>
        <div className="chat-composer-toolbar">
          {voice.supported && (
            <button
              type="button"
              className="icon-button voice-button"
              aria-label={
                voice.listening ? "Stop recording" : "Start voice input"
              }
              aria-pressed={voice.listening}
              disabled={busy}
              onClick={() =>
                voice.listening ? voice.stop() : voice.start(prompt)
              }
            >
              {voice.listening ? <Square size={17} /> : <Mic size={19} />}
            </button>
          )}
          {currentReviewerTitle && (
            <label
              className="reviewer-context-toggle"
              title={currentReviewerTitle}
            >
              <input
                type="checkbox"
                checked={useReviewer}
                disabled={busy}
                aria-label="Use current reviewer as context"
                aria-describedby={contextDescriptionId}
                onChange={(event) => setUseReviewer(event.target.checked)}
              />
              <span>Use reviewer</span>
            </label>
          )}
          <ProcessButton
            label="Send question"
            state={busy ? "loading" : succeeded ? "success" : "idle"}
            successLabel="Ready"
            className="button primary chat-send"
            disabled={!prompt.trim() || voice.listening}
          >
            {busy ? undefined : <ArrowUp size={19} aria-hidden="true" />}
          </ProcessButton>
        </div>
      </form>
      {currentReviewerTitle && (
        <p id={contextDescriptionId} className="reviewer-context-description">
          {useReviewer
            ? "Sending shares selected cards from “" +
              currentReviewerTitle +
              "” with Pollinations (up to 30 cards)."
            : "Reviewer contents stay on this device unless you enable Use reviewer."}
        </p>
      )}
      {voice.supported && (
        <p className="voice-notice" role="status">
          {voice.listening
            ? "Listening… Stop to edit your words before sending."
            : "Voice input may use your browser’s online speech service. Review the text before sending."}
        </p>
      )}
      {voice.error && (
        <p className="ai-inline-error" role="alert">
          {voice.error}
        </p>
      )}
      <div className="chat-composer-meta">
        <span>
          {sharesOverview
            ? "Sending shares your saved name and study overview with Pollinations. "
            : ""}
          Mira can make mistakes. Check important answers.
        </span>
        {busy && (
          <button type="button" onClick={cancelRequest}>
            Stop generating
          </button>
        )}
      </div>
    </div>
  );
}
