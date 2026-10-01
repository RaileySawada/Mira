import App from "../../src/app/App";
import { CONSENT_KEY } from "../../src/config/storage";
import { POLICY_VERSION } from "../../src/config/policy";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Introduction } from "../../src/features/onboarding/Introduction";
import {
  needsIntroduction,
  completeIntroduction,
} from "../../src/features/onboarding/onboarding";
import { emptyData } from "../../src/services/storage";
import { library } from "../support/fixtures";
import { ONBOARDING_KEY } from "../../src/config/storage";

beforeEach(() => localStorage.removeItem(ONBOARDING_KEY));
test("only empty unfinished workspaces need onboarding, and completion persists", () => {
  expect(needsIntroduction(emptyData())).toBe(true);
  expect(needsIntroduction(library())).toBe(false);
  completeIntroduction();
  expect(needsIntroduction(emptyData())).toBe(false);
});
test("unavailable storage stays recoverable and does not silently complete", () => {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw Error("blocked");
  });
  expect(needsIntroduction(emptyData())).toBe(true);
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw Error("blocked");
  });
  expect(completeIntroduction).toThrow("Could not remember");
});
test("setup previews themes, keeps choices through Back, and saves before navigation", async () => {
  const save = jest.fn(async () => true),
    done = jest.fn(),
    preview = jest.fn();
  render(
    <Introduction
      settings={emptyData().settings}
      onSave={save}
      onDone={done}
      onPreviewTheme={preview}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Let’s begin" }));
  fireEvent.change(screen.getByPlaceholderText("Your name"), {
    target: { value: " Mira " },
  });
  fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
  expect(preview).toHaveBeenCalledWith("dark");
  fireEvent.click(screen.getByRole("radio", { name: /20/ }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByPlaceholderText("Your name")).toHaveValue(" Mira ");
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("radio", { name: /Import a backup/ }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Start learning" }));
  });
  expect(save).toHaveBeenCalledWith({
    name: "Mira",
    theme: "dark",
    dailyGoal: 20,
  });
  await waitFor(() => expect(done).toHaveBeenCalledWith("import"));
});
test("skip preserves preferences and failed saves allow retry", async () => {
  const save = jest.fn().mockResolvedValueOnce(false).mockResolvedValue(true),
    done = jest.fn();
  render(
    <Introduction
      settings={emptyData().settings}
      onSave={save}
      onDone={done}
      onPreviewTheme={jest.fn()}
    />,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Skip introduction" }));
  });
  expect(screen.getByRole("alert")).toBeVisible();
  expect(done).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Skip introduction" }));
  });
  expect(save).toHaveBeenLastCalledWith(undefined);
  await waitFor(() => expect(done).toHaveBeenCalledWith("explore"));
});

function acceptPolicies() {
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({
      version: POLICY_VERSION,
      acceptedAt: new Date().toISOString(),
    }),
  );
}
test.each([
  ["create", /Start a new chapter/],
  ["import", /Your space. Your pace./],
])("app finishes onboarding into %s", async (choice, heading) => {
  acceptPolicies();
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Let’s begin" }));
  fireEvent.change(screen.getByPlaceholderText("Your name"), {
    target: { value: "Ada" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  if (choice === "import")
    fireEvent.click(screen.getByRole("radio", { name: /Import a backup/ }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Start learning" }));
  });
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: heading })).toBeVisible(),
  );
  expect(localStorage.getItem(ONBOARDING_KEY)).toBe("done");
  expect(location.pathname).toBe(
    choice === "import" ? "/settings" : "/reviewers",
  );
});
