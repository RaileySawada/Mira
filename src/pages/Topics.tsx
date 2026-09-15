import { confirmAction } from "../components/confirmAction";
import { useActionFeedback } from "../hooks/useActionFeedback";
import { ProcessButton } from "../components/ProcessButton";
import { useState } from "react";
import type { StudyData, Topic } from "../types/study";
import { EmptyState, Modal, PageHeading } from "../components/ui";
import { Icon } from "../components/Icon";
export function Topics({
  data,
  update,
}: {
  data: StudyData;
  update: (d: StudyData) => boolean;
}) {
  const save = useActionFeedback();
  const [editing, setEditing] = useState<Topic | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8d80b5");
  function open(topic: Topic) {
    save.reset();
    setEditing(topic);
    setName(topic.name);
    setColor(topic.color);
  }
  return (
    <>
      <PageHeading
        eyebrow="A PLACE FOR EVERYTHING"
        title="Follow your curiosity."
        description="Give your reviewers a home. Organize them into topics that make sense to you."
        action={
          <button
            className="button primary"
            onClick={() => open({ id: "", name: "", color: "#8d80b5" })}
          >
            <Icon name="plus" size={16} /> New topic
          </button>
        }
      />
      {data.topics.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.topics.map((s) => (
            <article key={s.id} className="panel p-6">
              <h2 className="text-lg font-semibold">{s.name}</h2>
              <p className="mt-2 text-sm text-stone-500">
                {data.reviewers.filter((r) => r.topicId === s.id).length}{" "}
                reviewers
              </p>
              <div className="mt-6 flex gap-4 text-xs text-stone-500">
                <button onClick={() => open(s)}>Edit topic</button>
                <button
                  onClick={async () => {
                    if (
                      await confirmAction(
                        `Delete “${s.name}”? Its reviewers will move to Uncategorized.`,
                      )
                    )
                      update({
                        ...data,
                        topics: data.topics.filter((item) => item.id !== s.id),
                        reviewers: data.reviewers.map((r) =>
                          r.topicId === s.id ? { ...r, topicId: "" } : r,
                        ),
                      });
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="So much to be curious about"
          description="Biology, literature, that new language… create a topic and start connecting the dots."
        />
      )}
      {editing && (
        <Modal
          title={editing.id ? "Edit topic" : "Create a topic"}
          onClose={() => { save.reset(); setEditing(null); }}
        >
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              const topic = {
                id: editing.id || crypto.randomUUID(),
                name: name.trim(),
                color,
              };
              void save.run(() => update({
                  ...data,
                  topics: editing.id
                    ? data.topics.map((s) => (s.id === editing.id ? topic : s))
                    : [...data.topics, topic],
                }), () => setEditing(null));
            }}
          >
            <label className="field">
              Topic name
              <input
                autoFocus
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Biology"
              />
            </label>
            <label className="field">
              Topic color
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
            {save.error && <p role="alert" className="text-sm text-red-600">{save.error}</p>}
            <ProcessButton label="Save topic" state={save.state} successLabel="Saved" />
          </form>
        </Modal>
      )}
    </>
  );
}
