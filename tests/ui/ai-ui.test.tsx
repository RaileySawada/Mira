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
const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));
beforeEach(() => request.mockReset());

test("chat validates drafts and failures without saving or losing the prompt", async () => {
  render(<AiAssistant onSave={jest.fn()} onClose={jest.fn()} />);
  expect(
    screen.queryByRole("button", { name: "Assistant mode" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Generate reviewers" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send question" })).toBeDisabled();
  change("Your study question", "Create biology reviewers");
  for (const result of [
    null,
    {},
    { answer: "" },
    { answer: "Drafts", topic: "Biology", reviewers: [] },
  ]) {
    request.mockResolvedValueOnce(result);
    click("Send question");
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Your study question")).toHaveValue(
      "Create biology reviewers",
    );
  }
  for (const failure of [new Error("Disconnected"), "Network failure"]) {
    request.mockRejectedValueOnce(failure);
    click("Send question");
    await screen.findByRole("alert");
  }
});

test("chat draft saves can be retried without regenerating", async () => {
  setMedia("(prefers-reduced-motion: reduce)", true);
  request.mockResolvedValue({
    answer: "Drafts ready",
    topic: "Biology",
    reviewers: drafts,
  });
  const save = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
    close = jest.fn();
  render(<AiAssistant onSave={save} onClose={close} />);
  change("Your study question", "Create three biology reviewers");
  click("Send question");
  await screen.findByRole("region", { name: "Generated reviewers" });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Save all reviewers" }),
    ).not.toBeDisabled(),
  );
  click("Save all reviewers");
  await screen.findByRole("alert");
  expect(close).not.toHaveBeenCalled();
  click("Save all reviewers");
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  expect(save).toHaveBeenLastCalledWith("Biology", drafts);
});

test("cancelled chat ignores late reviewer drafts", async () => {
  let resolve!: (value: unknown) => void;
  request.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<AiAssistant onSave={jest.fn()} onClose={jest.fn()} />);
  change("Your study question", "Create biology reviewers");
  click("Send question");
  click("Stop generating");
  expect(request.mock.calls[0][1].aborted).toBe(true);
  await act(async () => {
    resolve({ answer: "Drafts ready", topic: "Biology", reviewers: drafts });
  });
  expect(
    screen.queryByRole("region", { name: "Generated reviewers" }),
  ).not.toBeInTheDocument();
});

test("imported notes open as an editable chat draft without auto sending", () => {
  render(
    <AiAssistant
      importedNotes="Cells contain DNA"
      onSave={jest.fn()}
      onClose={jest.fn()}
    />,
  );
  expect(screen.getByLabelText("Your study question")).toHaveValue(
    "Create reviewers from these notes:\nCells contain DNA",
  );
  expect(request).not.toHaveBeenCalled();
});

test("timeout and unmount abort pending chat requests", async () => {
  jest.useFakeTimers();
  try {
    request.mockImplementation(
      (_input, signal) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener("abort", () => reject(new Error("Aborted")), {
            once: true,
          }),
        ),
    );
    const view = render(<AiAssistant onSave={jest.fn()} onClose={jest.fn()} />);
    change("Your study question", "Create biology reviewers");
    click("Send question");
    await act(async () => {
      jest.advanceTimersByTime(35000);
    });
    expect(screen.getByRole("alert")).toHaveTextContent("too long");
    change("Your study question", "Try again");
    click("Send question");
    const signal = request.mock.calls[1][1];
    await act(async () => view.unmount());
    expect(signal.aborted).toBe(true);
  } finally {
    jest.useRealTimers();
  }
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

test("library actions are previewed, can fail safely and apply only after a click", async () => {
  setMedia("(prefers-reduced-motion: reduce)", true);
  const actions = [
    { kind: "move_reviewer", reviewer: "Cell biology", destination: "Finals" },
  ];
  request.mockResolvedValue({ answer: "Review your plan.", actions });
  const apply = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
  render(
    <AiAssistant
      onSave={jest.fn()}
      onClose={jest.fn()}
      onApplyActions={apply}
    />,
  );
  change("Your study question", "Move Cell biology to Finals");
  click("Send question");
  await screen.findByRole("region", { name: "Library changes" });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Apply changes" }),
    ).not.toBeDisabled(),
  );
  expect(apply).not.toHaveBeenCalled();
  click("Apply changes");
  await screen.findByRole("alert");
  expect(screen.getByRole("region", { name: "Library changes" })).toBeVisible();
  click("Apply changes");
  expect(apply).toHaveBeenLastCalledWith(actions);
  await waitFor(() =>
    expect(
      screen.queryByRole("region", { name: "Library changes" }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.getByText(
      "The requested library changes have been saved on this device.",
    ),
  ).toBeVisible();
});

test("dismissing a library plan makes no changes", async () => {
  setMedia("(prefers-reduced-motion: reduce)", true);
  request.mockResolvedValue({
    answer: "Review your plan.",
    actions: [{ kind: "create_folder", name: "Finals" }],
  });
  const apply = jest.fn();
  render(
    <AiAssistant
      onSave={jest.fn()}
      onClose={jest.fn()}
      onApplyActions={apply}
    />,
  );
  change("Your study question", "Create Finals folder");
  click("Send question");
  await screen.findByRole("region", { name: "Library changes" });
  click("Dismiss");
  expect(apply).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("region", { name: "Library changes" }),
  ).not.toBeInTheDocument();
});

