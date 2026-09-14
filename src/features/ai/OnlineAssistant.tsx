import { lazy, Suspense, useState } from "react";
import { useOnline } from "../../hooks/useOnline";
import { addGeneratedReviewers } from "./schema";
import type { StudyData } from "../../types/study";

const AiAssistant = lazy(() => import("./AiAssistant"));

export function OnlineAssistant({ data, update }: { data: StudyData; update: (data: StudyData) => boolean }) {
  const online = useOnline();
  // Unmounting cancels pending requests and discards unsaved AI content.
  return online ? <AssistantLauncher data={data} update={update} /> :
    <p className="mb-4 text-xs text-stone-500" role="status">You’re offline. Your saved study tools are available.</p>;
}

function AssistantLauncher({ data, update }: { data: StudyData; update: (data: StudyData) => boolean }) {
  const [open, setOpen] = useState(false);
  return <>
    <div className="mb-4 flex justify-end">
      <button className="text-button" onClick={() => setOpen(true)}>AI study assistant</button>
    </div>
    {open && <Suspense fallback={<p role="status">Opening your assistant…</p>}>
      <AiAssistant onClose={() => setOpen(false)} onSave={(topic, drafts) => update(addGeneratedReviewers(data, topic, drafts))} />
    </Suspense>}
  </>;
}
