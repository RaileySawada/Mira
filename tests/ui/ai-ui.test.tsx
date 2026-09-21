import type { ReactElement } from "react";
import type { StudyData } from "../../src/types/study";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import AiAssistant from "../../src/features/ai/AiAssistant";
import { OnlineAssistant } from "../../src/features/ai/OnlineAssistant";
import { requestAi } from "../../src/services/ai";
import { library } from "../support/fixtures";
import { generated } from "../support/ai-fixtures";
import { saveAiSession } from "../../src/services/aiSession";
import { AI_SESSION_KEY } from "../../src/config/storage";
import { setMedia } from "../support/setup";

jest.mock("../../src/services/ai", () => ({ requestAi: jest.fn() }));
const request = jest.mocked(requestAi);
const drafts = [generated(), generated("DNA"), generated("Mitochondria")];
const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const click = (name: string) => {
  if (name === "Create reviewers" || name === "Ask a question") {
    fireEvent.click(screen.getByRole("button", { name: "Assistant mode" }));
    fireEvent.click(screen.getByRole("option", { name }));
  } else fireEvent.click(screen.getByRole("button", { name }));
};

function renderGenerator(ui: ReactElement) {
  const view = render(ui);
  click("Create reviewers");
  return view;
}

beforeEach(() => request.mockReset());

test("generates, previews and saves an entire batch under the original topic", async () => {
  request.mockResolvedValue({ reviewers: drafts });
  const save = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
    close = jest.fn();
  renderGenerator(<AiAssistant onSave={save} onClose={close} />);
  expect(
    screen.getByRole("button", { name: "Generate reviewers" }),
  ).toBeDisabled();
  fireEvent.submit(
    screen
      .getByRole("complementary", { name: "Your study assistant" })
      .querySelector("form")!,
  );
  expect(request).not.toHaveBeenCalled();
  change("Topic", " Biology ");
  change("Learning goals or notes (optional)", "Cell structures");
  change("Number of reviewers", "2");
  change("Number of reviewers", "3");
  click("Generate reviewers");
  await screen.findByRole("region", { name: "Generated reviewers" });
  expect(request).toHaveBeenCalledWith(
    { mode: "generate", prompt: "Cell structures", topic: "Biology", count: 3 },
    expect.any(AbortSignal),
  );
  expect(screen.getAllByText(/cards$/)).toHaveLength(3);
  fireEvent.click(
    screen.getByText("Cell structures", { selector: "summary span" }),
  );
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
  renderGenerator(<AiAssistant onSave={jest.fn()} onClose={close} />);
  click("Ask a question");
  fireEvent.submit(
    screen
      .getByRole("complementary", { name: "Your study assistant" })
      .querySelector("form")!,
  );
  expect(request).not.toHaveBeenCalled();
  change("Your study question", "Explain cells");
  request.mockResolvedValueOnce({ answer: "Cells contain DNA." });
  click("Send question");
  expect(await screen.findByText("Cells contain DNA.")).toBeVisible();
  for (const result of [null, {}, { answer: "" }]) {
    change("Your study question", "Explain cells");
    request.mockResolvedValueOnce(result);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Send question" }),
      ).toBeEnabled(),
    );
    click("Send question");
    expect(await screen.findByRole("alert")).toHaveTextContent("empty answer");
  }
  click("Create reviewers");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  click("Close dialog");
  expect(close).toHaveBeenCalled();
});

test("handles invalid batches, network errors and unknown failures", async () => {
  renderGenerator(<AiAssistant onSave={jest.fn()} onClose={jest.fn()} />);
  change("Topic", "Biology");
  request.mockResolvedValueOnce({ reviewers: [generated()] });
  click("Generate reviewers");
  expect(await screen.findByRole("alert")).toHaveTextContent("every reviewer");
  request.mockResolvedValueOnce({ reviewers: [] });
  click("Generate reviewers");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "invalid reviewer",
  );
  request.mockRejectedValueOnce(new Error("Disconnected"));
  click("Generate reviewers");
  expect(await screen.findByRole("alert")).toHaveTextContent("Disconnected");
  request.mockRejectedValueOnce("network failure");
  click("Generate reviewers");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Could not connect",
  );
});

