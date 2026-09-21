import AiAssistant from "../../src/features/ai/AiAssistant";
import { requestAi } from "../../src/services/ai";
jest.mock("../../src/services/ai", () => ({ requestAi: jest.fn() }));
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { useVoiceInput } from "../../src/hooks/useVoiceInput";

class RecognitionMock {
  static current: RecognitionMock;
  lang = "";
  continuous = false;
  interimResults = false;
  onresult:
    | ((event: {
        results: ({ transcript: string }[] & { isFinal: boolean })[];
      }) => void)
    | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = jest.fn();
  stop = jest.fn(() => this.onend?.());
  abort = jest.fn();
  constructor() {
    RecognitionMock.current = this;
  }
}
beforeEach(() =>
  Object.defineProperty(window, "SpeechRecognition", {
    configurable: true,
    value: RecognitionMock,
  }),
);
afterEach(() => Reflect.deleteProperty(window, "SpeechRecognition"));

test("voice input updates an editable draft, replaces interim text, and cleans up", () => {
  const transcript = jest.fn();
  const { result, unmount } = renderHook(() => useVoiceInput(transcript));
  expect(result.current.supported).toBe(true);
  act(() => result.current.start("Explain"));
  const recognition = RecognitionMock.current;
  expect(recognition.start).toHaveBeenCalledTimes(1);
  expect(result.current.listening).toBe(true);
  act(() =>
    recognition.onresult?.({
      results: [Object.assign([{ transcript: "cell" }], { isFinal: true })],
    }),
  );
  act(() =>
    recognition.onresult?.({
      results: [
        Object.assign([{ transcript: "cell biology" }], { isFinal: true }),
      ],
    }),
  );
  expect(transcript).toHaveBeenLastCalledWith("Explain cell biology");
  act(() => result.current.stop());
  expect(result.current.listening).toBe(false);
  act(() => result.current.start(""));
  const active = RecognitionMock.current;
  unmount();
  expect(active.abort).toHaveBeenCalledTimes(1);
  expect(active.onresult).toBeNull();
});
test("permission errors provide inline guidance and unsupported browsers are detected", () => {
  const { result } = renderHook(() => useVoiceInput(jest.fn()));
  act(() => result.current.start(""));
  act(() => {
    RecognitionMock.current.onerror?.({ error: "not-allowed" });
    RecognitionMock.current.onend?.();
  });
  expect(result.current.error).toContain("permission was denied");
  expect(result.current.listening).toBe(false);
  Reflect.deleteProperty(window, "SpeechRecognition");
  expect(
    renderHook(() => useVoiceInput(jest.fn())).result.current.supported,
  ).toBe(false);
});

