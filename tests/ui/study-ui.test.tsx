import { confirmAction as confirm } from "../../src/components/confirmAction";
import {
  waitFor,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewerEditor } from "../../src/features/reviewers/ReviewerEditor";
import { StudySession } from "../../src/features/study/StudySession";
import { library, reviewer } from "../support/fixtures";

test("creates a reviewer and inline topic together", async () => {
  const user = userEvent.setup(),
    save = jest.fn(() => true),
    close = jest.fn();
  render(<ReviewerEditor topics={[]} onSave={save} onClose={close} />);
  await user.type(screen.getByLabelText("Reviewer title"), " Anatomy ");
  await user.type(screen.getByLabelText("Description"), " Notes ");
  await user.type(screen.getByLabelText("Question / term"), " Q ");
  await user.type(screen.getByLabelText("Answer / definition"), " A ");
  await user.click(
    screen.getByRole("button", { name: "+ Create a new topic" }),
  );
  await user.type(screen.getByLabelText("New topic name"), " Anatomy ");
  fireEvent.change(screen.getByLabelText("Color"), {
    target: { value: "#123456" },
  });
  await user.click(screen.getByRole("button", { name: "Save reviewer" }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({
      title: "Anatomy",
      description: "Notes",
      topicId: expect.any(String),
      cards: [expect.objectContaining({ question: "Q", answer: "A" })],
    }),
    expect.objectContaining({ name: "Anatomy", color: "#123456" }),
  );
  await waitFor(() => expect(close).toHaveBeenCalled());
});
test("edits cards, reuses topics, and remains open after save failure", async () => {
  const user = userEvent.setup(),
    save = jest.fn(() => false),
    close = jest.fn();
  render(
    <ReviewerEditor
      reviewer={reviewer()}
      topics={library().topics}
      onSave={save}
      onClose={close}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Add a flashcard" }));
  expect(screen.getAllByLabelText("Question / term")).toHaveLength(3);
  await user.click(screen.getAllByRole("button", { name: "Remove" })[2]);
  await user.clear(screen.getAllByLabelText("Question / term")[0]);
  await user.type(
    screen.getAllByLabelText("Question / term")[0],
    "Edited question",
  );
  await user.clear(screen.getAllByLabelText("Answer / definition")[0]);
  await user.type(
    screen.getAllByLabelText("Answer / definition")[0],
    "Edited answer",
  );
  await user.click(
    screen.getByRole("button", { name: "+ Create a new topic" }),
  );
  await user.type(screen.getByLabelText("New topic name"), " BIOLOGY ");
  await user.click(screen.getByRole("button", { name: "Save reviewer" }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ id: "reviewer-1", topicId: "topic-1" }),
    undefined,
  );
  expect(close).not.toHaveBeenCalled();
  await user.click(
    screen.getByRole("button", { name: "Choose an existing topic instead" }),
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(close).toHaveBeenCalled();
});
test("blank trimmed fields and topics never save", () => {
  const save = jest.fn();
  const { container } = render(
    <ReviewerEditor topics={[]} onSave={save} onClose={jest.fn()} />,
  );
  fireEvent.submit(container.querySelector("form")!);
  expect(save).not.toHaveBeenCalled();
});
test("flashcards flip, navigate backwards, and finish without saving a score", async () => {
  const user = userEvent.setup(),
    close = jest.fn(),
    complete = jest.fn();
  render(
    <StudySession
      session={{
        title: "Cells",
        reviewerId: "r",
        mode: "cards",
        cards: reviewer().cards,
      }}
      onClose={close}
      onComplete={complete}
    />,
  );
  const card = screen.getByRole("button", { name: /Powerhouse/ });
  expect(card).not.toHaveClass("is-flipped");
  await user.click(card);
  expect(card).toHaveClass("is-flipped");
  expect(screen.getByText("Mitochondria")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Next card" }));
  await user.click(screen.getByRole("button", { name: "Previous" }));
  await user.click(screen.getByRole("button", { name: "Next card" }));
  await user.click(screen.getByRole("button", { name: "Finish practice" }));
  expect(close).toHaveBeenCalled();
  expect(complete).not.toHaveBeenCalled();
});
test("quiz grades answers and saves only the complete result", async () => {
  const user = userEvent.setup(),
    complete = jest.fn(() => true),
    close = jest.fn();
  render(
    <StudySession
      session={{
        title: "Cells",
        reviewerId: "r",
        mode: "quiz",
        cards: reviewer().cards,
      }}
      onClose={close}
      onComplete={complete}
    />,
  );
  await user.click(
    screen.getByRole("button", { name: "Hard · Written recall" }),
  );
  await user.type(screen.getByLabelText("Your answer"), " mitochondria ");
  await user.click(screen.getByRole("button", { name: "Check answer" }));
  expect(screen.getByText(/That’s right/)).toBeVisible();
  expect(complete).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Next question" }));
  await user.type(screen.getByLabelText("Your answer"), "wrong");
  await user.click(screen.getByRole("button", { name: "Check answer" }));
  expect(screen.getByText("Expected answer: DNA")).toBeVisible();
  await user.click(
    screen.getByRole("button", { name: "Finish & save results" }),
  );
  expect(complete).toHaveBeenCalledWith(
    expect.objectContaining({ correct: 1, total: 2, mode: "quiz" }),
  );
  expect(await screen.findByText("50%")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Back to learning" }));
  expect(close).toHaveBeenCalled();
});
test("daily quiz retries failed saves and confirms abandoned attempts", async () => {
  const user = userEvent.setup(),
    complete = jest.fn().mockResolvedValueOnce(false).mockReturnValue(true),
    close = jest.fn();
  render(
    <StudySession
      session={{
        title: "Daily",
        reviewerId: "",
        mode: "daily",
        cards: [reviewer().cards[0]],
      }}
      onClose={close}
      onComplete={complete}
    />,
  );
  jest.mocked(confirm).mockResolvedValueOnce(false);
  await user.click(screen.getByLabelText("Close dialog"));
  expect(close).not.toHaveBeenCalled();
  const dialog = screen.getByRole("dialog");
  fireEvent.submit(dialog.querySelector("form")!);
  expect(complete).not.toHaveBeenCalled();
  await user.type(within(dialog).getByLabelText("Your answer"), "Mitochondria");
  await user.click(screen.getByRole("button", { name: "Check answer" }));
  await user.click(
    screen.getByRole("button", { name: "Finish & save results" }),
  );
  expect(screen.queryByText("Another step forward.")).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Finish & save results" }),
  );
  expect(complete.mock.calls[0][0].id).toBe(complete.mock.calls[1][0].id);
  expect(complete.mock.calls[1][0].mode).toBe("daily");
  await user.click(screen.getByLabelText("Close dialog"));
  expect(close).toHaveBeenCalled();
});
