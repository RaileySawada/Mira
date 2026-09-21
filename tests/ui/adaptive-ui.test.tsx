import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { VoiceStudy } from "../../src/features/study/VoiceStudy";
import { ResumeQuiz } from "../../src/features/study/ResumeQuiz";
import { StudySession } from "../../src/features/study/StudySession";
import {
  loadActiveDraft,
  persistActiveDraft,
} from "../../src/services/storageRuntime";
import { confirmNewQuiz } from "../../src/features/study/sessionActions";
import { confirmAction } from "../../src/components/confirmAction";
import { library } from "../support/fixtures";
jest.mock("../../src/services/storageRuntime", () => ({
  loadActiveDraft: jest.fn(),
  persistActiveDraft: jest.fn(async () => {}),
}));
jest.mock("../../src/components/confirmAction", () => ({
  confirmAction: jest.fn(async () => true),
}));
const draft = () => ({
  id: "draft",
  reviewerId: "reviewer-1",
  title: "Paused biology",
  mode: "quiz",
  difficulty: "hard",
  cards: library().reviewers[0].cards,
  index: 0,
  answers: [],
  answer: "Draft answer",
  checked: false,
  startedAt: new Date().toISOString(),
  elapsedMs: 1000,
});
beforeEach(() => jest.mocked(loadActiveDraft).mockResolvedValue(undefined));
test("offers resume without opening automatically, then restores the answer", async () => {
  jest.mocked(loadActiveDraft).mockResolvedValue(draft());
  const resume = jest.fn();
  render(<ResumeQuiz active={false} completedIds={[]} onResume={resume} />);
  await screen.findByText(/Paused biology/);
  expect(resume).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Continue unfinished quiz" }),
  );
  expect(resume).toHaveBeenCalledWith(
    expect.objectContaining({
      resume: expect.objectContaining({ answer: "Draft answer" }),
    }),
  );
});
test("discard deletes the draft and corrupt drafts remain recoverable", async () => {
  jest.mocked(loadActiveDraft).mockResolvedValue({ bad: true });
  render(<ResumeQuiz active={false} completedIds={[]} onResume={jest.fn()} />);
  await screen.findByRole("alert");
  fireEvent.click(
    screen.getByRole("button", { name: "Discard unfinished quiz" }),
  );
  await waitFor(() =>
    expect(persistActiveDraft).toHaveBeenCalledWith(undefined),
  );
});
test("new quizzes require explicit discard of an existing draft", async () => {
  jest.mocked(loadActiveDraft).mockResolvedValue(draft());
  jest.mocked(confirmAction).mockResolvedValueOnce(false);
  expect(await confirmNewQuiz()).toBe(false);
  expect(persistActiveDraft).not.toHaveBeenCalled();
  expect(await confirmNewQuiz()).toBe(true);
  expect(persistActiveDraft).toHaveBeenCalledWith(undefined);
});
test("voice mode supports pause, stop and typing fallback without submitting", async () => {
  const answer = jest.fn();
  render(
    <VoiceStudy
      question="What is DNA?"
      answer=""
      onAnswer={answer}
      disabled={false}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Start voice study" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "never submitted automatically",
  );
  fireEvent.click(screen.getByRole("button", { name: "Pause voice" }));
  expect(screen.getByRole("button", { name: "Speak answer" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Resume voice" }));
  fireEvent.click(screen.getByRole("button", { name: "Stop voice study" }));
  expect(
    screen.getByRole("button", { name: "Start voice study" }),
  ).toBeVisible();
  expect(answer).not.toHaveBeenCalled();
});
test("quiz draft saves editable answers without grading and restores them", async () => {
  jest.useFakeTimers();
  const completed = jest.fn(() => true);
  const session = {
    title: "Cells",
    reviewerId: "reviewer-1",
    mode: "quiz" as const,
    cards: [library().reviewers[0].cards[0]],
  };
  const view = render(
    <StudySession
      session={session}
      onClose={jest.fn()}
      onComplete={completed}
    />,
  );
  fireEvent.change(screen.getByLabelText("Your answer"), {
    target: { value: "my draft" },
  });
  await act(async () => jest.advanceTimersByTime(300));
  expect(persistActiveDraft).toHaveBeenCalledWith(
    expect.objectContaining({ answer: "my draft", answers: [] }),
  );
  expect(completed).not.toHaveBeenCalled();
  view.unmount();
  jest.useRealTimers();
});

test("hiding a quiz saves elapsed time without submitting its answer", async () => {
 jest.useFakeTimers();
 const complete=jest.fn(() => true);
 const view=render(<StudySession session={{title:"Cells",reviewerId:"reviewer-1",mode:"quiz",cards:[library().reviewers[0].cards[0]]}} onClose={jest.fn()} onComplete={complete}/>);
 await act(async () => jest.advanceTimersByTime(5000));
 fireEvent(window, new Event("pagehide"));
 expect(persistActiveDraft).toHaveBeenLastCalledWith(expect.objectContaining({elapsedMs:5000,answers:[]}));
 expect(complete).not.toHaveBeenCalled();
 view.unmount();jest.useRealTimers();
});

test("removes a stale resume banner when the draft disappears", async () => {
 jest.mocked(loadActiveDraft).mockResolvedValueOnce(draft()).mockResolvedValueOnce(undefined);
 const view=render(<ResumeQuiz active={false} completedIds={[]} onResume={jest.fn()}/>);
 await screen.findByText(/Paused biology/);
 view.rerender(<ResumeQuiz active={false} completedIds={["other"]} onResume={jest.fn()}/>);
 await waitFor(()=>expect(screen.queryByText(/Paused biology/)).not.toBeInTheDocument());
});

test("a failed quiz pause keeps the quiz open and shows recovery guidance", async () => {
 jest.mocked(persistActiveDraft).mockRejectedValueOnce(Error("quota"));
 const close=jest.fn();
 render(<StudySession session={{title:"Cells",reviewerId:"reviewer-1",mode:"quiz",cards:[library().reviewers[0].cards[0]]}} onClose={close} onComplete={jest.fn()}/>);
 fireEvent.click(screen.getByLabelText("Close dialog"));
 expect(await screen.findByText("Could not save this quiz. Keep it open and try again.")).toBeVisible();
 expect(close).not.toHaveBeenCalled();
});