test("chat reviewer drafts retain the requested destination folder", async () => {
  setMedia("(prefers-reduced-motion: reduce)", true);
  request.mockResolvedValue({
    answer: "Review these cards.",
    topic: "Biology",
    folder: "Finals",
    reviewers: drafts,
  });
  const save = jest.fn().mockReturnValue(true);
  render(<AiAssistant onSave={save} onClose={jest.fn()} />);
  change("Your study question", "Create biology reviewers in Finals");
  click("Send question");
  await screen.findByRole("region", { name: "Generated reviewers" });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Save all reviewers" }),
    ).not.toBeDisabled(),
  );
  await act(async () => {
    click("Save all reviewers");
  });
  expect(save).toHaveBeenCalledWith("Biology", drafts, "Finals");
});

test("Mira ignores old model preferences and offers only assistant modes", async () => {
  localStorage.setItem("mira.ai.model", "google/gemini-3.8-flash");
  setMedia("(prefers-reduced-motion: reduce)", true);
  request.mockResolvedValue({ answer: "Hello" });
  render(<AiAssistant onSave={jest.fn()} onClose={jest.fn()} />);
  expect(
    screen.queryByRole("button", { name: "AI model" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Assistant mode" }),
  ).not.toBeInTheDocument();
  change("Your study question", "Explain cells");
  click("Send question");
  await waitFor(() => expect(request).toHaveBeenCalled());
  expect(request.mock.calls[0][0]).not.toHaveProperty("model");
});

test("chat-created reviewers save through the online launcher", async () => {
  setMedia("(prefers-reduced-motion: reduce)", true);
  request.mockResolvedValue({
    answer: "Drafts ready",
    topic: "Biology",
    reviewers: drafts,
  });
  const update = jest.fn().mockReturnValue(true);
  render(<OnlineAssistant data={library()} update={update} />);
  click("AI study assistant");
  await screen.findByLabelText("Your study question");
  change("Your study question", "Create biology reviewers");
  click("Send question");
  await screen.findByRole("region", { name: "Generated reviewers" });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Save all reviewers" }),
    ).not.toBeDisabled(),
  );
  click("Save all reviewers");
  await waitFor(() =>
    expect(
      screen.queryByRole("complementary", { name: "Your study assistant" }),
    ).not.toBeInTheDocument(),
  );
  expect(update.mock.calls.some(([data]) => data.reviewers.length === 4)).toBe(
    true,
  );
});

test("disconnect aborts chat work and reconnect does not restart it", async () => {
  let online = true;
  jest.spyOn(navigator, "onLine", "get").mockImplementation(() => online);
  request.mockImplementation(
    (_input, signal) =>
      new Promise((_resolve, reject) =>
        signal.addEventListener(
          "abort",
          () => reject(new Error("Disconnected")),
          { once: true },
        ),
      ),
  );
  render(<OnlineAssistant data={library()} update={jest.fn()} />);
  click("AI study assistant");
  await screen.findByLabelText("Your study question");
  change("Your study question", "Create biology reviewers");
  click("Send question");
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
  expect(
    screen.getByRole("complementary", { name: "Your study assistant" }),
  ).toBeVisible();
  expect(request).toHaveBeenCalledTimes(1);
});
