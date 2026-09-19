import { buildStudyOverview } from "./studyOverview";
import type { StudyData } from "../../types/study";
import { SearchSelect } from "../../components/SearchSelect";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { MarkdownMessage } from "./MarkdownMessage";
import { ProcessButton } from "../../components/ProcessButton";
import { useActionFeedback } from "../../hooks/useActionFeedback";
import { useEffect, useEffectEvent, useRef, useState, type SubmitEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, Mic, Square, Plus, RotateCcw, X } from "lucide-react";
import miraAvatar from "../../assets/images/profile_pictures/mira.png";
import userAvatar from "../../assets/images/profile_pictures/user.png";
import { requestAi } from "../../services/ai";
import { clearAiSession, readAiSession, saveAiSession } from "../../services/aiSession";
import { isRecord, parseReviewers, validText, type ChatMessage, type GeneratedReviewer } from "./schema";

type Mode = "chat" | "generate";

export default function AiAssistant({ onClose, onSave, onGuidance, studyData, online = true }: {
  online?: boolean;
  studyData?: StudyData;
  onClose: () => void;
  onGuidance?: () => void;
  onSave: (topic: string, reviewers: GeneratedReviewer[]) => boolean;
}) {
  const guidanceReceived = useRef(onGuidance);
  useEffect(() => { guidanceReceived.current = onGuidance; }, [onGuidance]);
  const saving = useActionFeedback();
  const [mode, setMode] = useState<Mode>("chat");
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const voice = useVoiceInput(setPrompt);
  const [count, setCount] = useState(3);
  const [cardsPerReviewer, setCardsPerReviewer] = useState(5);
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
  const successTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { closeButton.current?.focus(); }, []);
  useEffect(() => { const log = conversation.current; if (log) log.scrollTop = log.scrollHeight; }, [messages, typingAnswer, busy]);
  useEffect(() => { if (messages.length) saveAiSession(messages); }, [messages]);
  useEffect(() => () => {
    controller.current?.abort();
    window.clearTimeout(timer.current);
    window.clearTimeout(responseTimer.current);
    clearTimeout(successTimer.current);
  }, []);

  function closeAssistant() {
    clearAiSession();
    onClose();
  }
  function openMode(next: Mode) {
    voice.stop();
    setMode(next);
    setError("");
  }
  function cancelRequest() {
    controller.current?.abort();
    window.clearTimeout(timer.current);
    window.clearTimeout(responseTimer.current);
    setTypingAnswer("");
    setBusy(false);
  }
  const pauseOffline = useEffectEvent(() => { cancelRequest(); voice.stop(); });
  useEffect(() => {
    const disconnected = () => pauseOffline();
    window.addEventListener("offline", disconnected);
    return () => window.removeEventListener("offline", disconnected);
  }, []);

  function startFreshConversation() {
    if (busy) return;
    voice.stop();
    setDrafts([]);
    setMessages([]);
    clearAiSession();
    setPrompt("");
    setTypingAnswer("");
    setError("");
  }
  function revealAnswer(answer: string, signal: AbortSignal) {
    return new Promise<void>((resolve) => {
      const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        setMessages((current) => [...current, { role: "assistant", content: answer }]);
        resolve();
        return;
      }
      const aborted = () => { window.clearTimeout(responseTimer.current); resolve(); };
      signal.addEventListener("abort", aborted, { once: true });
      let position = 0;
      const reveal = () => {
        if (signal.aborted) {
          setTypingAnswer("");
          resolve();
          return;
        }
        position = Math.min(answer.length, position + Math.max(4, Math.ceil(answer.length / 90)));
        setTypingAnswer(answer.slice(0, position));
        if (position === answer.length) {
          signal.removeEventListener("abort", aborted);
          setMessages((current) => [...current, { role: "assistant", content: answer }]);
          setTypingAnswer("");
          resolve();
          return;
        }
        // Keep the typing pace while avoiding a Markdown parse on every display frame.
        responseTimer.current = window.setTimeout(reveal, 32);
      };
      reveal();
    });
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!online || !navigator.onLine || busy || voice.listening || (mode === "generate" ? !topic.trim() : !prompt.trim())) return;
    const pending = new AbortController();
    controller.current = pending;
    const question = prompt.trim();
    setBusy(true);
    setSucceeded(false);
    setError("");
    setDrafts([]);
    if (mode === "chat") {
      setMessages(current => [...current, { role: "user", content: question }]);
      setPrompt("");
    }
    timer.current = window.setTimeout(() => {
      pending.abort();
      setBusy(false);
      setError("Mira took too long to respond. Please try again.");
    }, 35000);
    const timeout = timer.current;
    try {
      const result = await requestAi({
        mode,
        prompt: question || "General overview",
        topic: topic.trim(),
        count,
        ...(mode === "chat" && studyData ? { overview: buildStudyOverview(studyData) } : {}),
        ...(mode === "generate" && cardsPerReviewer !== 5 ? { cardsPerReviewer } : {}),
        ...(mode === "chat" ? { history: messages.slice(-6).map(message => ({ ...message, content: message.content.slice(0, 1800) })) } : {}),
      }, pending.signal);
      if (pending.signal.aborted) return;
      window.clearTimeout(timeout);
      if (mode === "generate") {
        const reviewers = parseReviewers(result);
        if (reviewers.length !== count || reviewers.some(reviewer => reviewer.cards.length !== cardsPerReviewer)) throw new Error("AI did not finish every reviewer. Please try a smaller batch.");
        setDrafts(reviewers);
        setSavedTopic(topic.trim());
      } else {
        if (!isRecord(result) || !validText(result.answer, 80000)) throw new Error("AI returned an empty answer. Please try again.");
        if (result.reviewers !== undefined) {
          if (!validText(result.topic, 150)) throw new Error("AI returned an invalid topic. Please try again.");
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
        setError(failure instanceof Error ? failure.message : "Could not connect to Mira. Please try again.");
        if (mode === "chat") {
          setPrompt(question);
          setMessages(messages);
        }
      }
    } finally {
      window.clearTimeout(timeout);
      if (!pending.signal.aborted) setBusy(false);
    }
  }

  const reviewerPreview = drafts.length > 0 && <section className="generator-results" aria-label="Generated reviewers"><div className="generator-result-heading"><span className="chat-eyebrow">YOUR STUDY SET</span><h3>Ready to review · {drafts.length} reviewers</h3><p>Open each reviewer to check answers before saving.</p></div>
          {drafts.map((draft, index) => <details key={index} className="generator-preview"><summary><span className="preview-number">{String(index + 1).padStart(2, "0")}</span><span>{draft.title}<small>{draft.cards.length} flashcards</small></span></summary><p className="my-3 text-xs text-stone-500">{draft.description}</p><dl className="space-y-3 text-sm">{draft.cards.map((card, cardIndex) => <div key={cardIndex}><dt className="font-medium">{card.question}</dt><dd className="mt-1 text-stone-500">{card.answer}</dd></div>)}</dl></details>)}
          {saving.error && <p role="alert" className="ai-inline-error">{saving.error}</p>}
          <ProcessButton label="Save all reviewers" disabled={busy} state={saving.state} successLabel="Saved" onClick={() => void saving.run(() => onSave(savedTopic, drafts), closeAssistant)} />
        </section>;

  return createPortal(
    <aside hidden={!online} style={!online ? { display: "none" } : undefined} className="ai-panel ai-conversation" aria-label="Your study assistant" role="complementary" tabIndex={-1} onKeyDown={event => {
      if (event.key === "Escape") { event.stopPropagation(); closeAssistant(); }
    }}>
      <header className="ai-chat-header">
        <div className="ai-identity"><img src={miraAvatar} alt="Mira" /><div><h2>Mira</h2><p><i /> Online study companion</p></div></div>
        <div className="ai-header-actions">
          {mode === "chat" ? <button type="button" className="ai-header-action" onClick={() => openMode("generate")} disabled={busy}><Plus size={15} /> Create reviewers</button> : <button type="button" className="ai-header-action" onClick={() => openMode("chat")} disabled={busy}>Ask a question</button>}
          {mode === "chat" && messages.length > 0 && <button type="button" className="icon-button" aria-label="Start a new conversation" onClick={startFreshConversation} disabled={busy}><RotateCcw size={17} /></button>}
          <button ref={closeButton} className="icon-button" aria-label="Close dialog" onClick={closeAssistant}><X size={19} /></button>
        </div>
      </header>

      {mode === "chat" ? <section className="ai-chat-main">
        <div ref={conversation} className="chat-log" role="log" aria-label="Conversation" aria-live="polite">
          {messages.length === 0 && <div className="chat-empty-state">
            <img src={miraAvatar} alt="" />
            <div><span className="chat-eyebrow">MIRA, YOUR STUDY PARTNER</span><h3>How can I help you learn today?</h3><p>Ask about a concept, work through a question, or turn notes into something clearer.</p></div>
            <div className="chat-suggestions" aria-label="Suggested questions">
              <button type="button" onClick={() => setPrompt("Explain this concept simply: ")}>Explain simply</button>
              <button type="button" onClick={() => setPrompt("Help me practice this topic: ")}>Help me practice</button>
              <button type="button" onClick={() => setPrompt("Create reviewers about ")}>Make reviewers</button>
            </div>
          </div>}
          {messages.map((message, index) => <div key={index} className={"chat-message " + message.role}>
            <img className="chat-avatar" src={message.role === "user" ? userAvatar : miraAvatar} alt={message.role === "user" ? "You" : "Mira"} />
            <div className="chat-message-content"><span className="chat-author">{message.role === "user" ? "You" : "Mira"}</span><div className="chat-bubble">{message.role === "assistant" ? <MarkdownMessage content={message.content} /> : <p>{message.content}</p>}</div></div>
          </div>)}
          {reviewerPreview}
          {typingAnswer && <div className="chat-message assistant" aria-live="polite"><img className="chat-avatar" src={miraAvatar} alt="" /><div className="chat-message-content"><span className="chat-author">Mira</span><div className="chat-bubble chat-streaming"><MarkdownMessage content={typingAnswer} /><span className="typing-cursor" aria-hidden="true" /></div></div></div>}
          {busy && !typingAnswer && <div className="chat-message assistant"><img className="chat-avatar" src={miraAvatar} alt="" /><div className="chat-message-content"><span className="chat-author">Mira</span><p className="chat-bubble typing-dots" aria-label="Mira is typing"><i /><i /><i /></p></div></div>}
        </div>
        <div className="chat-composer-wrap">
          {error && <p className="ai-inline-error" role="alert">{error}</p>}
          <form onSubmit={submit} className="chat-composer">
            <label className="chat-input-label"><span className="sr-only">Your study question</span><textarea value={prompt} onChange={event => setPrompt(event.target.value)} required maxLength={3000} disabled={busy || voice.listening} placeholder="Message Mira…" rows={1} /></label>
            {voice.supported && <button type="button" className="icon-button voice-button" aria-label={voice.listening ? "Stop recording" : "Start voice input"} aria-pressed={voice.listening} disabled={busy} onClick={() => voice.listening ? voice.stop() : voice.start(prompt)}>{voice.listening ? <Square size={17} /> : <Mic size={19} />}</button>}
            <ProcessButton label="Send question" state={busy ? "loading" : succeeded ? "success" : "idle"} successLabel="Ready" className="button primary chat-send" disabled={!prompt.trim() || voice.listening}>{busy ? undefined : <ArrowUp size={19} aria-hidden="true" />}</ProcessButton>
          </form>
          {voice.supported && <p className="voice-notice" role="status">{voice.listening ? "Listening… Stop to edit your words before sending." : "Voice input may use your browser’s online speech service. Review the text before sending."}</p>}
          {voice.error && <p className="ai-inline-error" role="alert">{voice.error}</p>}
          <div className="chat-composer-meta"><span>{studyData ? "Sending shares your saved name and study overview with Pollinations. " : ""}Mira can make mistakes. Check important answers.</span>{busy && <button type="button" onClick={cancelRequest}>Stop generating</button>}</div>
        </div>
      </section> : <section className="ai-generator-workspace">
        <div className="generator-intro"><span className="chat-eyebrow">CREATE A STUDY SET</span><h3>Make a review set in one go.</h3><p>Create up to five reviewers with five or ten flashcards each. You can inspect every card before saving.</p></div>
        <form onSubmit={submit} className="reviewer-generator">
          <label className="generator-field">Topic<input className="input" value={topic} maxLength={150} required disabled={busy} onChange={event => setTopic(event.target.value)} placeholder="e.g. Cell biology" /></label>
          <label className="generator-field">Learning goals or notes (optional)<textarea className="input" value={prompt} onChange={event => setPrompt(event.target.value)} maxLength={3000} disabled={busy} placeholder="Focus on cell structures and their functions…" /></label>
          <div className="generator-size"><div><label htmlFor="reviewer-count">Number of reviewers</label><p id="reviewer-count-hint">Choose how many study sets to prepare.</p></div><input id="reviewer-count" aria-describedby="reviewer-count-hint" className="input" type="number" min={1} max={5} value={count} required disabled={busy} onChange={event => setCount(Number(event.target.value))} /></div>
          <SearchSelect label="Cards per reviewer" value={String(cardsPerReviewer)} options={[{ value: "5", label: "5 cards · Quick review" }, { value: "10", label: "10 cards · More practice" }]} onChange={value => setCardsPerReviewer(Number(value))} disabled={busy} />
          <ProcessButton label="Generate reviewers" state={busy ? "loading" : succeeded ? "success" : "idle"} successLabel="Ready" className="button primary" disabled={!topic.trim()}>Generate reviewers</ProcessButton>
          {busy && <button type="button" className="button secondary" onClick={cancelRequest}>Cancel request</button>}
        </form>
        {error && <p className="ai-inline-error" role="alert">{error}</p>}
        {busy && <p className="generator-progress" role="status">Preparing your study material. This may take a little time.</p>}
        {reviewerPreview}
      </section>}
    </aside>, document.body,
  );
}
