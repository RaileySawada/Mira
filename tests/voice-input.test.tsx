import AiAssistant from "../src/features/ai/AiAssistant";
import { requestAi } from "../src/services/ai";
jest.mock("../src/services/ai", () => ({ requestAi: jest.fn() }));
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useVoiceInput } from "../src/hooks/useVoiceInput";

class RecognitionMock {
  static current: RecognitionMock;
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = jest.fn();
  stop = jest.fn(() => this.onend?.());
  abort = jest.fn();
  constructor() { RecognitionMock.current = this; }
}
beforeEach(() => Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: RecognitionMock }));
afterEach(() => Reflect.deleteProperty(window, "SpeechRecognition"));

test("voice input updates an editable draft, replaces interim text, and cleans up", () => {
  const transcript = jest.fn();
  const { result, unmount } = renderHook(() => useVoiceInput(transcript));
  expect(result.current.supported).toBe(true);
  act(() => result.current.start("Explain"));
  const recognition = RecognitionMock.current;
  expect(recognition.start).toHaveBeenCalledTimes(1);
  expect(result.current.listening).toBe(true);
  act(() => recognition.onresult?.({ results: [[{ transcript: "cell" }]] }));
  act(() => recognition.onresult?.({ results: [[{ transcript: "cell biology" }]] }));
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
  act(() => { RecognitionMock.current.onerror?.({ error: "not-allowed" }); RecognitionMock.current.onend?.(); });
  expect(result.current.error).toContain("permission was denied");
  expect(result.current.listening).toBe(false);
  Reflect.deleteProperty(window, "SpeechRecognition");
  expect(renderHook(() => useVoiceInput(jest.fn())).result.current.supported).toBe(false);
});

test("dictation never submits and can be edited before sending", () => {
  jest.mocked(requestAi).mockImplementation(() => new Promise(() => {}));
  render(<AiAssistant onClose={jest.fn()} onSave={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
  act(() => RecognitionMock.current.onresult?.({ results: [[{ transcript: "Explain cells" }]] }));
  expect(screen.getByLabelText("Your study question")).toHaveValue("Explain cells");
  expect(screen.getByRole("button", { name: "Send question" })).toBeDisabled();
  expect(requestAi).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Stop recording" }));
  fireEvent.change(screen.getByLabelText("Your study question"), { target: { value: "Explain cell biology" } });
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  expect(requestAi).toHaveBeenCalledWith(expect.objectContaining({ prompt: "Explain cell biology" }), expect.any(AbortSignal));
});

test("continues across pauses without losing text and cancels restart on Stop", () => {
  jest.useFakeTimers();
  try {
    const transcript = jest.fn();
    const { result, unmount } = renderHook(() => useVoiceInput(transcript));
    act(() => result.current.start("Explain"));
    const recognition = RecognitionMock.current;
    expect(recognition.continuous).toBe(true);
    act(() => recognition.onresult?.({ results: [[{ transcript: "cells" }]] }));
    act(() => { recognition.onerror?.({ error: "no-speech" }); recognition.onend?.(); });
    expect(result.current.listening).toBe(true);
    act(() => jest.advanceTimersByTime(500));
    expect(recognition.start).toHaveBeenCalledTimes(2);
    act(() => recognition.onresult?.({ results: [[{ transcript: "and DNA" }]] }));
    expect(transcript).toHaveBeenLastCalledWith("Explain cells and DNA");
    act(() => recognition.onend?.());
    act(() => result.current.stop());
    act(() => jest.advanceTimersByTime(1000));
    expect(recognition.start).toHaveBeenCalledTimes(2);
    expect(result.current.listening).toBe(false);
    unmount();
  } finally { jest.useRealTimers(); }
});
