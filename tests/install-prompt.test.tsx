import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InstallPrompt } from "../src/components/InstallPrompt";
import { setMedia } from "./setup";

function offer(outcome: "accepted" | "dismissed" = "accepted") {
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt: jest.fn().mockResolvedValue(undefined), userChoice: Promise.resolve({ outcome }) });
  act(() => { window.dispatchEvent(event); });
  return event;
}
test("offers native installation once per tab session and supports cancellation", () => {
  const view = render(<InstallPrompt />);
  const event = offer();
  expect(event.defaultPrevented).toBe(true);
  expect(screen.getByRole("region", { name: "Install Mira" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Not now" }));
  offer();
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
  view.unmount();
  render(<InstallPrompt />);
  offer();
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
  expect(event.prompt).not.toHaveBeenCalled();
});
test.each(["accepted", "dismissed"] as const)("handles native installation outcome %s", async outcome => {
  render(<InstallPrompt />);
  const event = offer(outcome);
  fireEvent.click(screen.getByRole("button", { name: "Install Mira" }));
  await waitFor(() => expect(screen.queryByRole("region")).not.toBeInTheDocument());
  expect(event.prompt).toHaveBeenCalledTimes(1);
});
test("does not offer installation inside an installed app", () => {
  setMedia("(display-mode: standalone)", true);
  render(<InstallPrompt />);
  offer();
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
});
test("Apple mobile receives manual installation guidance", () => {
  jest.spyOn(navigator, "userAgent", "get").mockReturnValue("iPhone");
  render(<InstallPrompt />);
  fireEvent.click(screen.getByRole("button", { name: "Install Mira" }));
  expect(screen.getByText(/Share menu/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Got it" }));
  expect(screen.queryByRole("region")).not.toBeInTheDocument();
});
