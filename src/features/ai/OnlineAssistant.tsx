import { applyLibraryActions } from "./libraryActions";
import { AssistantSkeleton } from "./AssistantSkeleton";
import { navigate } from "../../hooks/usePage";
import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { useOnline } from "../../hooks/useOnline";
import { addGeneratedReviewers } from "./schema";
import miraAvatar from "../../assets/images/profile_pictures/mira.png";
import type { StudyData } from "../../types/study";

const AiAssistant = lazy(() => import("./AiAssistant"));

export function OnlineAssistant({
  data,
  update,
  pageMode = false,
}: {
  pageMode?: boolean;
  data: StudyData;
  update: (data: StudyData) => boolean | Promise<boolean>;
}) {
  const online = useOnline();
  return (
    <>
      <AssistantLauncher
        data={data}
        update={update}
        online={online}
        pageMode={pageMode}
      />
      {!online && (
        <p
          className={
            pageMode
              ? "mx-auto my-auto max-w-md p-8 text-center text-sm text-stone-500"
              : "mb-4 text-xs text-stone-500"
          }
          role="status"
        >
          You’re offline. Your saved study tools are available. Your open
          conversation will return when you reconnect.
        </p>
      )}
    </>
  );
}

function AssistantLauncher({
  data,
  update,
  online,
  pageMode = false,
}: {
  data: StudyData;
  update: (data: StudyData) => boolean | Promise<boolean>;
  online: boolean;
  pageMode?: boolean;
}) {
  const [importedNotes, setImportedNotes] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (navigator.onLine && typeof detail === "string") {
        setImportedNotes(detail.slice(0, 3000));
        setOpen(true);
      }
    };
    window.addEventListener("mira:import-notes", receive);
    return () => window.removeEventListener("mira:import-notes", receive);
  }, []);
  const [introducing, setIntroducing] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setIntroducing(false), 3500);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <>
      {online && !open && !pageMode && (
        <button
          ref={trigger}
          className={"ai-launcher" + (introducing ? " is-introducing" : "")}
          title="Ask Mira"
          onClick={() => {
            setIntroducing(false);
            setOpen(true);
          }}
          aria-label="AI study assistant"
          aria-haspopup="dialog"
        >
          <img src={miraAvatar} alt="" />
          <span className="ai-launcher-label" aria-hidden="true">
            Ask Mira
          </span>
        </button>
      )}
      {(open || pageMode) && (
        <Suspense fallback={<AssistantSkeleton pageMode={pageMode} />}>
          <AiAssistant
            key={importedNotes}
            presentation={pageMode ? "page" : "floating"}
            studyData={data}
            importedNotes={importedNotes}
            onGuidance={() => {
              update({
                ...data,
                milestones: { ...data.milestones, askedMira: true },
              });
            }}
            online={online}
            onClose={() => {
              setOpen(false);
              if (pageMode) navigate("Home");
              setImportedNotes("");
              requestAnimationFrame(() => trigger.current?.focus());
            }}
            onApplyActions={(actions) =>
              update(applyLibraryActions(data, actions))
            }
            onSave={(topic, drafts, folder) =>
              update(addGeneratedReviewers(data, topic, drafts, folder))
            }
          />
        </Suspense>
      )}
    </>
  );
}