test("cancellation ignores late results and permits another request", async () => {
  let resolve!: (value: unknown) => void;
  request.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  renderGenerator(<AiAssistant onSave={jest.fn()} onClose={jest.fn()} />);
  change("Topic", "Biology");
  click("Generate reviewers");
  fireEvent.submit(
    screen
      .getByRole("complementary", { name: "Your study assistant" })
      .querySelector("form")!,
  );
  expect(request).toHaveBeenCalledTimes(1);
  const signal = request.mock.calls[0][1];
  click("Cancel request");
  expect(signal.aborted).toBe(true);
  await act(async () => {
    resolve({ reviewers: drafts });
  });
  expect(
    screen.queryByRole("region", { name: "Generated reviewers" }),
  ).not.toBeInTheDocument();
  request.mockResolvedValueOnce({ reviewers: drafts });
  click("Generate reviewers");
  await screen.findByRole("region", { name: "Generated reviewers" });
});

test("unmount and timeout abort outstanding work without surfacing cancellation errors", async () => {
  jest.useFakeTimers();
  request.mockImplementation(
    (_input, signal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Error("Aborted")), {
          once: true,
        });
      }),
  );
  const view = renderGenerator(
    <AiAssistant onSave={jest.fn()} onClose={jest.fn()} />,
  );
  change("Topic", "Biology");
  click("Generate reviewers");
  await act(async () => {
    jest.advanceTimersByTime(35000);
  });
  expect(screen.getByRole("alert")).toHaveTextContent("too long");
  expect(
    screen.getByRole("button", { name: "Generate reviewers" }),
  ).toBeEnabled();
  click("Generate reviewers");
  const signal = request.mock.calls[1][1];
  await act(async () => {
    view.unmount();
  });
  expect(signal.aborted).toBe(true);
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  expect(request).toHaveBeenCalledTimes(2);
});

