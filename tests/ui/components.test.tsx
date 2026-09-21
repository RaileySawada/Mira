import { useState } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchSelect } from "../../src/components/SearchSelect";
import { ThemePicker } from "../../src/components/ThemePicker";
import { RouteLink } from "../../src/components/RouteLink";
import { EmptyState, Modal, PageHeading } from "../../src/components/ui";
import { Sidebar, MobileHeader } from "../../src/components/Navigation";
import { Icon } from "../../src/components/Icon";
import { setMedia } from "../support/setup";

test("shared heading and empty state expose their actions", async () => {
  const action = jest.fn();
  render(
    <>
      <PageHeading
        eyebrow="Study"
        title="Hello"
        description="Welcome"
        action={<button onClick={action}>Begin</button>}
      />
      <EmptyState title="No cards" description="Add your first" />
    </>,
  );
  expect(screen.getByRole("heading", { name: "Hello" })).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Begin" }));
  expect(action).toHaveBeenCalled();
});
test("modal locks the page, provides a footer and handles cancel and close", () => {
  const close = jest.fn();
  const { unmount } = render(
    <Modal title="Edit" onClose={close} footer={<button>Save</button>}>
      Fields
    </Modal>,
  );
  expect(screen.getByRole("dialog")).toHaveAttribute("open");
  expect(document.body.style.position).toBe("fixed");
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { cancelable: true }),
  );
  fireEvent.click(screen.getByLabelText("Close dialog"));
  expect(close).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  unmount();
  expect(document.body.style.position).toBe("");
});
test("theme buttons emit the selected preference and button origin", async () => {
  const change = jest.fn();
  const { rerender } = render(<ThemePicker value="system" onChange={change} />);
  expect(screen.getByRole("button", { name: /System/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await userEvent.click(screen.getByRole("button", { name: /Dark/ }));
  expect(change).toHaveBeenCalledWith("dark", expect.any(HTMLButtonElement));
  rerender(<ThemePicker value="light" onChange={change} />);
  expect(screen.getByRole("button", { name: /Light/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
test("route links preserve modified clicks and caller cancellation", () => {
  const { rerender } = render(<RouteLink page="Topics">Topics</RouteLink>);

  fireEvent.click(screen.getByRole("link", { name: "Topics" }));

  expect(location.pathname).toBe("/topics");

  history.replaceState(null, "", "/");

  fireEvent.click(screen.getByRole("link", { name: "Topics" }), {
    ctrlKey: true,
  });

  expect(location.pathname).toBe("/");

  rerender(
    <RouteLink page="Topics" target="_blank">
      Topics
    </RouteLink>,
  );

  const newTabLink = screen.getByRole("link", {
    name: "Topics",
  });

  expect(newTabLink).toHaveAttribute("target", "_blank");
  expect(newTabLink).toHaveAttribute("href", "/topics");
  expect(location.pathname).toBe("/");
});

function SelectHarness() {
  const [value, setValue] = useState("");
  return (
    <>
      <SearchSelect
        label="Topic"
        value={value}
        onChange={setValue}
        options={[
          { value: "", label: "Uncategorized" },
          { value: "bio", label: "Biology" },
          { value: "math", label: "Math" },
        ]}
      />
      <button>Outside</button>
    </>
  );
}
test("searchable selection filters, selects by keyboard, and closes with Escape", async () => {
  const user = userEvent.setup();
  render(<SelectHarness />);
  await user.click(screen.getByRole("button", { name: "Topic" }));
  const search = screen.getByRole("combobox");
  await user.type(search, "xyz");
  expect(screen.getByRole("status")).toHaveTextContent("No matches");
  await user.clear(search);
  await user.type(search, "bio");
  await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");
  expect(screen.getByRole("button", { name: "Topic" })).toHaveTextContent(
    "Biology",
  );
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("button", { name: "Topic" }), {
    key: "ArrowDown",
  });
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});
test("selector supports pointer choice, outside dismissal, and disabled state", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<SelectHarness />);
  await user.click(screen.getByRole("button", { name: "Topic" }));
  await user.click(screen.getByRole("option", { name: "Math" }));
  expect(screen.getByRole("button", { name: "Topic" })).toHaveTextContent(
    "Math",
  );
  await user.click(screen.getByRole("button", { name: "Topic" }));
  await user.click(screen.getByRole("button", { name: "Outside" }));
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Topic" }));
  await user.click(screen.getByRole("button", { name: "Topic" }));
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  rerender(
    <SearchSelect
      label="Topic"
      value="missing"
      options={[]}
      onChange={jest.fn()}
      disabled
    />,
  );
  expect(screen.getByRole("button")).toBeDisabled();
  expect(screen.getByRole("button")).toHaveTextContent("Select an option");
});
test("desktop navigation uses the supplied logo and active page", () => {
  const { container } = render(<Sidebar page="Topics" />);
  expect(screen.getByRole("link", { name: "Topics" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByLabelText("Mira home").textContent).toBe("mira");
  expect(container.querySelector("img")).toHaveAttribute(
    "src",
    "/brand/mark.png",
  );
});
test("mobile menu opens, closes, navigates, and responds to desktop resize", async () => {
  const user = userEvent.setup();
  render(<MobileHeader page="Home" />);
  const trigger = screen.getByRole("button", { name: "Open navigation menu" });
  Object.defineProperty(trigger, "offsetParent", {
    configurable: true,
    value: document.body,
  });
  await user.click(trigger);
  expect(screen.getByRole("dialog", { name: "Navigation menu" })).toBeVisible();
  await user.click(
    within(screen.getByRole("dialog")).getByRole("link", { name: "Topics" }),
  );
  expect(location.pathname).toBe("/topics");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(trigger);
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { cancelable: true }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(trigger);
  fireEvent.click(screen.getByRole("dialog"), { clientX: 500, clientY: 500 });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(trigger);
  act(() => setMedia("(min-width: 1024px)", true));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(trigger);
  await user.click(screen.getByLabelText("Close navigation menu"));
  expect(trigger).toHaveFocus();
});
test("unknown icon names use the shared fallback", () => {
  const { container } = render(<Icon name="unknown" size={32} />);
  expect(container.querySelector("svg")).toHaveAttribute("width", "32");
});

test("sidebar puts settings and documentation in More and has no presence badge", () => {
  const { container } = render(<Sidebar page="Settings" />);
  expect(container.querySelector(".online-count")).toBeNull();
  const menu = container.querySelector("details")!;
  expect(menu.open).toBe(false);
  fireEvent.click(screen.getByText("More"));
  menu.open = true;
  expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  fireEvent.keyDown(menu, { key: "Escape" });
  expect(menu.open).toBe(false);
});
