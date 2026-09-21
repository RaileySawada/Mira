import { registerPwa } from "../../src/services/pwa";
import { waitFor } from "@testing-library/react";

beforeEach(() => Object.assign(globalThis, { __MIRA_PRODUCTION__: true }));
test("production registers the service worker on window load", async () => {
  const register = jest.fn().mockResolvedValue({});
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  });
  const listen = jest.spyOn(window, "addEventListener");
  registerPwa();
  const listener = listen.mock.calls.find(
    (call) => call[0] === "load",
  )![1] as EventListener;
  listener(new Event("load"));
  expect(register).toHaveBeenCalledWith("/sw.js");
  window.removeEventListener("load", listener);
});
test("registration failures are announced visibly", async () => {
  const register = jest.fn().mockRejectedValue(new Error("offline"));
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  });
  const listen = jest.spyOn(window, "addEventListener");
  registerPwa();
  const listener = listen.mock.calls.find(
    (call) => call[0] === "load",
  )![1] as EventListener;
  listener(new Event("load"));
  await waitFor(() =>
    expect(document.querySelector('[role="status"]')).toHaveTextContent(
      "Offline setup failed",
    ),
  );
  document.querySelector('[role="status"]')?.remove();
  window.removeEventListener("load", listener);
});
test("development and unsupported browsers do not register", () => {
  const register = jest.fn();
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  });
  Object.assign(globalThis, { __MIRA_PRODUCTION__: false });
  registerPwa();
  expect(register).not.toHaveBeenCalled();
  Object.assign(globalThis, { __MIRA_PRODUCTION__: true });
  Reflect.deleteProperty(navigator, "serviceWorker");
  const listen = jest.spyOn(window, "addEventListener");
  registerPwa();
  expect(listen).not.toHaveBeenCalled();
});
