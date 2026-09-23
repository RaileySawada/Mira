import { ChatComposer } from "./ChatComposer";
import "./MiraLayout.css";
import type { LibraryAction } from "../../types/agent";
import { parseLibraryActions, describeLibraryAction } from "./libraryActions";
import { MiraAmbient } from "./MiraAmbient";
import { ambientMood } from "./ambientMood";
import { AbuseChallenge } from "./AbuseChallenge";
import { buildReviewerContext } from "./reviewerContext";
import { buildStudyOverview } from "./studyOverview";
import type { StudyData } from "../../types/study";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { MarkdownMessage } from "./MarkdownMessage";
import { ProcessButton } from "../../components/ProcessButton";
import { useActionFeedback } from "../../hooks/useActionFeedback";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type SubmitEvent,
} from "react";
import { createPortal } from "react-dom";
import { ArrowDown, RotateCcw, X } from "lucide-react";
import miraAvatar from "../../assets/images/profile_pictures/mira.png";
import userAvatar from "../../assets/images/profile_pictures/user.png";
import { requestAi } from "../../services/ai";
import {
  clearAiSession,
  readAiSession,
  saveAiSession,
} from "../../services/aiSession";
import { parseReviewers } from "./schema";
import { isRecord, validText } from "../../utils/validation";
import { type ChatMessage, type GeneratedReviewer } from "../../types/ai";

