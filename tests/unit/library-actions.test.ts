import {
  applyLibraryActions,
  describeLibraryAction,
  parseLibraryActions,
} from "../../src/features/ai/libraryActions";
import { addGeneratedReviewers } from "../../src/features/ai/generatedReviewers";
import { library, reviewer } from "../support/fixtures";
import { generated } from "../support/ai-fixtures";

test("creates destinations and moves reviewers without changing cards, IDs or history", () => {
  const data = library();
  const next = applyLibraryActions(data, [
    { kind: "create_folder", name: "Finals" },
    { kind: "move_reviewer", reviewer: "Cell biology", destination: "finals" },
    { kind: "set_topic", reviewer: "Cell biology", destination: "Science" },
    { kind: "rename_reviewer", reviewer: "Cell biology", destination: "Cells" },
  ]);
  expect(next.folders).toHaveLength(1);
  expect(next.reviewers[0]).toMatchObject({
    id: data.reviewers[0].id,
    title: "Cells",
    folderId: next.folders![0].id,
    topicId: next.topics[1].id,
  });
  expect(next.reviewers[0].cards).toEqual(data.reviewers[0].cards);
  expect(next.attempts).toBe(data.attempts);
  expect(data.reviewers[0].title).toBe("Cell biology");
  expect(data.folders ?? []).toHaveLength(0);
});
test("copies have new identities and can be moved back to Unfiled", () => {
  const data = library();
  const copied = applyLibraryActions(data, [
    {
      kind: "copy_reviewer",
      reviewer: "Cell biology",
      destination: "Revision",
    },
  ]);
  expect(copied.reviewers).toHaveLength(2);
  expect(copied.reviewers[1].id).not.toBe(data.reviewers[0].id);
  expect(copied.reviewers[1].cards[0].id).not.toBe(
    data.reviewers[0].cards[0].id,
  );
  const moved = applyLibraryActions(copied, [
    {
      kind: "move_reviewer",
      reviewer: "Cell biology",
      sourceFolder: "Revision",
      destination: "Unfiled",
    },
  ]);
  expect(moved.reviewers[1].folderId).toBeUndefined();
});
test("reuses topics and folders by trimmed case-insensitive name", () => {
  const data = library();
  const next = applyLibraryActions(data, [
    { kind: "create_topic", name: " biology " },
    { kind: "set_topic", reviewer: "Cell biology", destination: "Biology" },
  ]);
  expect(next.topics).toHaveLength(1);
});
test("failed plans do not partially mutate the source", () => {
  const data = library();
  const original = JSON.stringify(data);
  expect(() =>
    applyLibraryActions(data, [
      { kind: "create_folder", name: "New" },
      { kind: "move_reviewer", reviewer: "Missing", destination: "New" },
    ]),
  ).toThrow("Could not find");
  expect(JSON.stringify(data)).toBe(original);
  data.reviewers.push(reviewer({ id: "duplicate" }));
  expect(() =>
    applyLibraryActions(data, [
      { kind: "move_reviewer", reviewer: "Cell biology", destination: "New" },
    ]),
  ).toThrow("several reviewers");
});
test("ambiguous destination names are rejected", () => {
  const data = library();
  data.folders = [
    { id: "a", name: "Exam" },
    { id: "b", name: "Exam" },
  ];
  expect(() =>
    applyLibraryActions(data, [{ kind: "create_folder", name: "Exam" }]),
  ).toThrow("More than one folder");
  data.topics.push({ ...data.topics[0], id: "duplicate" });
  expect(() =>
    applyLibraryActions(data, [{ kind: "create_topic", name: "Biology" }]),
  ).toThrow("More than one topic");
});
test.each([
  null,
  [],
  Array(11).fill({}),
  [null],
  [{ kind: "delete_library" }],
  [{ kind: "create_folder", name: "" }],
  [{ kind: "move_reviewer", reviewer: "Cells", destination: "" }],
  [
    {
      kind: "set_topic",
      reviewer: "Cells",
      destination: "Bio",
      sourceFolder: 2,
    },
  ],
])("rejects malformed or unsupported actions %p", (value) => {
  expect(() => parseLibraryActions(value)).toThrow();
});
test("describes each operation for the preview", () => {
  expect(
    describeLibraryAction({ kind: "create_folder", name: "Finals" }),
  ).toContain("Create folder");
  expect(
    describeLibraryAction({ kind: "create_topic", name: "Biology" }),
  ).toContain("Create topic");
  for (const kind of [
    "move_reviewer",
    "copy_reviewer",
    "set_topic",
    "rename_reviewer",
  ] as const) {
    expect(
      describeLibraryAction({
        kind,
        reviewer: "Cells",
        destination: "New",
        sourceFolder: "Old",
      }),
    ).toContain("from “Old”");
    expect(
      describeLibraryAction({ kind, reviewer: "Cells", destination: "New" }),
    ).toContain("New");
  }
});
test("generated reviewers save to a new or existing folder", () => {
  const data = library();
  const first = addGeneratedReviewers(data, "Biology", [generated()], "Finals");
  expect(first.reviewers.at(-1)?.folderId).toBe(first.folders![0].id);
  const next = addGeneratedReviewers(first, "Biology", [generated()], "finals");
  expect(next.folders).toHaveLength(1);
  expect(next.reviewers.at(-1)?.folderId).toBe(first.folders![0].id);
  expect(() =>
    addGeneratedReviewers(data, "Biology", [generated()], " "),
  ).toThrow();
  first.folders!.push({ id: "dup", name: "Finals" });
  expect(() =>
    addGeneratedReviewers(first, "Biology", [generated()], "Finals"),
  ).toThrow("ambiguous");
});
