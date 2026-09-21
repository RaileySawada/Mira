import { act, fireEvent, screen } from "@testing-library/react";
import { confirmAction } from "../../src/components/confirmAction";
jest.unmock("../../src/components/confirmAction");
test.each([false, true])(
  "custom confirmation resolves %s without native popups",
  async (accepted) => {
    let result: Promise<boolean>;
    await act(async () => {
      result = confirmAction("Leave this quiz?");
    });
    expect(
      screen.getByRole("dialog", { name: "Please confirm" }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: accepted ? "Continue" : "Cancel" }),
    );
    await expect(result!).resolves.toBe(accepted);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.confirm).not.toHaveBeenCalled();
  },
);
test("closing the custom dialog cancels", async () => {
  let result: Promise<boolean>;
  await act(async () => {
    result = confirmAction("Delete reviewer?");
  });
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  await expect(result!).resolves.toBe(false);
});
