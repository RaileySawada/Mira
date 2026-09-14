import { ProcessButton } from "../../components/ProcessButton";
import { useActionFeedback } from "../../hooks/useActionFeedback";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { Modal } from "../../components/ui";
import { requestAi } from "../../services/ai";
import { isRecord, parseReviewers, validText, type GeneratedReviewer } from "./schema";

export default function AiAssistant({ onClose, onSave }: {
  onClose: () => void;
  onSave: (topic: string, reviewers: GeneratedReviewer[]) => boolean;
}) {
  const saving = useActionFeedback();
  const [succeeded, setSucceeded] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [mode, setMode] = useState<"chat" | "generate">("generate");
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");
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
    setBusy(true); setError(""); setAnswer(""); setDrafts([]);
    timer.current = window.setTimeout(() => {
      pending.abort();
      setBusy(false);
      setError("AI took too long. Please try again or choose a smaller batch.");
    }, 35000);
    const timeout = timer.current;
    try {
      const result = await requestAi({ mode, prompt: prompt.trim() || "General overview", topic: topic.trim(), count }, pending.signal);
      if (pending.signal.aborted) return;
      if (mode === "generate") {
        const reviewers = parseReviewers(result);
        if (reviewers.length !== count) throw new Error("AI did not finish every reviewer. Please try a smaller batch.");
        setDrafts(reviewers); setSavedTopic(topic.trim());
      } else {
        if (!isRecord(result) || !validText(result.answer, 80000)) throw new Error("AI returned an empty answer. Please try again.");
        setAnswer(result.answer);
      }
      setSucceeded(true);
      successTimer.current = setTimeout(() => setSucceeded(false), 600);
    } catch (failure) {
      if (!pending.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not connect to AI. Please try again.");
    } finally {
      window.clearTimeout(timeout);
      if (!pending.signal.aborted) setBusy(false);
    }
  }

  return <Modal title="Your study assistant" onClose={onClose}>
    <p className="mb-4 text-xs leading-5 text-stone-500">Only what you submit here is sent to Pollinations through Mira’s server. Your saved library stays on this device. AI can make mistakes; check generated answers before studying.</p>
    <div className="mb-5 flex flex-wrap gap-2" aria-label="Assistant mode">
      <button type="button" className={"button " + (mode === "generate" ? "primary" : "secondary")} aria-pressed={mode === "generate"} disabled={busy} onClick={() => { setMode("generate"); setError(""); }}>Create reviewers</button>
      <button type="button" className={"button " + (mode === "chat" ? "primary" : "secondary")} aria-pressed={mode === "chat"} disabled={busy} onClick={() => { setMode("chat"); setError(""); }}>Ask a question</button>
    </div>
    <form onSubmit={submit} className="space-y-4">
      {mode === "generate" && <label className="block text-sm">Topic
        <input className="input mt-2" value={topic} maxLength={150} required disabled={busy} onChange={event => setTopic(event.target.value)} placeholder="e.g. Cell biology" />
      </label>}
      <label className="block text-sm">{mode === "generate" ? "Learning goals or notes (optional)" : "Your study question"}
        <textarea className="input mt-2 min-h-24" value={prompt} onChange={event => setPrompt(event.target.value)} required={mode === "chat"} maxLength={3000} disabled={busy} placeholder="What would you like to learn?" />
      </label>
      {mode === "generate" && <label className="block text-sm">Number of reviewers (5 cards each)
        <input className="input mt-2" type="number" min={1} max={5} value={count} required disabled={busy} onChange={event => setCount(Number(event.target.value))} />
      </label>}
      <div className="flex gap-2">
        <ProcessButton label={mode === "generate" ? "Generate reviewers" : "Send question"} state={busy ? "loading" : succeeded ? "success" : "idle"} successLabel="Ready" disabled={!(mode === "generate" ? topic.trim() : prompt.trim())} />
        {busy && <button type="button" className="button secondary" onClick={() => { controller.current?.abort(); window.clearTimeout(timer.current); setBusy(false); }}>Cancel request</button>}
      </div>
    </form>
    {busy && <p className="mt-4 text-sm text-stone-500" role="status">Preparing your study material. This may take a little time.</p>}
    {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
    {mode === "chat" && answer && <div role="status" className="mt-5 whitespace-pre-wrap rounded-xl bg-soft p-5 text-sm leading-7">{answer}</div>}
    {mode === "generate" && drafts.length > 0 && <section className="mt-6 space-y-3" aria-label="Generated reviewers">
      <h3 className="font-semibold">Ready to review · {drafts.length} reviewers</h3>
      {drafts.map((draft, index) => <details key={index} className="rounded-xl border border-line p-4">
        <summary className="cursor-pointer text-sm font-medium">{draft.title} · {draft.cards.length} cards</summary>
        <p className="my-3 text-xs text-stone-500">{draft.description}</p>
        <dl className="space-y-3 text-sm">{draft.cards.map((card, cardIndex) => <div key={cardIndex}><dt className="font-medium">{card.question}</dt><dd className="mt-1 text-stone-500">{card.answer}</dd></div>)}</dl>
      </details>)}
      {saving.error && <p role="alert" className="text-sm text-red-600">{saving.error}</p>}
      <ProcessButton label="Save all reviewers" state={saving.state} successLabel="Saved" onClick={() => void saving.run(() => onSave(savedTopic, drafts), onClose)} />
    </section>}
  </Modal>;
}
