import { fireEvent, render } from "@testing-library/react";
import { MiraAmbient } from "../../src/features/ai/MiraAmbient";

test("only one palette is active and motion pauses when the tab is hidden", () => {
  const view = render(<MiraAmbient mood="normal" />);
  expect(view.container.querySelectorAll('[data-active="true"]')).toHaveLength(1);
  view.rerender(<MiraAmbient mood="thinking" />);
  expect(view.container.querySelector('[data-active="true"]')).toHaveAttribute("data-tone", "thinking");
  const hidden = jest.spyOn(document, "hidden", "get").mockReturnValue(true);
  fireEvent(document, new Event("visibilitychange"));
  expect(view.container.firstChild).toHaveAttribute("data-paused", "true");
  hidden.mockReturnValue(false);
  fireEvent(document, new Event("visibilitychange"));
  expect(view.container.firstChild).toHaveAttribute("data-paused", "false");
  expect(view.container.firstChild).toHaveAttribute("aria-hidden", "true");
});
