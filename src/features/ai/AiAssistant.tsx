import { MarkdownMessage } from "./MarkdownMessage";
import { ProcessButton } from "../../components/ProcessButton";
import { useActionFeedback } from "../../hooks/useActionFeedback";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, X } from "lucide-react";
import miraAvatar from "../../assets/images/profile_pictures/mira.png";
import userAvatar from "../../assets/images/profile_pictures/user.png";
import { requestAi } from "../../services/ai";
import { isRecord, parseReviewers, validText, type ChatMessage, type GeneratedReviewer } from "./schema";

export default function AiAssistant({ onClose, onSave }: {
  onClose: () => void;
  onSave: (topic: string, reviewers: GeneratedReviewer[]) => boolean;
}) {
  const saving = useActionFeedback();
  const [succeeded, setSucceeded] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [mode, setMode] = useState<"chat" | "generate">("chat");
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const conversation = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeButton.current?.focus(); }, []);
  useEffect(() => { const log = conversation.current; if (log) log.scrollTop = log.scrollHeight; }, [messages, busy, mode]);
  const [drafts, setDrafts] = useState<GeneratedReviewer[]>([]);
  const [savedTopic, setSavedTopic] = useState("");
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => {
    controller.current?.abort();
    window.clearTimeout(timer.current);
    clearTimeout(successTimer.current);
  }, []);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || (mode === "generate" ? !topic.trim() : !prompt.trim())) return;
    const pending = new AbortController();
    controller.current = pending;
    setSucceeded(false);
    clearTimeout(successTimer.current);
    setBusy(true); setError(""); setDrafts([]);
    const question = prompt.trim();
    if (mode === "chat") { setMessages(current => [...current, { role: "user", content: question }]); setPrompt(""); }
    timer.current = window.setTimeout(() => {
      pending.abort();
      setBusy(false);
      setError("AI took too long. Please try again or choose a smaller batch.");
    }, 35000);
    const timeout = timer.current;
    try {
      const result = await requestAi({ mode, prompt: prompt.trim() || "General overview", topic: topic.trim(), count, ...(mode === "chat" ? { history: messages.slice(-6).map(message => ({ ...message, content: message.content.slice(0, 1800) })) } : {}) }, pending.signal);
      if (pending.signal.aborted) return;
      if (mode === "generate") {
        const reviewers = parseReviewers(result);
        if (reviewers.length !== count) throw new Error("AI did not finish every reviewer. Please try a smaller batch.");
        setDrafts(reviewers); setSavedTopic(topic.trim());
      } else {
        if (!isRecord(result) || !validText(result.answer, 80000)) throw new Error("AI returned an empty answer. Please try again.");
        const reply = result.answer;
        setMessages(current => [...current, { role: "assistant", content: reply }]);
      }
      setSucceeded(true);
      successTimer.current = setTimeout(() => setSucceeded(false), 600);
    } catch (failure) {
      if (!pending.signal.aborted) {
        setError(failure instanceof Error ? failure.message : "Could not connect to AI. Please try again.");
        if (mode === "chat") { setPrompt(question); setMessages(messages); }
      }
    } finally {
      window.clearTimeout(timeout);
      if (!pending.signal.aborted) setBusy(false);
    }
  }

  return createPortal(<dialog open className="ai-panel" aria-label="Your study assistant" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
    <header className="ai-panel-header"><img className="chat-avatar" src={miraAvatar} alt="Mira" /><div><h2>Your study assistant</h2><p>Online · A little wiser, together</p></div><button ref={closeButton} className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></header>
    <div className={"ai-panel-body " + (mode === "chat" ? "is-chat" : "is-generator")}>
    <details className="ai-privacy"><summary>Private library · AI powered by Pollinations</summary><p>Only your submitted questions and recent conversation are sent to Pollinations. Your saved library stays on this device. AI can make mistakes; check answers before studying.</p></details>
    <div className="ai-mode-switch" aria-label="Assistant mode">
      <button type="button" className={"button " + (mode === "generate" ? "primary" : "secondary")} aria-pressed={mode === "generate"} disabled={busy} onClick={() => { setMode("generate"); setError(""); }}>Create reviewers</button>
      <button type="button" className={"button " + (mode === "chat" ? "primary" : "secondary")} aria-pressed={mode === "chat"} disabled={busy} onClick={() => { setMode("chat"); setError(""); }}>Ask a question</button>
    </div>
    {mode === "chat" && <div ref={conversation} className="chat-log" role="log" aria-label="Conversation" aria-live="polite">
      {messages.length === 0 && <div className="chat-welcome"><img className="chat-avatar" src={miraAvatar} alt="" /><div><span className="chat-eyebrow">YOUR STUDY COMPANION</span><h3>Let’s make it click.</h3><p>Hi! I’m Mira. What are we learning today?</p><span className="chat-welcome-hint">Ask about a tricky concept, or work through a question together.</span></div></div>}
      {messages.map((message, index) => <div key={index} className={"chat-message " + message.role}><img className="chat-avatar" src={message.role === "user" ? userAvatar : miraAvatar} alt={message.role === "user" ? "You" : "Mira"} /><div className="chat-bubble"><span className="chat-author">{message.role === "user" ? "You" : "Mira"}</span>{message.role === "assistant" ? <MarkdownMessage content={message.content} /> : <p>{message.content}</p>}</div></div>)}
      {busy && <div className="chat-message assistant"><img className="chat-avatar" src={miraAvatar} alt="" /><p className="chat-bubble typing-dots" aria-label="Mira is typing"><i /><i /><i /></p></div>}
    </div>}
    <form onSubmit={submit} className={mode === "chat" ? "chat-composer" : "reviewer-generator"}>
      {mode === "generate" && <div className="generator-intro"><span className="chat-eyebrow">A HEAD START ON STUDYING</span><h3>One topic. A whole study set.</h3><p>Tell Mira what you’re learning. Preview your flashcards, then save them together.</p></div>}
      {mode === "generate" && <label className="generator-field">Topic
        <input className="input mt-2" value={topic} maxLength={150} required disabled={busy} onChange={event => setTopic(event.target.value)} placeholder="e.g. Cell biology" />
      </label>}
      <label className={mode === "chat" ? "chat-input-label" : "generator-field"}><span className={mode === "chat" ? "sr-only" : ""}>{mode === "generate" ? "Learning goals or notes (optional)" : "Your study question"}</span>
        <textarea className="input mt-2 min-h-24" value={prompt} onChange={event => setPrompt(event.target.value)} required={mode === "chat"} maxLength={3000} disabled={busy} placeholder={mode === "chat" ? "What would you like to learn?" : "e.g. Focus on cell structures and their functions. Keep it beginner-friendly."} />
      </label>
      {mode === "generate" && <div className="generator-size"><div><label htmlFor="reviewer-count">Number of reviewers (5 cards each)</label><p id="reviewer-count-hint">Choose a small set or cover more ground.</p></div><input id="reviewer-count" aria-describedby="reviewer-count-hint" className="input" type="number" min={1} max={5} value={count} required disabled={busy} onChange={event => setCount(Number(event.target.value))} /></div>}
      <div className="composer-actions">
        <ProcessButton label={mode === "generate" ? "Generate reviewers" : "Send question"} state={busy ? "loading" : succeeded ? "success" : "idle"} successLabel="Ready" className={mode === "chat" ? "button primary chat-send" : "button primary"} disabled={!(mode === "generate" ? topic.trim() : prompt.trim())}>{mode === "chat" ? <ArrowUp size={20} aria-hidden="true" /> : "Generate reviewers"}</ProcessButton>
        {busy && <button type="button" className="button secondary" onClick={() => { controller.current?.abort(); window.clearTimeout(timer.current); setBusy(false); }}>Cancel request</button>}
      </div>
    </form>
    {mode === "chat" && <p className="chat-footnote">A little help thinking things through. Always double-check AI answers.</p>}
    {busy && mode === "generate" && <p className="generator-progress" role="status">Preparing your study material. This may take a little time.</p>}
    {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}

    {mode === "generate" && drafts.length > 0 && <section className="generator-results" aria-label="Generated reviewers">
      <div className="generator-result-heading"><span className="chat-eyebrow">YOUR STUDY SET</span><h3>Ready to review · {drafts.length} reviewers</h3><p>Open each reviewer to check the answers before saving.</p></div>
      {drafts.map((draft, index) => <details key={index} className="generator-preview">
        <summary><span className="preview-number">{String(index + 1).padStart(2, "0")}</span><span>{draft.title}<small>{draft.cards.length} flashcards</small></span></summary>
        <p className="my-3 text-xs text-stone-500">{draft.description}</p>
        <dl className="space-y-3 text-sm">{draft.cards.map((card, cardIndex) => <div key={cardIndex}><dt className="font-medium">{card.question}</dt><dd className="mt-1 text-stone-500">{card.answer}</dd></div>)}</dl>
      </details>)}
      {saving.error && <p role="alert" className="text-sm text-red-600">{saving.error}</p>}
      <ProcessButton label="Save all reviewers" state={saving.state} successLabel="Saved" onClick={() => void saving.run(() => onSave(savedTopic, drafts), onClose)} />
    </section>}
    </div>
  </dialog>, document.body);
}
