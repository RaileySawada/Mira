import { FolderOpen, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Folder, Reviewer, StudyData } from "../types/study";
import { EmptyState, Modal, PageHeading } from "../components/ui";
import { SearchSelect } from "../components/SearchSelect";
import { ProcessButton } from "../components/ProcessButton";
import { useActionFeedback } from "../hooks/useActionFeedback";
import { confirmAction } from "../components/confirmAction";

export function Folders({ data, update, onEdit, onStudy }: {
  data: StudyData; update: (next: StudyData) => boolean;
  onEdit: (reviewer: Reviewer) => void; onStudy: (reviewer: Reviewer) => void;
}) {
  const folders = data.folders ?? [];
  const [foldersOpen, setFoldersOpen] = useState(false);
  const folderPicker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!foldersOpen) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !folderPicker.current?.contains(event.target)) setFoldersOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [foldersOpen]);
  function selectFolder(id: string) { setSelected(id); setFoldersOpen(false); }
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState("");
  const [editing, setEditing] = useState<Folder | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const save = useActionFeedback();
  const counts = useMemo(() => {
    const totals = new Map<string, number>();
    for (const reviewer of data.reviewers) {
      const id = reviewer.folderId ?? "";
      totals.set(id, (totals.get(id) ?? 0) + 1);
    }
    return totals;
  }, [data.reviewers]);
  const filtered = useMemo(() => [...(data.folders ?? [])].reverse().filter(folder => folder.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())), [data.folders, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / 5));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 5, currentPage * 5);
  const selectedFolder = folders.find(folder => folder.id === selected);
  const reviewers = data.reviewers.filter(reviewer => (reviewer.folderId ?? "") === selected);
  function edit(folder: Folder) { save.reset(); setEditing(folder); setName(folder.name); }
  function persist(next: StudyData) {
    const saved = update(next);
    setError(saved ? "" : "Your folder changes could not be saved. Please try again.");
    return saved;
  }
  return <>
    <PageHeading eyebrow="YOUR LIBRARY, ORGANIZED" title="Your folders." description="Keep your reviewers organized by course, exam, or project." action={<button className="button primary" onClick={() => edit({ id: "", name: "" })}>New folder</button>} />
    {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
    <div className="folder-layout">
      <div ref={folderPicker} className="folder-picker" onKeyDown={event => { if (event.key === "Escape") { setFoldersOpen(false); event.currentTarget.querySelector<HTMLButtonElement>(".folder-picker-trigger")?.focus(); } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFoldersOpen(false); }}>
      <button type="button" className="folder-picker-trigger" aria-label="Browse folders" aria-expanded={foldersOpen} aria-controls="folder-navigation" onClick={() => setFoldersOpen(open => !open)}><FolderOpen size={18} aria-hidden="true" /><span>{selectedFolder?.name ?? "Unfiled"}</span><ChevronDown size={16} aria-hidden="true" /></button>
      <nav id="folder-navigation" data-open={foldersOpen} aria-label="Reviewer folders" className="panel folder-navigation">
        <label className="folder-search"><span className="sr-only">Search folders</span><input className="input" type="search" placeholder="Find a folder…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>
        <p className="folder-result-count" role="status">{filtered.length} {filtered.length === 1 ? "folder" : "folders"} · Newest added first</p>
        <button className="folder-link" aria-current={selected === "" ? "page" : undefined} onClick={() => selectFolder("")}>Unfiled <span>{counts.get("") ?? 0}</span></button>
        {selectedFolder && !visible.some(folder => folder.id === selected) && <div className="folder-pinned"><small>Selected folder</small><button className="folder-link" aria-current="page" onClick={() => { setSearch(""); setPage(Math.floor((folders.length - 1 - folders.findIndex(folder => folder.id === selected)) / 5) + 1); }}><span className="folder-name">{selectedFolder.name}</span><span>{counts.get(selected) ?? 0}</span></button></div>}
        {visible.map(folder => <div key={folder.id} className="folder-row">
          <button className="folder-link" aria-current={selected === folder.id ? "page" : undefined} onClick={() => selectFolder(folder.id)}><span className="folder-name">{folder.name}</span><span>{counts.get(folder.id) ?? 0}</span></button>
          <button className="icon-button folder-action" aria-label={"Rename " + folder.name} onClick={() => edit(folder)}><Pencil size={14} aria-hidden="true" /></button>
          <button className="icon-button folder-action" aria-label={"Delete " + folder.name} onClick={async () => {
            if (!await confirmAction("Delete this folder? Its reviewers will move to Unfiled.")) return;
            if (persist({ ...data, folders: folders.filter(item => item.id !== folder.id), reviewers: data.reviewers.map(r => r.folderId === folder.id ? { ...r, folderId: "" } : r) }) && selected === folder.id) setSelected("");
          }}><Trash2 size={14} aria-hidden="true" /></button>
        </div>)}
        {!filtered.length && <p className="folder-no-results">{search.trim() ? "No matching folders. Try another name." : "Create a folder to organize your reviewers."}</p>}
        {pages > 1 && <div className="folder-pagination">
          <button className="icon-button" aria-label="Previous folder page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>←</button>
          <span>Page {currentPage} of {pages}</span>
          <button className="icon-button" aria-label="Next folder page" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>→</button>
        </div>}
      </nav>
      </div>
      <section className="min-w-0" aria-label="Folder contents">
        <h2 className="section-title mb-3">{folders.find(folder => folder.id === selected)?.name ?? "Unfiled"}</h2>
        {reviewers.length ? <div className="folder-reviewers">{reviewers.map(reviewer => <article className="panel folder-reviewer" key={reviewer.id}>
          <div className="folder-reviewer-info"><h3>{reviewer.title}</h3><p>{reviewer.cards.length} cards</p></div>
          <div className="folder-reviewer-tools">
          <SearchSelect label={"Move " + reviewer.title + " to folder"} value={reviewer.folderId ?? ""} onChange={folderId => persist({ ...data, reviewers: data.reviewers.map(r => r.id === reviewer.id ? { ...r, folderId } : r) })} options={[{ value: "", label: "Unfiled" }, ...folders.map(folder => ({ value: folder.id, label: folder.name }))]} />
          <button className="row-icon-action" onClick={() => onEdit(reviewer)} aria-label="Edit reviewer" title="Edit reviewer"><Pencil size={16} aria-hidden="true" /></button><button className="button primary" disabled={!reviewer.cards.length} onClick={() => onStudy(reviewer)}>Study cards</button></div>
        </article>)}</div> : <EmptyState title="This folder is ready for your notes" description="Move reviewers here from Unfiled, or choose this folder when creating or editing a reviewer." />}
      </section>
    </div>
    {editing && <Modal title={editing.id ? "Rename folder" : "New folder"} onClose={() => setEditing(null)}>
      <form className="space-y-4" onSubmit={event => {
        event.preventDefault();
        if (!name.trim()) return;
        void save.run(() => {
          if (folders.some(folder => folder.id !== editing.id && folder.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase())) throw new Error("A folder with this name already exists.");
          const folder = { id: editing.id || crypto.randomUUID(), name: name.trim() };
          const saved = persist({ ...data, folders: editing.id ? folders.map(item => item.id === folder.id ? folder : item) : [...folders, folder] });
          if (saved && !editing.id) {
            setSelected(folder.id);
            setSearch("");
            setPage(1);
          }
          return saved;
        }, () => setEditing(null));
      }}>
        <label className="field">Folder name<input required maxLength={100} value={name} onChange={event => setName(event.target.value)} autoFocus /></label>
        {save.error && <p role="alert" className="text-sm text-red-600">{save.error}</p>}
        <ProcessButton label="Save folder" state={save.state} />
      </form>
    </Modal>}
  </>;
}
