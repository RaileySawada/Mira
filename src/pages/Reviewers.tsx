import { useState } from "react";
import type { Reviewer, StudyData } from "../types/study";
import { Icon } from "../components/Icon";
import { EmptyState, PageHeading } from "../components/ui";
export function Reviewers({
  data,
  onCreate,
  onEdit,
  onDelete,
  onStudy,
  onQuiz,
}: {
  data: StudyData;
  onCreate: () => void;
  onEdit: (r: Reviewer) => void;
  onDelete: (r: Reviewer) => void;
  onStudy: (r: Reviewer) => void;
  onQuiz: (r: Reviewer) => void;
}) {
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const reviewers = data.reviewers.filter(
    (r) =>
      `${r.title} ${r.description}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (topic === "all" || r.topicId === topic),
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR PERSONAL LIBRARY"
        title="Room for every little discovery."
        description="Collect your knowledge. Find your rhythm. Make it stick."
        action={
          <button className="button primary" onClick={onCreate}>
            <Icon name="plus" size={16} /> New reviewer
          </button>
        }
      />
      <div className="mb-6 flex flex-wrap gap-3">
        <label className="relative min-w-52 flex-1">
          <Icon
            name="search"
            style={{
              position: "absolute",
              left: 13,
              top: 12,
              color: "#a8a29e",
            }}
            size={18}
          />
          <input
            className="input w-full pl-10"
            aria-label="Search reviewers"
            placeholder="Find a reviewer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          className="input"
          aria-label="Filter by topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          <option value="all">All topics</option>
          <option value="">Uncategorized</option>
          {data.topics.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      {reviewers.length ? (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {reviewers.map((r) => {
            const s = data.topics.find((s) => s.id === r.topicId);
            return (
              <article className="panel flex flex-col p-6" key={r.id}>
                <div className="flex items-center justify-between">
                  <span className="badge">
                    <span
                      className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: s?.color || "#a8a29e" }}
                    />
                    {s?.name || "Uncategorized"}
                  </span>
                </div>
                <h2 className="mt-5 text-lg font-semibold">{r.title}</h2>
                <p className="mt-2 flex-1 whitespace-pre-wrap text-sm leading-6 text-stone-500">
                  {r.description ||
                    "A little collection of things worth remembering."}
                </p>
                <p className="mt-5 text-xs text-stone-400">
                  {r.cards.length} flashcards · Updated{" "}
                  {new Date(r.updatedAt).toLocaleDateString()}
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    className="button primary flex-1"
                    disabled={!r.cards.length}
                    onClick={() => onStudy(r)}
                  >
                    Study cards
                  </button>
                  <button
                    className="button secondary flex-1"
                    disabled={!r.cards.length}
                    onClick={() => onQuiz(r)}
                  >
                    Take quiz
                  </button>
                </div>
                <div className="mt-4 flex justify-end gap-4 text-xs text-stone-500">
                  <button onClick={() => onEdit(r)}>Edit</button>
                  <button onClick={() => onDelete(r)}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={
            data.reviewers.length
              ? "No matches just yet"
              : "Every expert starts with a first card"
          }
          description={
            data.reviewers.length
              ? "Try a different search or topic."
              : "Turn your notes into a reviewer, then practice with flashcards and written quizzes."
          }
          action={
            <button className="button primary" onClick={onCreate}>
              Create reviewer
            </button>
          }
        />
      )}
    </>
  );
}
