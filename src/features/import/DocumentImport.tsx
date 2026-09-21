import { useRef, useState } from "react";
import { extractDocument, parseCsv } from "./documents";
import { Modal } from "../../components/ui";
import { ProcessButton } from "../../components/ProcessButton";
import { useActionFeedback } from "../../hooks/useActionFeedback";
import type { Reviewer } from "../../types/study";
export function DocumentImport({
  onReviewer,
}: {
  onReviewer: (reviewer: Reviewer) => void;
}) {
  const [share, setShare] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState(false);
  const [error, setError] = useState("");
  const action = useActionFeedback();
  async function load(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (file.size > 1000000)
        throw new Error("Choose a document smaller than 1 MB.");
      const document = extractDocument(file.name, await file.text());
      setShare(false);
      setText(document.text);
      setName(file.name.replace(/\.[^.]+$/, ""));
      setCsv(/\.csv$/i.test(file.name));
      setOpen(true);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not read this document.",
      );
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  return (
    <>
      <button
        type="button"
        className="button secondary"
        onClick={() => input.current?.click()}
      >
        Import notes
      </button>
      <input
        ref={input}
        type="file"
        accept=".txt,.md,.markdown,.csv"
        className="hidden"
        aria-label="Import local notes"
        onChange={(e) => void load(e.target.files?.[0])}
      />
      {error && <p role="alert">{error}</p>}
      {open && (
        <Modal title="Preview imported notes" onClose={() => setOpen(false)}>
          <p className="mb-3 text-sm">
            Everything stays on this device. Edit or remove content before
            creating your reviewer. CSV uses question and answer columns.
          </p>
          <label className="field">
            Reviewer title
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
            />
          </label>
          <label className="field mt-3">
            Selected content
            <textarea
              rows={10}
              value={text}
              maxLength={1000000}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <p className="mt-2 text-xs">
            For TXT and Markdown, the selection becomes the first answer so you
            can write questions in the editor. PDF extraction is not supported;
            export it as text first.
          </p>
          {action.error && <p role="alert">{action.error}</p>}
          <ProcessButton
            className="button primary mt-4"
            type="button"
            label="Create reviewer locally"
            state={action.state}
            onClick={() =>
              void action.run(() => {
                if (!name.trim() || !text.trim())
                  throw new Error("Add a title and content.");
                const cards = csv
                  ? parseCsv(text)
                  : [
                      {
                        question: "What are the key ideas in these notes?",
                        answer: text.slice(0, 5000),
                      },
                    ];
                if (!csv && text.length > 5000)
                  throw new Error(
                    "Select up to 5,000 characters for one card, or split the notes into CSV rows.",
                  );
                onReviewer({
                  id: crypto.randomUUID(),
                  title: name.trim(),
                  description: "Imported locally",
                  topicId: "",
                  updatedAt: new Date().toISOString(),
                  cards: cards.map((c) => ({ ...c, id: crypto.randomUUID() })),
                });
                setOpen(false);
              })
            }
          />
          {navigator.onLine && (
            <div className="mt-4">
              <label className="text-xs">
                <input
                  type="checkbox"
                  checked={share}
                  onChange={(e) => setShare(e.target.checked)}
                />{" "}
                Use this selected text with Pollinations when I submit in Mira.
                Only the first 3,000 characters are included.
              </label>
              <button
                className="button secondary mt-2"
                disabled={!share || !text.trim()}
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("mira:import-notes", {
                      detail: text.slice(0, 3000),
                    }),
                  );
                  setOpen(false);
                }}
              >
                Generate with Mira
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
