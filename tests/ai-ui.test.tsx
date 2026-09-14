import type { StudyData } from "../src/types/study";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AiAssistant from "../src/features/ai/AiAssistant";
import { OnlineAssistant } from "../src/features/ai/OnlineAssistant";
import { requestAi } from "../src/services/ai";
import { library } from "./fixtures";
import { generated } from "./ai-fixtures";

jest.mock("../src/services/ai", () => ({ requestAi: jest.fn() }));
const request = jest.mocked(requestAi);
const drafts = [generated(), generated("DNA"), generated("Mitochondria")];
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

beforeEach(() => request.mockReset());

test("generates, previews and saves an entire batch under the original topic", async () => {
  request.mockResolvedValue({ reviewers: drafts });
  const save = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true), close = jest.fn();
  render(<AiAssistant onSave={save} onClose={close} />);
  expect(screen.getByText(/sent to Pollinations/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Generate reviewers" })).toBeDisabled();
  fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
  expect(request).not.toHaveBeenCalled();
  change("Topic", " Biology ");
  change("Learning goals or notes (optional)", "Cell structures");
  change("Number of reviewers (5 cards each)", "2");
  change("Number of reviewers (5 cards each)", "3");
  click("Generate reviewers");
  await screen.findByRole("region", { name: "Generated reviewers" });
  expect(request).toHaveBeenCalledWith({ mode: "generate", prompt: "Cell structures", topic: "Biology", count: 3 }, expect.any(AbortSignal));
  expect(screen.getAllByText(/cards$/)).toHaveLength(3);
  fireEvent.click(screen.getByText("Cell structures · 5 cards"));
  expect(screen.getAllByText("Question 0")).toHaveLength(3);
  change("Topic", "Changed after generation");
  click("Save all reviewers");
  await screen.findByRole("alert");
  expect(close).not.toHaveBeenCalled();
  click("Save all reviewers");
  expect(save).toHaveBeenLastCalledWith("Biology", drafts);
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
});

test("asks questions, validates replies and switches modes", async () => {
  const close = jest.fn();
  render(<AiAssistant onSave={jest.fn()} onClose={close} />);
  click("Ask a question");
  fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
  expect(request).not.toHaveBeenCalled();
  change("Your study question", "Explain cells");
  request.mockResolvedValueOnce({ answer: "Cells contain DNA." });
  click("Send question");
  expect(await screen.findByText("Cells contain DNA.")).toBeVisible();
  for (const result of [null, {}, { answer: "" }]) {
    request.mockResolvedValueOnce(result);
    await waitFor(() => expect(screen.getByRole("button", { name: "Send question" })).toBeEnabled());
    click("Send question");
    expect(await screen.findByRole("alert")).toHaveTextContent("empty answer");
  }
  click("Create reviewers");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  click("Close dialog");
  expect(close).toHaveBeenCalled();
});

test("handles invalid batches, network errors and unknown failures", async () => {
  render(<AiAssistant onSave={jest.fn()} onClose={jest.fn()} />);
  change("Topic", "Biology");
  request.mockResolvedValueOnce({ reviewers: [generated()] });
  click("Generate reviewers");
  expect(await screen.findByRole("alert")).toHaveTextContent("every reviewer");
  request.mockResolvedValueOnce({ reviewers: [] });
  click("Generate reviewers");
  expect(await screen.findByRole("alert")).toHaveTextContent("invalid reviewer");
  request.mockRejectedValueOnce(new Error("Disconnected"));
  click("Generate reviewers");
  expect(await screen.findByRole("alert")).toHaveTextContent("Disconnected");
  request.mockRejectedValueOnce("network failure");
  click("Generate reviewers");
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not connect");
});

test("cancellation ignores late results and permits another request", async () => {
  let resolve!: (value: unknown) => void;
  request.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  render(<AiAssistant onSave={jest.fn()} onClose={jest.fn()} />);
  change("Topic", "Biology");
  click("Generate reviewers");
  fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);
  expect(request).toHaveBeenCalledTimes(1);
  const signal = request.mock.calls[0][1];
  click("Cancel request");
  expect(signal.aborted).toBe(true);
  await act(async () => { resolve({ reviewers: drafts }); });
  expect(screen.queryByRole("region", { name: "Generated reviewers" })).not.toBeInTheDocument();
  request.mockResolvedValueOnce({ reviewers: drafts });
  click("Generate reviewers");
  await screen.findByRole("region", { name: "Generated reviewers" });
});

test("unmount and timeout abort outstanding work without surfacing cancellation errors", async () => {
  jest.useFakeTimers();
  request.mockImplementation((_input, signal) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("Aborted")), { once: true });
  }));
  const view = render(<AiAssistant onSave={jest.fn()} onClose={jest.fn()} />);
  change("Topic", "Biology");
  click("Generate reviewers");
  await act(async () => { jest.advanceTimersByTime(35000); });
  expect(screen.getByRole("alert")).toHaveTextContent("too long");
  expect(screen.getByRole("button", { name: "Generate reviewers" })).toBeEnabled();
  click("Generate reviewers");
  const signal = request.mock.calls[1][1];
  await act(async () => { view.unmount(); });
  expect(signal.aborted).toBe(true);
  await act(async () => { jest.runOnlyPendingTimers(); });
  expect(request).toHaveBeenCalledTimes(2);
});

test("online launcher saves locally and hides tools immediately on disconnect", async () => {
  let online = true;
  jest.spyOn(navigator, "onLine", "get").mockImplementation(() => online);
  request.mockResolvedValue({ reviewers: drafts });
  const update = jest.fn((_data: StudyData) => true);
  const { unmount } = render(<OnlineAssistant data={library()} update={update} />);
  click("AI study assistant");
  await screen.findByRole("dialog");
  change("Topic", "Biology");
  click("Generate reviewers");
  await screen.findByRole("region", { name: "Generated reviewers" });
  click("Save all reviewers");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(update.mock.calls[0][0].reviewers).toHaveLength(4);
  click("AI study assistant");
  await screen.findByRole("dialog");
  act(() => { online = false; window.dispatchEvent(new Event("offline")); });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "AI study assistant" })).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("offline");
  act(() => { online = true; window.dispatchEvent(new Event("online")); });
  expect(screen.getByRole("button", { name: "AI study assistant" })).toBeVisible();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  unmount();
});

test("disconnecting aborts AI work and reconnecting does not restart it", async () => {
  let online = true;
  jest.spyOn(navigator, "onLine", "get").mockImplementation(() => online);
  request.mockImplementation((_input, signal) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("Disconnected")), { once: true });
  }));
  render(<OnlineAssistant data={library()} update={jest.fn()} />);
  click("AI study assistant");
  await screen.findByRole("dialog");
  change("Topic", "Biology");
  click("Generate reviewers");
  const signal = request.mock.calls[0][1];
  await act(async () => { online = false; window.dispatchEvent(new Event("offline")); });
  expect(signal.aborted).toBe(true);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  act(() => { online = true; window.dispatchEvent(new Event("online")); });
  expect(request).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "AI study assistant" })).toBeEnabled();
});