test("online launcher saves locally and hides tools immediately on disconnect", async () => {
  let online = true;
  jest.spyOn(navigator, "onLine", "get").mockImplementation(() => online);
  request.mockResolvedValue({ reviewers: drafts });
  const update = jest.fn((_data: StudyData) => true);
  const { unmount } = render(
    <OnlineAssistant data={library()} update={update} />,
  );
  click("AI study assistant");
  await screen.findByRole("complementary", { name: "Your study assistant" });
  click("Create reviewers");
  change("Topic", "Biology");
  click("Generate reviewers");
  await screen.findByRole("region", { name: "Generated reviewers" });
  click("Save all reviewers");
  await waitFor(() =>
    expect(
      screen.queryByRole("complementary", { name: "Your study assistant" }),
    ).not.toBeInTheDocument(),
  );
  expect(update.mock.calls[0][0].reviewers).toHaveLength(4);
  click("AI study assistant");
  await screen.findByRole("complementary", { name: "Your study assistant" });
  click("Create reviewers");
  act(() => {
    online = false;
    window.dispatchEvent(new Event("offline"));
  });
  expect(
    screen.queryByRole("complementary", { name: "Your study assistant" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "AI study assistant" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("offline");
  act(() => {
    online = true;
    window.dispatchEvent(new Event("online"));
  });
  expect(
    screen.queryByRole("button", { name: "AI study assistant" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("complementary", { name: "Your study assistant" }),
  ).toBeVisible();
  unmount();
});

test("disconnecting aborts AI work and reconnecting does not restart it", async () => {
  let online = true;
  jest.spyOn(navigator, "onLine", "get").mockImplementation(() => online);
  request.mockImplementation(
    (_input, signal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => reject(new Error("Disconnected")),
          { once: true },
        );
      }),
  );
  render(<OnlineAssistant data={library()} update={jest.fn()} />);
  click("AI study assistant");
  await screen.findByRole("complementary", { name: "Your study assistant" });
  click("Create reviewers");
  change("Topic", "Biology");
  click("Generate reviewers");
  const signal = request.mock.calls[0][1];
  await act(async () => {
    online = false;
    window.dispatchEvent(new Event("offline"));
  });
  expect(signal.aborted).toBe(true);
  expect(
    screen.queryByRole("complementary", { name: "Your study assistant" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  act(() => {
    online = true;
    window.dispatchEvent(new Event("online"));
  });
  expect(request).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("button", { name: "Generate reviewers" }),
  ).toBeEnabled();
});

test("chat starts as a conversation and sends context for follow-up questions", async () => {
  const close = jest.fn();
  request
    .mockResolvedValueOnce({ answer: "Cells contain genetic material." })
    .mockResolvedValueOnce({ answer: "That material is DNA." });
  render(<AiAssistant onClose={close} onSave={jest.fn()} />);
  expect(screen.getByRole("log", { name: "Conversation" })).toBeVisible();
  expect(screen.getByText(/How can I help you learn today/)).toBeVisible();
  change("Your study question", "What do cells contain?");
  click("Send question");
  expect(
    await screen.findByText("Cells contain genetic material."),
  ).toBeVisible();
  expect(screen.getByText("What do cells contain?")).toBeVisible();
  expect(screen.getByLabelText("Your study question")).toHaveValue("");
  change("Your study question", "What is that material called?");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Send question" })).toBeEnabled(),
  );
  click("Send question");
  expect(await screen.findByText("That material is DNA.")).toBeVisible();
  expect(request.mock.calls[1][0].history).toEqual([
    { role: "user", content: "What do cells contain?" },
    { role: "assistant", content: "Cells contain genetic material." },
  ]);
  expect(screen.getAllByAltText("You")).toHaveLength(2);
  expect(screen.getAllByAltText("Mira")).toHaveLength(3);
  fireEvent.keyDown(screen.getByLabelText("Your study question"), {
    key: "Escape",
  });
  expect(close).toHaveBeenCalled();
});

test("closing Mira clears only the temporary conversation session", () => {
  saveAiSession([{ role: "user", content: "Remember this only while open." }]);
  const close = jest.fn();
  render(<AiAssistant onClose={close} onSave={jest.fn()} />);
  expect(screen.getByText("Remember this only while open.")).toBeVisible();
  click("Close dialog");
  expect(close).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem(AI_SESSION_KEY)).toBeNull();
});

test("chat previews requested reviewers and saves only after a click", async () => {
  request.mockResolvedValue({
    answer: "Drafts ready.",
    topic: "Biology",
    reviewers: drafts,
  });
  const save = jest.fn().mockReturnValue(true);
  render(<AiAssistant onSave={save} onClose={jest.fn()} />);
  change("Your study question", "Create biology reviewers");
  click("Send question");
  await screen.findByRole("region", { name: "Generated reviewers" });
  await waitFor(() =>
    expect(screen.getByLabelText("Your study question")).not.toBeDisabled(),
  );
  expect(save).not.toHaveBeenCalled();
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      mode: "chat",
      prompt: "Create biology reviewers",
    }),
    expect.any(AbortSignal),
  );
  await act(async () => {
    click("Save all reviewers");
  });
  expect(save).toHaveBeenCalledWith("Biology", drafts);
});

