import { useActionFeedback } from "../../hooks/useActionFeedback";
import { ProcessButton } from "../../components/ProcessButton";
import { useId, useState } from "react";
import type { Card, Reviewer, Topic, Folder } from "../../types/study";
import { SearchSelect } from "../../components/SearchSelect";
import { Icon } from "../../components/Icon";
import { Modal } from "../../components/ui";
export function ReviewerEditor({
  reviewer,
  topics,
  folders = [],
  onSave,
  onClose,
}: {
  reviewer?: Reviewer;
  topics: Topic[];
  folders?: Folder[];
  onSave: (reviewer: Reviewer, topic?: Topic) => boolean | Promise<boolean>;
  onClose: () => void;
}) {
  const formId = useId();
  const save = useActionFeedback();
  const [title, setTitle] = useState(reviewer?.title || "");
  const [description, setDescription] = useState(reviewer?.description || "");
  const [topicId, setTopicId] = useState(reviewer?.topicId || "");
  const [folderId, setFolderId] = useState(reviewer?.folderId ?? "");
  const [addingTopic, setAddingTopic] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [topicColor, setTopicColor] = useState("#8d80b5");
  const [cards, setCards] = useState<Card[]>(
    reviewer?.cards.length
      ? reviewer.cards
      : [{ id: crypto.randomUUID(), question: "", answer: "" }],
  );
  function editCard(id: string, field: "question" | "answer", value: string) {
    setCards(cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }
  return (
    <Modal
      title={reviewer ? "Edit reviewer" : "Start a new chapter"}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <ProcessButton
            type="submit"
            form={formId}
            label="Save reviewer"
            state={save.state}
            successLabel="Saved"
          />
        </div>
      }
    >
      <form
        id={formId}
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !title.trim() ||
            cards.some((c) => !c.question.trim() || !c.answer.trim())
          )
            return;
          let selectedTopicId = topicId;
          let newTopic: Topic | undefined;
          if (addingTopic) {
            if (!topicName.trim()) return;
            const existing = topics.find(
              (topic) =>
                topic.name.trim().toLocaleLowerCase() ===
                topicName.trim().toLocaleLowerCase(),
            );
            if (existing) selectedTopicId = existing.id;
            else {
              newTopic = {
                id: crypto.randomUUID(),
                name: topicName.trim(),
                color: topicColor,
              };
              selectedTopicId = newTopic.id;
            }
          }
          void save.run(
            () =>
              onSave(
                {
                  id: reviewer?.id || crypto.randomUUID(),
                  title: title.trim(),
                  description: description.trim(),
                  topicId: selectedTopicId,
                  ...(folderId
                    ? { folderId }
                    : reviewer?.folderId
                      ? { folderId: "" }
                      : {}),
                  cards: cards.map((c) => ({
                    ...c,
                    question: c.question.trim(),
                    answer: c.answer.trim(),
                    ...(c.acceptedAnswers
                      ? {
                          acceptedAnswers: [
                            ...new Set(
                              c.acceptedAnswers
                                .map((answer) => answer.trim())
                                .filter(Boolean),
                            ),
                          ],
                        }
                      : {}),
                  })),
                  updatedAt: new Date().toISOString(),
                },
                newTopic,
              ),
            onClose,
          );
        }}
      >
        {save.error && (
          <p role="alert" className="text-sm text-red-600">
            {save.error}
          </p>
        )}
        <label className="field">
          Reviewer title
          <input
            autoFocus
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The wonders of cell biology"
          />
        </label>
        <label className="field">
          Description
          <textarea
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will you learn?"
            rows={2}
          />
        </label>
        <div className="field">
          <span>Folder</span>
          <SearchSelect
            label="Folder"
            value={folderId}
            onChange={setFolderId}
            options={[
              { value: "", label: "No folder" },
              ...folders.map((folder) => ({
                value: folder.id,
                label: folder.name,
              })),
            ]}
          />
        </div>
        <div className="field">
          <span>Topic</span>
          <SearchSelect
            label="Topic"
            disabled={addingTopic}
            value={topicId}
            onChange={setTopicId}
            options={[
              { value: "", label: "Uncategorized" },
              ...topics.map((topic) => ({
                value: topic.id,
                label: topic.name,
              })),
            ]}
          />
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() => setAddingTopic(!addingTopic)}
        >
          {addingTopic
            ? "Choose an existing topic instead"
            : "+ Create a new topic"}
        </button>
        {addingTopic && (
          <div className="rounded-xl border border-line bg-soft p-4">
            <div className="flex items-start gap-4">
              <label className="field flex-1">
                New topic name
                <input
                  autoFocus
                  required
                  maxLength={100}
                  value={topicName}
                  onChange={(event) => setTopicName(event.target.value)}
                  placeholder="e.g. Human anatomy"
                />
              </label>
              <label className="field">
                Color
                <input
                  type="color"
                  value={topicColor}
                  onChange={(event) => setTopicColor(event.target.value)}
                  className="h-10 w-12 cursor-pointer"
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-stone-500">
              Your topic will be created when you save this reviewer. An
              existing name will reuse that topic.
            </p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Flashcards</h3>
          <span className="text-xs text-stone-400">
            {cards.length} card{cards.length === 1 ? "" : "s"}
          </span>
        </div>
        {cards.map((c, i) => (
          <div className="panel space-y-3 p-4" key={c.id}>
            <div className="flex justify-between">
              <span className="eyebrow">
                CARD {String(i + 1).padStart(2, "0")}
              </span>
              <button
                type="button"
                className="text-xs text-stone-500 disabled:opacity-30"
                disabled={cards.length === 1}
                onClick={() =>
                  setCards(cards.filter((card) => card.id !== c.id))
                }
              >
                Remove
              </button>
            </div>
            <label className="field">
              Question / term
              <textarea
                required
                maxLength={5000}
                rows={2}
                value={c.question}
                onChange={(e) => editCard(c.id, "question", e.target.value)}
                placeholder="What would you like to remember?"
              />
            </label>
            <label className="field">
              Answer / definition
              <textarea
                required
                maxLength={5000}
                rows={2}
                value={c.answer}
                onChange={(e) => editCard(c.id, "answer", e.target.value)}
                placeholder="The answer goes here…"
              />
            </label>
            <details>
              <summary className="text-xs text-stone-500">
                Accepted alternative answers (optional)
              </summary>
              <label className="field mt-3">
                One alternative per line
                <textarea
                  rows={2}
                  maxLength={10000}
                  value={(c.acceptedAnswers ?? []).join("\n")}
                  onChange={(e) =>
                    setCards(
                      cards.map((card) =>
                        card.id === c.id
                          ? {
                              ...card,
                              acceptedAnswers: e.target.value.split("\n"),
                            }
                          : card,
                      ),
                    )
                  }
                />
              </label>
            </details>
          </div>
        ))}
        <button
          type="button"
          className="button secondary w-full"
          onClick={() =>
            setCards([
              ...cards,
              { id: crypto.randomUUID(), question: "", answer: "" },
            ])
          }
        >
          <Icon name="plus" size={16} /> Add a flashcard
        </button>
      </form>
    </Modal>
  );
}