export default function AiAssistant({
  onClose,
  onSave,
  onApplyActions,
  onGuidance,
  studyData,
  importedNotes = "",
  online = true,
  presentation = "floating",
}: {
  online?: boolean;
  presentation?: "floating" | "page";
  importedNotes?: string;
  studyData?: StudyData;
  onClose: () => void;
  onGuidance?: () => void;
  onApplyActions?: (actions: LibraryAction[]) => boolean | Promise<boolean>;
  onSave: (
    topic: string,
    reviewers: GeneratedReviewer[],
    folder?: string,
  ) => boolean | Promise<boolean>;
}) {
  const guidanceReceived = useRef(onGuidance);
  useEffect(() => {
    guidanceReceived.current = onGuidance;
  }, [onGuidance]);
  const [useReviewer, setUseReviewer] = useState(false);
  const [abuseToken, setAbuseToken] = useState("");
  const [challengeVersion, setChallengeVersion] = useState(0);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
  const currentReviewer = studyData?.reviewers.find(
    (r) => r.id === studyData.lastStudy?.reviewerId,
  );
  const saving = useActionFeedback();
  const applying = useActionFeedback();
  const [actions, setActions] = useState<LibraryAction[]>([]);
  const [savedFolder, setSavedFolder] = useState("");
  const [prompt, setPrompt] = useState(
    importedNotes
      ? ("Create reviewers from these notes:\n" + importedNotes).slice(0, 3000)
      : "",
  );
  const voice = useVoiceInput(setPrompt);
  const [busy, setBusy] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(readAiSession);
  const [typingAnswer, setTypingAnswer] = useState("");
  const [drafts, setDrafts] = useState<GeneratedReviewer[]>([]);
  const [savedTopic, setSavedTopic] = useState("");
  const conversation = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const responseTimer = useRef<number | undefined>(undefined);
  const successTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    closeButton.current?.focus();
  }, []);
  const followConversation = useRef(true);
  const [showScrollDown, setShowScrollDown] = useState(false);
  useEffect(() => {
    if (presentation !== "page") return;
    const trackScroll = () => {
      followConversation.current =
        document.documentElement.scrollHeight -
          window.scrollY -
          window.innerHeight <
        180;
      setShowScrollDown(!followConversation.current);
    };
    window.addEventListener("scroll", trackScroll, { passive: true });
    window.addEventListener("resize", trackScroll);
    const observer = new ResizeObserver(trackScroll);
    observer.observe(document.documentElement);
    trackScroll();
    return () => {
      window.removeEventListener("scroll", trackScroll);
      window.removeEventListener("resize", trackScroll);
      observer.disconnect();
    };
  }, [presentation]);
  useEffect(() => {
    if (presentation === "page") {
      if (followConversation.current && messages.length)
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "instant",
        });
    } else {
      const log = conversation.current;
      if (log) log.scrollTop = log.scrollHeight;
    }
  }, [messages, typingAnswer, busy, presentation]);
  useEffect(() => {
    if (messages.length) saveAiSession(messages);
  }, [messages]);
  useEffect(
    () => () => {
      controller.current?.abort();
      window.clearTimeout(timer.current);
      window.clearTimeout(responseTimer.current);
      clearTimeout(successTimer.current);
    },
    [],
  );

  function closeAssistant() {
    clearAiSession();
    onClose();
  }
  function cancelRequest() {
    controller.current?.abort();
    window.clearTimeout(timer.current);
    window.clearTimeout(responseTimer.current);
    setTypingAnswer("");
    setBusy(false);
  }
  const pauseOffline = useEffectEvent(() => {
    cancelRequest();
    voice.stop();
  });
  useEffect(() => {
    const disconnected = () => pauseOffline();
    window.addEventListener("offline", disconnected);
    return () => window.removeEventListener("offline", disconnected);
  }, []);

  function startFreshConversation() {
    if (busy) return;
    voice.stop();
    setDrafts([]);
    setActions([]);
    setSavedFolder("");
    setMessages([]);
    clearAiSession();
    setPrompt("");
    setTypingAnswer("");
    setError("");
  }
  function revealAnswer(answer: string, signal: AbortSignal) {
    return new Promise<void>((resolve) => {
      const reduceMotion = matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduceMotion) {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: answer },
        ]);
        resolve();
        return;
      }
      const aborted = () => {
        window.clearTimeout(responseTimer.current);
        resolve();
      };
      signal.addEventListener("abort", aborted, { once: true });
      let position = 0;
      const reveal = () => {
        if (signal.aborted) {
          setTypingAnswer("");
          resolve();
          return;
        }
        position = Math.min(
          answer.length,
          position + Math.max(4, Math.ceil(answer.length / 90)),
        );
        setTypingAnswer(answer.slice(0, position));
        if (position === answer.length) {
          signal.removeEventListener("abort", aborted);
          setMessages((current) => [
            ...current,
            { role: "assistant", content: answer },
          ]);
          setTypingAnswer("");
          resolve();
          return;
        }
        responseTimer.current = window.setTimeout(reveal, 32);
      };
      reveal();
    });
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !online ||
      !navigator.onLine ||
      busy ||
      voice.listening ||
      applying.state !== "idle" ||
      !prompt.trim()
    )
      return;
    if (siteKey && !abuseToken) {
      setError("Complete the verification before sending.");
      return;
    }
    const pending = new AbortController();
    controller.current = pending;
    const question = prompt.trim();
    setBusy(true);
    setSucceeded(false);
    setError("");
    setDrafts([]);
    setActions([]);
    setSavedFolder("");
    setMessages((current) => [...current, { role: "user", content: question }]);
    setPrompt("");
    timer.current = window.setTimeout(() => {
      pending.abort();
      setBusy(false);
      setError("Mira took too long to respond. Please try again.");
    }, 35000);
    const timeout = timer.current;
    try {
      const result = await requestAi(
        {
          mode: "chat",
          ...(abuseToken ? { abuseToken } : {}),
          ...(useReviewer && currentReviewer
            ? { reviewerContext: buildReviewerContext(currentReviewer) }
            : {}),
          prompt: question || "General overview",
          ...(studyData ? { overview: buildStudyOverview(studyData) } : {}),
          history: messages
            .slice(-6)
            .map((message) => ({
              ...message,
              content: message.content.slice(0, 1800),
            })),
        },
        pending.signal,
      );
      if (pending.signal.aborted) return;
      window.clearTimeout(timeout);
      {
        if (!isRecord(result) || !validText(result.answer, 80000))
          throw new Error("AI returned an empty answer. Please try again.");
        if (result.actions !== undefined)
          setActions(parseLibraryActions(result.actions));
        if (result.folder !== undefined && !validText(result.folder, 150))
          throw new Error("Invalid folder name.");
        setSavedFolder(typeof result.folder === "string" ? result.folder : "");
        if (result.reviewers !== undefined) {
          if (!validText(result.topic, 150))
            throw new Error("AI returned an invalid topic. Please try again.");
          setDrafts(parseReviewers(result));
          setSavedTopic(result.topic);
        }
        await revealAnswer(result.answer as string, pending.signal);
        if (!pending.signal.aborted) guidanceReceived.current?.();
      }
      if (pending.signal.aborted) return;
      setSucceeded(true);
      successTimer.current = setTimeout(() => setSucceeded(false), 600);
    } catch (failure) {
      if (!pending.signal.aborted) {
        setError(
          failure instanceof Error
            ? failure.message
            : "Could not connect to Mira. Please try again.",
        );
        {
          setPrompt(question);
          setMessages(messages);
        }
      }
    } finally {
      setAbuseToken("");
      setChallengeVersion((value) => value + 1);
      window.clearTimeout(timeout);
      if (!pending.signal.aborted) setBusy(false);
    }
  }

  const actionPreview = actions.length > 0 && onApplyActions && (
    <section className="generator-results" aria-label="Library changes">
      <h3>Ready to organize</h3>
      <p className="text-sm text-stone-500">
        Missing destination folders and topics will be created. Your cards and
        study history stay intact.
      </p>
      <ul className="agent-action-list">
        {actions.map((action, index) => (
          <li key={index}>{describeLibraryAction(action)}</li>
        ))}
      </ul>
      {applying.error && (
        <p role="alert" className="ai-inline-error">
          {applying.error}
        </p>
      )}
      <div className="flex gap-3">
        <ProcessButton
          label="Apply changes"
          successLabel="Applied"
          state={applying.state}
          disabled={busy || !online}
          onClick={() =>
            void applying.run(
              () => onApplyActions(actions),
              () => {
                setActions([]);
                setMessages((current) => [
                  ...current,
                  {
                    role: "assistant",
                    content:
                      "The requested library changes have been saved on this device.",
                  },
                ]);
              },
            )
          }
        />
        <button
          className="button secondary"
          disabled={applying.state === "loading"}
          onClick={() => setActions([])}
        >
          Dismiss
        </button>
      </div>
    </section>
  );
  const reviewerPreview = drafts.length > 0 && (
    <section className="generator-results" aria-label="Generated reviewers">
      <div className="generator-result-heading">
        <span className="chat-eyebrow">YOUR STUDY SET</span>
        <h3>Ready to review · {drafts.length} reviewers</h3>
        <p>
          Topic: {savedTopic} · Folder: {savedFolder || "Unfiled"}
        </p>
        <p>Open each reviewer to check answers before saving.</p>
      </div>
      {drafts.map((draft, index) => (
        <details key={index} className="generator-preview">
          <summary>
            <span className="preview-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>
              {draft.title}
              <small>{draft.cards.length} flashcards</small>
            </span>
          </summary>
          <p className="my-3 text-xs text-stone-500">{draft.description}</p>
          <dl className="space-y-3 text-sm">
            {draft.cards.map((card, cardIndex) => (
              <div key={cardIndex}>
                <dt className="font-medium">{card.question}</dt>
                <dd className="mt-1 text-stone-500">{card.answer}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
      {saving.error && (
        <p role="alert" className="ai-inline-error">
          {saving.error}
        </p>
      )}
      <ProcessButton
        label="Save all reviewers"
        disabled={busy}
        state={saving.state}
        successLabel="Saved"
        onClick={() =>
          void saving.run(
            () =>
              savedFolder
                ? onSave(savedTopic, drafts, savedFolder)
                : onSave(savedTopic, drafts),
            closeAssistant,
          )
        }
      />
    </section>
  );

  const WelcomeHeading = presentation === "page" ? "h1" : "h3";
  const content = (
    <aside
      hidden={!online}
      style={!online ? { display: "none" } : undefined}
      className={
        "ai-panel ai-conversation" + (presentation === "page" ? " ai-page" : "")
      }
      aria-label="Your study assistant"
      role="complementary"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          closeAssistant();
        }
      }}
    >
      {presentation === "page" && (
        <MiraAmbient
          mood={ambientMood(
            busy,
            Boolean(error),
            messages.findLast((message) => message.role === "assistant")
              ?.content ?? "",
            drafts.length > 0,
          )}
        />
      )}
      <header className="ai-chat-header">
        {presentation !== "page" && (
          <div className="ai-identity">
            <img src={miraAvatar} alt="Mira" />
            <div>
              <h2>Mira</h2>
              <p>
                <i /> Online study companion
              </p>
            </div>
          </div>
        )}
        <div className="ai-header-actions">
          {messages.length > 0 && (
            <button
              type="button"
              className="icon-button"
              aria-label="Start a new conversation"
              onClick={startFreshConversation}
              disabled={busy}
            >
              <RotateCcw size={17} />
            </button>
          )}
          {presentation !== "page" && (
            <button
              ref={closeButton}
              className="icon-button"
              aria-label="Close dialog"
              onClick={closeAssistant}
            >
              <X size={19} />
            </button>
          )}
        </div>
      </header>
      <div className="shrink-0 overflow-auto px-4">
        {siteKey && online && (
          <AbuseChallenge
            key={challengeVersion}
            siteKey={siteKey}
            onToken={setAbuseToken}
          />
        )}
      </div>

      {
        <section className="ai-chat-main">
          <div
            ref={conversation}
            className="chat-log"
            role="log"
            aria-label="Conversation"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="chat-empty-state">
                <img
                  src={presentation === "page" ? "/brand/mark.png" : miraAvatar}
                  className={
                    presentation === "page" ? "mira-line-logo" : undefined
                  }
                  alt=""
                />
                <div>
                  <span className="chat-eyebrow">MIRA, YOUR STUDY PARTNER</span>
                  <WelcomeHeading>
                    How can I help you learn today?
                  </WelcomeHeading>
                  <p>
                    Ask about a concept, work through a question, or turn notes
                    into something clearer.
                  </p>
                </div>
                <div
                  className="chat-suggestions"
                  aria-label="Suggested questions"
                >
                  <button
                    type="button"
                    onClick={() => setPrompt("Explain this concept simply: ")}
                  >
                    Explain simply
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrompt("Help me practice this topic: ")}
                  >
                    Help me practice
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrompt("Create reviewers about ")}
                  >
                    Make reviewers
                  </button>
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={"chat-message " + message.role}>
                <img
                  className="chat-avatar"
                  src={message.role === "user" ? userAvatar : miraAvatar}
                  alt={message.role === "user" ? "You" : "Mira"}
                />
                <div className="chat-message-content">
                  <span className="chat-author">
                    {message.role === "user" ? "You" : "Mira"}
                  </span>
                  <div className="chat-bubble">
                    {message.role === "assistant" ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {actionPreview}
            {reviewerPreview}
            {typingAnswer && (
              <div className="chat-message assistant" aria-live="polite">
                <img className="chat-avatar" src={miraAvatar} alt="" />
                <div className="chat-message-content">
                  <span className="chat-author">Mira</span>
                  <div className="chat-bubble chat-streaming">
                    <MarkdownMessage content={typingAnswer} />
                    <span className="typing-cursor" aria-hidden="true" />
                  </div>
                </div>
              </div>
            )}
            {busy && !typingAnswer && (
              <div className="chat-message assistant">
                <img className="chat-avatar" src={miraAvatar} alt="" />
                <div className="chat-message-content">
                  <span className="chat-author">Mira</span>
                  <p
                    className="chat-bubble typing-dots"
                    aria-label="Mira is typing"
                  >
                    <i />
                    <i />
                    <i />
                  </p>
                </div>
              </div>
            )}
          </div>
          <ChatComposer
            prompt={prompt}
            setPrompt={setPrompt}
            busy={busy}
            succeeded={succeeded}
            online={online}
            error={error}
            sharesOverview={Boolean(studyData)}
            currentReviewerTitle={currentReviewer?.title}
            useReviewer={useReviewer}
            setUseReviewer={setUseReviewer}
            submit={submit}
            cancelRequest={cancelRequest}
            voice={voice}
          />
        </section>
      }
      {presentation === "page" && showScrollDown && (
        <button
          type="button"
          className="mira-scroll-bottom"
          aria-label="Scroll to bottom"
          onClick={() => {
            followConversation.current = true;
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "instant"
                : "smooth",
            });
          }}
        >
          <ArrowDown size={20} aria-hidden="true" />
        </button>
      )}
    </aside>
  );
  return presentation === "page"
    ? content
    : createPortal(content, document.body);
}
