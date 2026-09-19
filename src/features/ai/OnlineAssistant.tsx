import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { useOnline } from "../../hooks/useOnline";
import { addGeneratedReviewers } from "./schema";
import miraAvatar from "../../assets/images/profile_pictures/mira.png";
import type { StudyData } from "../../types/study";

const AiAssistant = lazy(() => import("./AiAssistant"));

export function OnlineAssistant({ data, update }: { data: StudyData; update: (data: StudyData) => boolean }) {
  const online = useOnline();
  return <>
    <AssistantLauncher data={data} update={update} online={online} />
    {!online && <p className="mb-4 text-xs text-stone-500" role="status">You’re offline. Your saved study tools are available. Your open conversation will return when you reconnect.</p>}
  </>;
}

function AssistantLauncher({ data, update, online }: { data: StudyData; update: (data: StudyData) => boolean; online: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [introducing, setIntroducing] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setIntroducing(false), 3500);
    return () => window.clearTimeout(timer);
  }, []);
  return <>
    {online && !open && <button ref={trigger} className={"ai-launcher" + (introducing ? " is-introducing" : "")} title="Ask Mira" onClick={() => { setIntroducing(false); setOpen(true); }} aria-label="AI study assistant" aria-haspopup="dialog">
      <img src={miraAvatar} alt="" /><span className="ai-launcher-label" aria-hidden="true">Ask Mira</span>
    </button>}
    {open && <Suspense fallback={<p role="status">Opening your assistant…</p>}>
      <AiAssistant studyData={data} onGuidance={() => { update({ ...data, milestones: { ...data.milestones, askedMira: true } }); }} online={online} onClose={() => { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); }} onSave={(topic, drafts) => update(addGeneratedReviewers(data, topic, drafts))} />
    </Suspense>}
  </>;
}
