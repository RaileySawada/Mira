import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Folders } from "../src/pages/Folders";
import { library } from "./fixtures";
import { validateData } from "../src/services/storage";

test("folders survive backup import and older libraries remain valid", () => {
  const data = library();
  data.folders = [{ id: "folder-1", name: "Exam" }];
  data.reviewers[0].folderId = "folder-1";
  expect(validateData(JSON.parse(JSON.stringify(data)))).toEqual(data);
  expect(() => validateData({ ...data, folders: [] })).toThrow(/folder/);
  expect(() => validateData({ ...data, folders: [{ id: "folder-1", name: "Exam" }, { id: "folder-1", name: "Exam" }] })).toThrow(/folder/);
  const old = library(); delete old.folders;
  expect(validateData(old)).toEqual(old);
});
test("creates and renames folders", async () => {
  const data = library(); const update = jest.fn(() => true);
  const view = render(<Folders data={data} update={update} onEdit={jest.fn()} onStudy={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "New folder" }));
  fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "Exam" } });
  fireEvent.click(screen.getByRole("button", { name: "Save folder" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  const next = update.mock.calls[0] as unknown as [typeof data];
  expect(next[0].folders?.[0].name).toBe("Exam");
  view.rerender(<Folders data={next[0]} update={update} onEdit={jest.fn()} onStudy={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Rename Exam" }));
  fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "Finals" } });
  fireEvent.click(screen.getByRole("button", { name: "Save folder" }));
  await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
});
test("moves reviewers and deleting a folder preserves its cards", async () => {
  const data = library(); data.folders = [{ id: "f1", name: "Exam" }];
  const update = jest.fn((_data: typeof data) => true);
  const view = render(<Folders data={data} update={update} onEdit={jest.fn()} onStudy={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Move Cell biology to folder" }));
  fireEvent.click(screen.getByRole("option", { name: "Exam" }));
  expect(update.mock.calls[0][0].reviewers[0].folderId).toBe("f1");
  view.rerender(<Folders data={update.mock.calls[0][0]} update={update} onEdit={jest.fn()} onStudy={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Delete Exam" }));
  await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
  expect(update.mock.calls[1][0].folders).toEqual([]);
  expect(update.mock.calls[1][0].reviewers[0].cards).toEqual(data.reviewers[0].cards);
  expect(update.mock.calls[1][0].reviewers[0].folderId).toBe("");
});

test("1000 folders render only five rows, newest first, with searchable pages", () => {
  const data = library();
  data.folders = Array.from({ length: 1000 }, (_, index) => ({ id: "f" + index, name: "Folder " + index }));
  render(<Folders data={data} update={jest.fn()} onEdit={jest.fn()} onStudy={jest.fn()} />);
  const nav = within(screen.getByRole("navigation", { name: "Reviewer folders" }));
  expect(nav.getAllByRole("button", { name: /^Rename / })).toHaveLength(5);
  expect(nav.getByRole("button", { name: "Folder 999 0" })).toBeVisible();
  expect(nav.getByText("Page 1 of 200")).toBeVisible();
  fireEvent.click(nav.getByRole("button", { name: "Next folder page" }));
  expect(nav.getByText("Page 2 of 200")).toBeVisible();
  fireEvent.click(nav.getByRole("button", { name: "Folder 994 0" }));
  fireEvent.change(screen.getByLabelText("Search folders"), { target: { value: "Folder 999" } });
  expect(nav.getAllByRole("button", { name: /^Rename / })).toHaveLength(1);
  expect(nav.getByText("Selected folder")).toBeVisible();
  expect(nav.getByRole("button", { name: "Folder 994 0" })).toHaveAttribute("aria-current", "page");
  fireEvent.click(nav.getByRole("button", { name: "Folder 994 0" }));
  expect(screen.getByLabelText("Search folders")).toHaveValue("");
  expect(nav.getByText("Page 2 of 200")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Search folders"), { target: { value: "No such folder" } });
  expect(nav.getByText("No matching folders. Try another name.")).toBeVisible();
});
test("a newly created folder opens and clears search on the first page", async () => {
  const data = library();
  data.folders = Array.from({ length: 8 }, (_, index) => ({ id: "f" + index, name: "Old " + index }));
  const update = jest.fn((_next: typeof data) => true);
  const view = render(<Folders data={data} update={update} onEdit={jest.fn()} onStudy={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Search folders"), { target: { value: "Old" } });
  fireEvent.click(screen.getByRole("button", { name: "Next folder page" }));
  fireEvent.click(screen.getByRole("button", { name: "New folder" }));
  fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "Newest" } });
  fireEvent.click(screen.getByRole("button", { name: "Save folder" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  view.rerender(<Folders data={update.mock.calls[0][0]} update={update} onEdit={jest.fn()} onStudy={jest.fn()} />);
  expect(screen.getByLabelText("Search folders")).toHaveValue("");
  expect(screen.getByText("Page 1 of 2")).toBeVisible();
  expect(within(screen.getByRole("region", { name: "Folder contents" })).getByRole("heading", { name: "Newest" })).toBeVisible();
});


test("folder picker opens without focusing search and closes after selection", () => {
  const data = library();
  data.folders = [{ id: "exam", name: "Exam" }];
  render(<Folders data={data} update={jest.fn()} onEdit={jest.fn()} onStudy={jest.fn()} />);
  const trigger = screen.getByRole("button", { name: "Browse folders" });
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByLabelText("Search folders")).not.toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Exam 0" }));
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveTextContent("Exam");
  fireEvent.click(trigger);
  fireEvent.keyDown(trigger, { key: "Escape" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(trigger).toHaveFocus();
});
