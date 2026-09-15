import { lazy, Suspense, useState, useRef } from "react";
import { useOnline } from "../../hooks/useOnline";
import { addGeneratedReviewers } from "./schema";
import miraAvatar from "../../assets/images/profile_pictures/mira.png";
import type { StudyData } from "../../types/study";

const AiAssistant = lazy(() => import("./AiAssistant"));

export function OnlineAssistant({ data, update }: { data: StudyData; update: (data: StudyData) => boolean }) {
  const online = useOnline();
  // Unmounting cancels pending requests and discards unsaved AI content.
  return online ? <AssistantLauncher data={data} update={update} /> :
    <p className="mb-4 text-xs text-stone-500" role="status">You’re offline. Your saved study tools are available.</p>;
}

function AssistantLauncher({ data, update }: { data: StudyData; update: (data: StudyData) => boolean }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return <>
    {!open && <button ref={trigger} className="ai-launcher" onClick={() => setOpen(true)} aria-label="AI study assistant" aria-haspopup="dialog">
      <img src={miraAvatar} alt="" /><span>Ask Mira</span>
    </button>}
    {open && <Suspense fallback={<p role="status">Opening your assistant…</p>}>
      <AiAssistant onClose={() => { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); }} onSave={(topic, drafts) => update(addGeneratedReviewers(data, topic, drafts))} />
    </Suspense>}
  </>;
}
