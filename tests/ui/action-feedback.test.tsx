import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { useActionFeedback } from "../../src/hooks/useActionFeedback";
import { ProcessButton } from "../../src/components/ProcessButton";
import { SearchSelect } from "../../src/components/SearchSelect";

beforeEach(() => jest.useFakeTimers());

test("actions show loading, prevent duplicates, show success and return to idle", async () => {
  const { result } = renderHook(useActionFeedback);
  let finish!: (value: boolean) => void;
  const action = jest.fn(
    () =>
      new Promise<boolean>((resolve) => {
        finish = resolve;
      }),
  );
  const complete = jest.fn();
  act(() => {
    void result.current.run(action, complete);
  });
  expect(result.current.state).toBe("loading");
  await act(async () => {
    await result.current.run(action);
  });
  expect(action).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish(true);
  });
  expect(result.current.state).toBe("success");
  expect(complete).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(600));
  expect(complete).toHaveBeenCalledTimes(1);
  expect(result.current.state).toBe("idle");
  await act(async () => {
    await result.current.run(() => true);
  });
  act(() => jest.advanceTimersByTime(600));
  expect(result.current.state).toBe("idle");
});

test("failed and cancelled actions never show success and can be retried", async () => {
  const { result } = renderHook(useActionFeedback);
  await act(async () => {
    await result.current.run(() => false);
  });
  expect(result.current.error).toMatch(/could not/);
  await act(async () => {
    await result.current.run(() => {
      throw new Error("Storage full");
    });
  });
  expect(result.current.error).toBe("Storage full");
  await act(async () => {
    await result.current.run(() => {
      throw "failed";
    });
  });
  expect(result.current.error).toMatch(/could not/);
  await act(async () => {
    await result.current.run(() => null);
  });
  expect(result.current.error).toBe("");
  expect(result.current.state).toBe("idle");
  act(() => result.current.reset());
});

test.each(["resolve", "reject"])(
  "ignores late %s after unmount",
  async (mode) => {
    const { result, unmount } = renderHook(useActionFeedback);
    let resolve!: () => void, reject!: () => void;
    const pending = new Promise<void>((done, fail) => {
      resolve = done;
      reject = () => fail(new Error("Late"));
    });
    act(() => {
      void result.current.run(() => pending);
    });
    unmount();
    await act(async () => {
      if (mode === "resolve") resolve();
      else reject();
    });
  },
);

test("process button exposes progress and success without changing its accessible action name", () => {
  const { rerender } = render(<ProcessButton label="Save" state="idle" />);
  expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  rerender(<ProcessButton label="Save" state="loading" />);
  expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByText("Working…")).toBeVisible();
  rerender(<ProcessButton label="Save" state="success" />);
  expect(screen.getByRole("button")).toHaveAttribute("data-state", "success");
  expect(screen.getByText("Done")).toBeVisible();
  rerender(
    <ProcessButton label="Save" state="idle" disabled>
      Save changes
    </ProcessButton>,
  );
  expect(screen.getByText("Save changes")).toBeVisible();
  expect(screen.getByRole("button")).toBeDisabled();
});

test("opening selection keeps focus on the trigger and supports keyboard choice", () => {
  const change = jest.fn();
  const { rerender } = render(
    <SearchSelect
      label="Topic"
      value="a"
      options={[
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ]}
      onChange={change}
    />,
  );
  const trigger = screen.getByRole("button");
  trigger.focus();
  fireEvent.click(trigger);
  expect(trigger).toHaveFocus();
  expect(screen.getByRole("combobox")).not.toHaveFocus();
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  fireEvent.keyDown(trigger, { key: "ArrowUp" });
  fireEvent.keyDown(trigger, { key: "Enter" });
  expect(change).toHaveBeenCalledWith("a");
  fireEvent.keyDown(trigger, { key: "ArrowUp" });
  fireEvent.keyDown(trigger, { key: "Escape" });
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  rerender(
    <SearchSelect label="Topic" value="" options={[]} onChange={change} />,
  );
  fireEvent.click(trigger);
  fireEvent.keyDown(trigger, { key: "Enter" });
  expect(change).toHaveBeenCalledTimes(1);
});

test("Escape from the search field closes the dropdown and restores trigger focus", () => {
  render(
    <SearchSelect
      label="Topic"
      value="a"
      options={[{ value: "a", label: "A" }]}
      onChange={jest.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button"));
  const search = screen.getByRole("combobox");
  search.focus();
  fireEvent.keyDown(search, { key: "Escape" });
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(screen.getByRole("button")).toHaveFocus();
});