test("idle conversations survive network blips with unsent text intact", async () => {
  let online = true;
  jest.spyOn(navigator, "onLine", "get").mockImplementation(() => online);
  render(<OnlineAssistant data={library()} update={jest.fn()} />);
  click("AI study assistant");
  const panel = await screen.findByRole("complementary", {
    name: "Your study assistant",
  });
  change("Your study question", "My unsent question");
  jest.useFakeTimers();
  try {
    act(() => jest.advanceTimersByTime(10 * 60 * 1000));
    expect(panel).toBeVisible();
    act(() => {
      online = false;
      window.dispatchEvent(new Event("offline"));
    });
    expect(panel).not.toBeVisible();
    act(() => {
      online = true;
      window.dispatchEvent(new Event("online"));
    });
    expect(
      screen.getByRole("complementary", { name: "Your study assistant" }),
    ).toBe(panel);
    expect(screen.getByLabelText("Your study question")).toHaveValue(
      "My unsent question",
    );
    expect(request).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});

test("launcher introduction collapses once and stays collapsed across data updates", () => {
  jest.useFakeTimers();
  try {
    const data = library(),
      update = jest.fn();
    const view = render(<OnlineAssistant data={data} update={update} />);
    expect(
      screen.getByRole("button", { name: "AI study assistant" }),
    ).toHaveClass("is-introducing");
    act(() => jest.advanceTimersByTime(3500));
    expect(
      screen.getByRole("button", { name: "AI study assistant" }),
    ).not.toHaveClass("is-introducing");
    view.rerender(
      <OnlineAssistant
        data={{ ...data, settings: { ...data.settings, name: "Mira" } }}
        update={update}
      />,
    );
    expect(
      screen.getByRole("button", { name: "AI study assistant" }),
    ).not.toHaveClass("is-introducing");
    view.unmount();
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});

test("chat submits the current saved name and study overview", async () => {
  request.mockResolvedValue({ answer: "Hello Mira!" });
  const data = library();
  data.settings.name = "Mira";
  render(
    <AiAssistant studyData={data} onSave={jest.fn()} onClose={jest.fn()} />,
  );
  change("Your study question", "What should I study?");
  click("Send question");
  await waitFor(() => expect(request).toHaveBeenCalled());
  expect(request.mock.calls[0][0].overview?.name).toBe("Mira");
  expect(request.mock.calls[0][0].overview?.reviewers).toContain(
    "Cell biology",
  );
});

test.each([false, true])(
  "current reviewer context requires explicit opt-in: %s",
  async (enabled) => {
    request.mockResolvedValue({ answer: "A helpful explanation." });
    const data = library();
    data.lastStudy = {
      reviewerId: data.reviewers[0].id,
      startedAt: new Date().toISOString(),
    };
    render(
      <AiAssistant studyData={data} onSave={jest.fn()} onClose={jest.fn()} />,
    );
    const checkbox = screen.getByRole("checkbox", {
      name: /Use current reviewer as context/,
    });
    expect(checkbox).not.toBeChecked();
    if (enabled) fireEvent.click(checkbox);
    change("Your study question", "Explain the current card");
    click("Send question");
    await waitFor(() => expect(request).toHaveBeenCalled());
    const sent = request.mock.calls[0][0];
    if (enabled)
      expect(sent.reviewerContext?.cards[0].question).toBe(
        data.reviewers[0].cards[0].question,
      );
    else expect(sent.reviewerContext).toBeUndefined();
  },
);

test("page presentation uses the line logo and desktop Enter sends while Shift+Enter does not", async () => {
  request.mockResolvedValue({ answer: "Let’s study." });
  const view = render(
    <AiAssistant presentation="page" onSave={jest.fn()} onClose={jest.fn()} />,
  );
  expect(view.container.querySelector(".ai-page")).toBeInTheDocument();
  expect(view.container.querySelector(".mira-line-logo")).toHaveAttribute(
    "src",
    "/brand/mark.png",
  );
  change("Your study question", "Explain cells");
  const input = screen.getByLabelText("Your study question");
  fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
  expect(request).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  expect(request).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "Enter" });
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  expect(request.mock.calls[0][0].prompt).toBe("Explain cells");
});

test("mobile Enter keeps composing and requires the send button", async () => {
  setMedia("(max-width: 640px)", true);
  request.mockResolvedValue({
    answer: "Mitochondria make usable cellular energy.",
  });
  render(
    <AiAssistant presentation="page" onSave={jest.fn()} onClose={jest.fn()} />,
  );
  change("Your study question", "Explain mitochondria");
  const input = screen.getByLabelText("Your study question");
  expect(input).toHaveAttribute("enterkeyhint", "enter");
  fireEvent.keyDown(input, { key: "Enter" });
  expect(request).not.toHaveBeenCalled();
  fireEvent.change(input, {
    target: { value: "Explain mitochondria\nwith a simple example" },
  });
  expect(input).toHaveValue("Explain mitochondria\nwith a simple example");
  click("Send question");
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  expect(request.mock.calls[0][0].prompt).toBe(
    "Explain mitochondria\nwith a simple example",
  );
});

test("chat input only becomes internally scrollable after reaching its growth limit", () => {
  render(
    <AiAssistant presentation="page" onSave={jest.fn()} onClose={jest.fn()} />,
  );
  const input = screen.getByLabelText(
    "Your study question",
  ) as HTMLTextAreaElement;
  expect(input.style.overflowY).toBe("hidden");
  Object.defineProperty(input, "scrollHeight", {
    configurable: true,
    value: 220,
  });
  fireEvent.change(input, { target: { value: "A long study question" } });
  expect(input.style.height).toBe("160px");
  expect(input.style.overflowY).toBe("auto");
  Object.defineProperty(input, "scrollHeight", {
    configurable: true,
    value: 60,
  });
  fireEvent.change(input, { target: { value: "Short again" } });
  expect(input.style.height).toBe("60px");
  expect(input.style.overflowY).toBe("hidden");
});
