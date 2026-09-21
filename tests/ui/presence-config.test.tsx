import { renderHook } from "@testing-library/react";
import { usePresence } from "../../src/hooks/usePresence";
import { useOnline } from "../../src/hooks/useOnline";
jest.mock("../../src/config/firebase", () => ({ presenceConfigured: false }));
jest.mock("../../src/hooks/useOnline", () => ({ useOnline: jest.fn(() => true) }));
test("missing production configuration is visible instead of silently hidden", () => {
  const { result } = renderHook(() => usePresence(true));
  expect(result.current.status).toBe("unavailable");
  expect(result.current.message).toContain("Netlify");
});
test("presence stays hidden before consent", () => {
  const { result } = renderHook(() => usePresence(false));
  expect(result.current.status).toBe("disabled");
});
test("presence stays hidden offline even without configuration", () => {
  jest.mocked(useOnline).mockReturnValueOnce(false);
  const { result } = renderHook(() => usePresence(true));
  expect(result.current.status).toBe("offline");
});
