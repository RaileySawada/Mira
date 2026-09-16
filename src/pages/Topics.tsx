import { confirmAction } from "../components/confirmAction";
import { useActionFeedback } from "../hooks/useActionFeedback";
import { useState } from "react";
import type { StudyData, Topic } from "../types/study";
import { EmptyState, Modal, PageHeading } from "../components/ui";
import { Icon } from "../components/Icon";
import { ViewToggle, type ViewMode } from "../components/ViewToggle";
import { ProcessButton } from "../components/ProcessButton";

export function Topics({ data, update }: { data: StudyData; update: (d: StudyData) => boolean }) {
  const save = useActionFeedback();
  const [view, setView] = useState<ViewMode>("grid");
  const [editing, setEditing] = useState<Topic | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8d80b5");
  function open(topic: Topic) { save.reset(); setEditing(topic); setName(topic.name); setColor(topic.color); }
  return <>
    <PageHeading eyebrow="A PLACE FOR EVERYTHING" title="Follow your curiosity." description="Give your reviewers a home. Organize them into topics that make sense to you." action={<div className="page-heading-actions"><ViewToggle value={view} onChange={setView} label="Topic layout" /><button className="button primary" onClick={() => open({ id: "", name: "", color: "#8d80b5" })}><Icon name="plus" size={16} /> New topic</button></div>} />
    {data.topics.length ? <div className={view === "grid" ? "topic-collection topic-grid" : "topic-collection topic-list"}>
      {data.topics.map(topic => {
        const count = data.reviewers.filter(reviewer => reviewer.topicId === topic.id).length;
        return <article key={topic.id} className="panel topic-card">
          <span className="topic-color" style={{ backgroundColor: topic.color }} aria-hidden="true" />
          <div className="topic-card-main"><h2>{topic.name}</h2><p>{count} reviewer{count === 1 ? "" : "s"}</p></div>
          <div className="topic-card-actions"><button onClick={() => open(topic)}>Edit topic</button><button onClick={async () => {
            if (await confirmAction("Delete “" + topic.name + "”? Its reviewers will move to Uncategorized.")) update({ ...data, topics: data.topics.filter(item => item.id !== topic.id), reviewers: data.reviewers.map(reviewer => reviewer.topicId === topic.id ? { ...reviewer, topicId: "" } : reviewer) });
          }}>Delete</button></div>
        </article>;
      })}
    </div> : <EmptyState title="So much to be curious about" description="Biology, literature, that new language… create a topic and start connecting the dots." />}
    {editing && <Modal title={editing.id ? "Edit topic" : "Create a topic"} onClose={() => { save.reset(); setEditing(null); }}>
      <form className="space-y-5" onSubmit={event => { event.preventDefault(); if (!name.trim()) return; const topic = { id: editing.id || crypto.randomUUID(), name: name.trim(), color }; void save.run(() => update({ ...data, topics: editing.id ? data.topics.map(item => item.id === editing.id ? topic : item) : [...data.topics, topic] }), () => setEditing(null)); }}>
        <label className="field">Topic name<input autoFocus required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Biology" /></label>
        <label className="field">Topic color<input type="color" value={color} onChange={event => setColor(event.target.value)} /></label>
        {save.error && <p role="alert" className="text-sm text-red-600">{save.error}</p>}
        <ProcessButton label="Save topic" state={save.state} successLabel="Saved" />
      </form>
    </Modal>}
  </>;
}
