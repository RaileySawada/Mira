import { confirmAction as confirm } from "../../src/components/confirmAction";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settings } from "../../src/pages/Settings";
import { emptyData } from "../../src/services/storage";
import { library } from "../support/fixtures";

function backup(content: unknown = library()) {
  const file = new File(["backup"], "mira.json", { type: "application/json" });
  Object.defineProperty(file, "text", {
    value: async () =>
      typeof content === "string" ? content : JSON.stringify(content),
  });
  return file;
}
test("saves all study defaults without reverting the active theme", async () => {
  const user = userEvent.setup(),
    update = jest.fn(() => true),
    theme = jest.fn();
  const { rerender } = render(
    <Settings data={library()} update={update} onThemeChange={theme} />,
  );
  await user.type(screen.getByLabelText("What should we call you?"), "Mira");
  fireEvent.change(
    screen.getByRole("spinbutton", { name: /Daily question goal/ }),
    { target: { value: "20" } },
  );
  fireEvent.change(
    screen.getByRole("spinbutton", { name: /Daily review questions/ }),
    { target: { value: "5" } },
  );
  for (const checkbox of screen.getAllByRole("checkbox"))
    await user.click(checkbox);
  await user.click(screen.getByRole("button", { name: /Dark/ }));
  expect(theme).toHaveBeenCalledWith("dark", expect.any(HTMLElement));
  const data = library();
  data.settings.theme = "dark";
  rerender(<Settings data={data} update={update} onThemeChange={theme} />);
  await user.click(screen.getByRole("button", { name: "Save preferences" }));
  expect(update).toHaveBeenLastCalledWith(
    expect.objectContaining({
      settings: expect.objectContaining({
        name: "Mira",
        dailyGoal: 20,
        dailyQuizSize: 5,
        autoDaily: false,
        shuffle: false,
        theme: "dark",
      }),
    }),
  );
  expect(screen.getByRole("status")).toHaveTextContent("saved");
});
test("exports and opens the file chooser", async () => {
  const click = jest
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  render(
    <Settings data={library()} update={jest.fn()} onThemeChange={jest.fn()} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Export JSON" }));
  expect(click).toHaveBeenCalled();
  const file = screen.getByLabelText("Import Mira backup");
  const fileClick = jest.spyOn(file, "click");
  await userEvent.click(screen.getByRole("button", { name: "Import JSON" }));
  expect(fileClick).toHaveBeenCalled();
});
test("imports a validated backup and resets the file input", async () => {
  const update = jest.fn(() => true);
  render(
    <Settings data={emptyData()} update={update} onThemeChange={jest.fn()} />,
  );
  await userEvent.upload(screen.getByLabelText("Import Mira backup"), backup());
  expect(await screen.findByRole("status")).toHaveTextContent("imported");
  expect(update).toHaveBeenCalledWith({
    ...library(),
    milestones: { importedReviewer: true },
  });
  expect(screen.getByLabelText("Import Mira backup")).toHaveValue("");
});
test("cancelled imports and failed saves preserve the library", async () => {
  const update = jest.fn(() => false);
  render(
    <Settings data={library()} update={update} onThemeChange={jest.fn()} />,
  );
  jest.mocked(confirm).mockResolvedValueOnce(false);
  await userEvent.upload(screen.getByLabelText("Import Mira backup"), backup());
  expect(update).not.toHaveBeenCalled();
  await userEvent.upload(screen.getByLabelText("Import Mira backup"), backup());
  await waitFor(() => expect(update).toHaveBeenCalled());
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Import Mira backup"), {
    target: { files: [] },
  });
});
test.each(["invalid", "oversized", "unreadable", "unknown"])(
  "rejects %s backups with an explanation",
  async (kind) => {
    render(
      <Settings
        data={library()}
        update={jest.fn()}
        onThemeChange={jest.fn()}
      />,
    );
    let file = backup("bad JSON");
    if (kind === "oversized")
      Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 });
    if (kind === "unreadable" || kind === "unknown") {
      file = new File([""], "backup.json", { type: "application/json" });
      Object.defineProperty(file, "text", {
        value: async () => {
          throw kind === "unknown" ? "failed" : new Error("Cannot read file");
        },
      });
    }
    await userEvent.upload(screen.getByLabelText("Import Mira backup"), file);
    expect(await screen.findByRole("alert")).not.toBeEmptyDOMElement();
  },
);
test("clearing data requires confirmation and reports successful resets", async () => {
  const update = jest.fn(() => true);
  render(
    <Settings data={library()} update={update} onThemeChange={jest.fn()} />,
  );
  jest.mocked(confirm).mockResolvedValueOnce(false);
  await userEvent.click(
    screen.getByRole("button", { name: "Clear all local data" }),
  );
  expect(update).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole("button", { name: "Clear all local data" }),
  );
  expect(update).toHaveBeenCalledWith(emptyData());
  expect(screen.getByRole("status")).toHaveTextContent("cleared");
});

test("failed preference saves and resets return to idle with an in-app error", async () => {
  render(
    <Settings
      data={library()}
      update={jest.fn(() => false)}
      onThemeChange={jest.fn()}
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Save preferences" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "could not be completed",
  );
  expect(
    screen.getByRole("button", { name: "Save preferences" }),
  ).toHaveAttribute("data-state", "idle");
  await userEvent.click(
    screen.getByRole("button", { name: "Clear all local data" }),
  );
  expect(
    screen.getByRole("button", { name: "Clear all local data" }),
  ).toHaveAttribute("data-state", "idle");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(alert).not.toHaveBeenCalled();
});
