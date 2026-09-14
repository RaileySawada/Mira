import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/app/App";
import { saveData, STORAGE_KEY } from "../src/services/storage";
import { library, reviewer } from "./fixtures";

function openPage(path = "/") {
  history.replaceState(null, "", path);
  const data = library();
  data.settings.shuffle = false;
  data.settings.quizSize = 1;
  saveData(data);
  return render(<App />);
}
test.each([
  "/",
  "/reviewers",
  "/topics",
  "/quizzes",
  "/activity",
  "/settings",
  "/guide",
  "/privacy",
  "/terms",
  "/about",
  "/contribute",
  "/missing",
])("application renders %s with navigation and a page title", (path) => {
  openPage(path);
  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(
    within(screen.getByRole("main")).getByRole("heading", { level: 1 }),
  ).toBeVisible();
  expect(document.title).toContain("Mira");
});
test("daily review saves a result into the application library", async () => {
  const user = userEvent.setup();
  openPage();
  await user.click(screen.getByRole("button", { name: "Start daily review" }));
  await user.type(screen.getByLabelText("Your answer"), "Mitochondria");
  await user.click(screen.getByRole("button", { name: "Check answer" }));
  await user.click(
    screen.getByRole("button", { name: "Finish & save results" }),
  );
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).attempts[0]).toEqual(
    expect.objectContaining({ correct: 1, mode: "daily" }),
  );
  await user.click(screen.getByRole("button", { name: "Back to learning" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
test("reviewer page starts flashcards and individual quizzes", async () => {
  const user = userEvent.setup();
  openPage("/reviewers");
  await user.click(screen.getByRole("button", { name: "Study cards" }));
  expect(screen.getByText("FLASHCARD PRACTICE")).toBeVisible();
  await user.click(screen.getByLabelText("Close dialog"));
  await user.click(screen.getByRole("button", { name: "Take quiz" }));
  expect(screen.getByText("WRITTEN QUIZ")).toBeVisible();
  await user.click(screen.getByLabelText("Close dialog"));
});
test("application creates and edits reviewers and confirms deletion", async () => {
  const user = userEvent.setup();
  openPage("/reviewers");
  await user.click(screen.getByRole("button", { name: "New reviewer" }));
  await user.type(screen.getByLabelText("Reviewer title"), "New reviewer");
  await user.type(screen.getByLabelText("Question / term"), "Question");
  await user.type(screen.getByLabelText("Answer / definition"), "Answer");
  await user.click(
    screen.getByRole("button", { name: "+ Create a new topic" }),
  );
  await user.type(screen.getByLabelText("New topic name"), "Math");
  await user.click(screen.getByRole("button", { name: "Save reviewer" }));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).topics).toHaveLength(2);
  await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
  await user.clear(screen.getByLabelText("Reviewer title"));
  await user.type(screen.getByLabelText("Reviewer title"), "Updated title");
  await user.click(screen.getByRole("button", { name: "Save reviewer" }));
  expect(screen.getByRole("heading", { name: "Updated title" })).toBeVisible();
  jest.mocked(confirm).mockReturnValueOnce(false);
  await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).reviewers).toHaveLength(
    2,
  );
  await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).reviewers).toHaveLength(
    1,
  );
});
test("Home starts cards and can open the creation dialog", async () => {
  const user = userEvent.setup();
  openPage();
  await user.click(screen.getByRole("button", { name: /Cell biology/ }));
  await user.click(screen.getByLabelText("Close dialog"));
  await user.click(screen.getByRole("button", { name: "New reviewer" }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));
});
test("quiz page calls both study actions and settings persist theme", async () => {
  const user = userEvent.setup();
  openPage("/quizzes");
  await user.click(screen.getByRole("button", { name: /Start quiz/ }));
  await user.click(screen.getByLabelText("Close dialog"));
  await user.click(screen.getByRole("button", { name: "Begin daily review" }));
  await user.click(screen.getByLabelText("Close dialog"));
  await user.click(
    within(screen.getByRole("complementary")).getByRole("link", {
      name: "Settings",
    }),
  );
  await user.click(screen.getByRole("button", { name: /Dark/ }));
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).settings.theme).toBe(
    "dark",
  );
});
test("unreadable storage offers recovery and reports blocked recovery access", async () => {
  const user = userEvent.setup();
  localStorage.setItem(STORAGE_KEY, "bad");
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  render(<App />);
  expect(screen.getByRole("alert")).toHaveTextContent("could not load");
  await user.click(
    screen.getByRole("button", { name: "Export existing storage" }),
  );
  expect(URL.createObjectURL).toHaveBeenCalled();
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  await user.click(
    screen.getByRole("button", { name: "Export existing storage" }),
  );
  expect(alert).toHaveBeenCalledWith(expect.stringContaining("unavailable"));
});
test("cards without a topic stay usable", async () => {
  const data = library();
  data.reviewers = [reviewer({ topicId: "" })];
  saveData(data);
  render(<App />);
  expect(screen.getByRole("button", { name: /Uncategorized/ })).toBeVisible();
});
