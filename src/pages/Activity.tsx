import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { EmptyState, PageHeading } from "../components/ui";
import type { Attempt, StudyData } from "../types/study";

type SortKey = "title" | "mode" | "date" | "result";
type SortDirection = "ascending" | "descending";
const PAGE_SIZE = 8;

function result(attempt: Attempt) { return Math.round((attempt.correct / attempt.total) * 100); }
function compareAttempt(a: Attempt, b: Attempt, key: SortKey) {
  if (key === "title") return a.title.localeCompare(b.title);
  if (key === "mode") return a.mode.localeCompare(b.mode);
  if (key === "result") return result(a) - result(b);
  return a.date.localeCompare(b.date);
}

export function Activity({ data }: { data: StudyData }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("descending");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => data.attempts.filter(attempt => (attempt.title + " " + attempt.mode).toLowerCase().includes(search.trim().toLowerCase())), [data.attempts, search]);
  const attempts = useMemo(() => [...filtered].sort((a, b) => {
    const order = compareAttempt(a, b, sortKey);
    return sortDirection === "ascending" ? order : -order;
  }), [filtered, sortDirection, sortKey]);
  const pages = Math.max(1, Math.ceil(attempts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = attempts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  function sort(key: SortKey) {
    setPage(1);
    if (key === sortKey) setSortDirection(direction => direction === "ascending" ? "descending" : "ascending");
    else { setSortKey(key); setSortDirection(key === "date" ? "descending" : "ascending"); }
  }
  function changeSearch(value: string) { setSearch(value); setPage(1); }
  return <>
    <PageHeading eyebrow="LOOK HOW FAR YOU’VE COME" title="Your learning story." description="Every completed quiz, every small win. All in one place." />
    {data.attempts.length ? <section className="activity-table panel">
      <div className="data-table-toolbar">
        <label className="data-table-search"><Icon name="search" size={16} /><span className="sr-only">Search activity</span><input value={search} onChange={event => changeSearch(event.target.value)} placeholder="Search results…" /></label>
        <span className="data-table-count">{attempts.length} result{attempts.length === 1 ? "" : "s"}</span>
      </div>
      <div className="data-table-scroll">
        <table>
          <thead><tr>
            <SortableHeader label="Reviewer" column="title" active={sortKey} direction={sortDirection} onSort={sort} />
            <SortableHeader label="Type" column="mode" active={sortKey} direction={sortDirection} onSort={sort} />
            <SortableHeader label="Date" column="date" active={sortKey} direction={sortDirection} onSort={sort} />
            <SortableHeader label="Result" column="result" active={sortKey} direction={sortDirection} onSort={sort} />
          </tr></thead>
          <tbody>{visible.map(attempt => <tr key={attempt.id} className="data-table-row">
            <td className="activity-title">{attempt.title}</td>
            <td><span className="activity-type">{attempt.mode === "daily" ? "Daily review" : "Quiz"}</span></td>
            <td className="activity-date">{new Date(attempt.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
            <td><span className="badge">{result(attempt)}%</span><span className="activity-score">{attempt.correct}/{attempt.total}</span></td>
          </tr>)}</tbody>
        </table>
      </div>
      {attempts.length ? <div className="data-table-pagination">
        <span>Page {currentPage} of {pages}</span>
        <div><button type="button" className="icon-button" aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><Icon name="previous" size={17} /></button><button type="button" className="icon-button" aria-label="Next page" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><Icon name="next" size={17} /></button></div>
      </div> : <p className="data-table-empty">No activity matches “{search}”.</p>}
    </section> : <EmptyState title="Your story is just beginning" description="Finish a quiz or daily review and your results will appear here. There’s no rush — just a next step." />}
  </>;
}
function SortableHeader({ label, column, active, direction, onSort }: { label: string; column: SortKey; active: SortKey; direction: SortDirection; onSort: (column: SortKey) => void }) {
  const selected = active === column;
  return <th aria-sort={selected ? direction : "none"}><button type="button" onClick={() => onSort(column)}>{label}<Icon name={selected && direction === "ascending" ? "up" : "down"} size={14} /></button></th>;
}
