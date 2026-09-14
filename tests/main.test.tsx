import { createRoot } from "react-dom/client";
import { registerPwa } from "../src/services/pwa";
jest.mock("react-dom/client", () => ({
  createRoot: jest.fn(() => ({ render: jest.fn() })),
}));
jest.mock("../src/services/pwa", () => ({ registerPwa: jest.fn() }));
jest.mock("../src/app/App", () => ({ __esModule: true, default: () => null }));
test("entry point mounts React and starts offline registration", async () => {
  document.body.innerHTML = '<div id="root"></div>';
  await import("../src/main");
  expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
  expect(registerPwa).toHaveBeenCalled();
  expect(
    jest.mocked(createRoot).mock.results[0].value.render,
  ).toHaveBeenCalled();
});