test("dictation never submits and can be edited before sending", () => {
  jest.mocked(requestAi).mockImplementation(() => new Promise(() => {}));
  render(<AiAssistant onClose={jest.fn()} onSave={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
  act(() =>
    RecognitionMock.current.onresult?.({
      results: [
        Object.assign([{ transcript: "Explain cells" }], { isFinal: true }),
      ],
    }),
  );
  expect(screen.getByLabelText("Your study question")).toHaveValue(
    "Explain cells",
  );
  expect(screen.getByRole("button", { name: "Send question" })).toBeDisabled();
  expect(requestAi).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Stop recording" }));
  fireEvent.change(screen.getByLabelText("Your study question"), {
    target: { value: "Explain cell biology" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  expect(requestAi).toHaveBeenCalledWith(
    expect.objectContaining({ prompt: "Explain cell biology" }),
    expect.any(AbortSignal),
  );
});

test("continues across pauses without losing text and cancels restart on Stop", () => {
  jest.useFakeTimers();
  try {
    const transcript = jest.fn();
    const { result, unmount } = renderHook(() => useVoiceInput(transcript));
    act(() => result.current.start("Explain"));
    const recognition = RecognitionMock.current;
    expect(recognition.continuous).toBe(false);
    act(() =>
      recognition.onresult?.({
        results: [Object.assign([{ transcript: "cells" }], { isFinal: true })],
      }),
    );
    act(() => {
      recognition.onerror?.({ error: "no-speech" });
      recognition.onend?.();
    });
    expect(result.current.listening).toBe(true);
    act(() => jest.advanceTimersByTime(500));
    const resumed = RecognitionMock.current;
    expect(resumed).not.toBe(recognition);
    expect(resumed.start).toHaveBeenCalledTimes(1);
    act(() =>
      resumed.onresult?.({
        results: [
          Object.assign([{ transcript: "and DNA" }], { isFinal: true }),
        ],
      }),
    );
    expect(transcript).toHaveBeenLastCalledWith("Explain cells and DNA");
    act(() => resumed.onend?.());
    act(() => result.current.stop());
    act(() => jest.advanceTimersByTime(1000));
    expect(RecognitionMock.current).toBe(resumed);
    expect(result.current.listening).toBe(false);
    unmount();
  } finally {
    jest.useRealTimers();
  }
});

test("late callbacks from a stopped recording cannot overwrite a new recording", () => {
  const transcript = jest.fn();
  const { result } = renderHook(() => useVoiceInput(transcript));
  act(() => result.current.start(""));
  const old = RecognitionMock.current;
  const lateResult = old.onresult;
  const lateEnd = old.onend;
  act(() => result.current.stop());
  act(() => result.current.start("New"));
  act(() => {
    lateResult?.({
      results: [Object.assign([{ transcript: "stale" }], { isFinal: true })],
    });
    lateEnd?.();
  });
  expect(transcript).not.toHaveBeenCalled();
  expect(result.current.listening).toBe(true);
});

function speech(text: string, isFinal: boolean) {
  return Object.assign([{ transcript: text }], { isFinal });
}

test("replayed results replace interim text without duplicating confirmed words", () => {
  const transcript = jest.fn();
  const { result } = renderHook(() => useVoiceInput(transcript));
  act(() => result.current.start("Explain"));
  const current = RecognitionMock.current;
  act(() => current.onresult?.({ results: [speech("cell", false)] }));
  act(() => current.onresult?.({ results: [speech("cell biology", false)] }));
  act(() => current.onresult?.({ results: [speech("cell biology", true)] }));
  act(() => current.onresult?.({ results: [speech("cell biology", true)] }));
  expect(transcript).toHaveBeenLastCalledWith("Explain cell biology");
  act(() => result.current.stop());
});

test("interim guesses never get duplicated across automatic restarts", () => {
  jest.useFakeTimers();
  try {
    const transcript = jest.fn();
    const { result, unmount } = renderHook(() => useVoiceInput(transcript));
    act(() => result.current.start(""));
    const old = RecognitionMock.current;
    const lateResult = old.onresult;
    act(() =>
      old.onresult?.({
        results: [speech("cell", true), speech("biology", false)],
      }),
    );
    act(() => old.onend?.());
    expect(transcript).toHaveBeenLastCalledWith("cell");
    act(() => jest.advanceTimersByTime(500));
    const next = RecognitionMock.current;
    act(() => next.onresult?.({ results: [speech("biology", true)] }));
    act(() => lateResult?.({ results: [speech("cell biology", true)] }));
    expect(transcript).toHaveBeenLastCalledWith("cell biology");
    unmount();
    act(() => jest.runOnlyPendingTimers());
    expect(next.abort).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});

test("intentional repeated words are preserved and removed interim guesses disappear", () => {
  const transcript = jest.fn();
  const { result } = renderHook(() => useVoiceInput(transcript));
  act(() => result.current.start(""));
  const current = RecognitionMock.current;
  act(() =>
    current.onresult?.({
      results: [speech("very very important", true), speech("guess", false)],
    }),
  );
  act(() =>
    current.onresult?.({ results: [speech("very very important", true)] }),
  );
  expect(transcript).toHaveBeenLastCalledWith("very very important");
  act(() => result.current.stop());
});
