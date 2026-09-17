import { useViewPreference } from "../hooks/useViewPreference";
import { useState } from "react";
import type { Reviewer, StudyData } from "../types/study";
import { SearchSelect } from "../components/SearchSelect";
import { Icon } from "../components/Icon";
import { EmptyState, PageHeading } from "../components/ui";
import { ViewToggle } from "../components/ViewToggle";

export function Reviewers({ data, onCreate, onEdit, onDelete, onStudy, onQuiz }: { data: StudyData; onCreate: () => void; onEdit: (r: Reviewer) => void; onDelete: (r: Reviewer) => void; onStudy: (r: Reviewer) => void; onQuiz: (r: Reviewer) => void }) {
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [folder, setFolder] = useState("all");
  const { view, setView, error: layoutError } = useViewPreference("reviewers");
  const reviewers = data.reviewers.filter(reviewer => (reviewer.title + " " + reviewer.description).toLowerCase().includes(search.toLowerCase()) && (topic === "all" || reviewer.topicId === topic) && (folder === "all" || (reviewer.folderId ?? "") === folder));
  return <>
    {layoutError && <p role="status" className="mb-4 text-xs text-stone-500">{layoutError}</p>}
    <PageHeading eyebrow="YOUR PERSONAL LIBRARY" title="Room for every little discovery." description="Collect your knowledge. Find your rhythm. Make it stick." />
    <div className="reviewer-toolbar mb-6 flex items-start gap-2 sm:gap-3">
      <label className="relative min-w-0 flex-1"><Icon name="search" style={{ position: "absolute", left: 13, top: 12, color: "#a8a29e" }} size={18} /><input className="input w-full pl-10" aria-label="Search reviewers" placeholder="Find a reviewer…" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <SearchSelect label="Filter by topic" className="toolbar-filter w-[38%] max-w-56 shrink-0" value={topic} onChange={setTopic} options={[{ value: "all", label: "All topics" }, { value: "", label: "Uncategorized" }, ...data.topics.map(item => ({ value: item.id, label: item.name }))]} />
      <ViewToggle value={view} onChange={setView} label="Reviewer layout" />
      <button className="button primary toolbar-create" onClick={onCreate} aria-label="New reviewer"><Icon name="plus" size={16} /><span className="hidden sm:inline">New reviewer</span></button>
    </div>
    {Boolean(data.folders?.length) && <div className="mb-5 max-w-xs"><SearchSelect label="Filter by folder" value={folder} onChange={setFolder} options={[{ value: "all", label: "All folders" }, { value: "", label: "Unfiled" }, ...(data.folders ?? []).map(item => ({ value: item.id, label: item.name }))]} /></div>}
    {reviewers.length ? <div className={view === "grid" ? "reviewer-collection reviewer-grid" : "reviewer-collection reviewer-list"}>
      {reviewers.map(reviewer => {
        const currentTopic = data.topics.find(item => item.id === reviewer.topicId);
        return <article className="panel reviewer-card" key={reviewer.id}>
          <div className="reviewer-card-main"><span className="badge"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: currentTopic?.color || "#a8a29e" }} />{currentTopic?.name || "Uncategorized"}</span><h2>{reviewer.title}</h2><p>{reviewer.description || "A little collection of things worth remembering."}</p><small>{reviewer.cards.length} flashcards · Updated {new Date(reviewer.updatedAt).toLocaleDateString()}</small></div>
          <div className="reviewer-card-actions"><div><button className="button primary" disabled={!reviewer.cards.length} onClick={() => onStudy(reviewer)}>Study cards</button><button className="button secondary" disabled={!reviewer.cards.length} onClick={() => onQuiz(reviewer)}>Take quiz</button></div><p><button onClick={() => onEdit(reviewer)}>Edit</button><button onClick={() => onDelete(reviewer)}>Delete</button></p></div>
        </article>;
      })}
    </div> : <EmptyState title={data.reviewers.length ? "No matches just yet" : "Every expert starts with a first card"} description={data.reviewers.length ? "Try a different search or topic." : "Turn your notes into a reviewer, then practice with flashcards and written quizzes."} action={<button className="button primary" onClick={onCreate}>Create reviewer</button>} />}
  </>;
}
