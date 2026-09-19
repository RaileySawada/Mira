import { render, screen } from "@testing-library/react";
import { OnlineCount } from "../src/components/OnlineCount";
import { countConnections, startPresence } from "../src/services/presence";
import { goOffline, onDisconnect, onValue, set } from "firebase/database";
import { signInAnonymously } from "firebase/auth";

jest.mock("../src/lib/firebase", () => ({ presenceClients: () => ({ auth: { authStateReady: async () => {}, currentUser: null }, database: {} }) }));
jest.mock("firebase/auth", () => ({ signInAnonymously: jest.fn() }));
jest.mock("firebase/database", () => ({
  goOffline: jest.fn(), goOnline: jest.fn(),
  ref: jest.fn((_db, path) => path), push: jest.fn(path => path + "/tab"),
  onDisconnect: jest.fn(), onValue: jest.fn(), remove: jest.fn(async () => {}), set: jest.fn(async () => {}),
}));
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
type Snapshot = { val: () => unknown };
let listeners: Record<string, (snapshot: Snapshot) => void>;
let failRead: () => void;
let disconnectRemove: jest.Mock;
beforeEach(() => {
  listeners = {};
  disconnectRemove = jest.fn(async () => {});
  jest.mocked(signInAnonymously).mockResolvedValue({ user: { uid: "visitor" } } as Awaited<ReturnType<typeof signInAnonymously>>);
  jest.mocked(onDisconnect).mockReturnValue({ remove: disconnectRemove } as unknown as ReturnType<typeof onDisconnect>);
  jest.mocked(onValue).mockImplementation(((path: string, callback: (snapshot: Snapshot) => void, error: () => void) => {
    listeners[path] = callback;
    if (path === "presence") failRead = error;
    return jest.fn();
  }) as unknown as typeof onValue);
});
test("counts browsers once across tabs and ignores invalid connections", () => {
  expect(countConnections({ a: { one: true, two: true }, b: { one: true }, c: { one: false }, d: null, e: [] })).toBe(2);
  expect(countConnections(null)).toBe(0);
  expect(countConnections([])).toBe(0);
});
test("registers disconnect cleanup before writing and waits for count snapshot", async () => {
  const notify = jest.fn();
  const stop = startPresence(notify);
  await flush();
  listeners[".info/connected"]({ val: () => true });
  await flush();
  expect(disconnectRemove.mock.invocationCallOrder[0]).toBeLessThan(jest.mocked(set).mock.invocationCallOrder[0]!);
  expect(notify).not.toHaveBeenCalledWith(expect.objectContaining({ status: "online" }));
  listeners.presence({ val: () => ({ visitor: { tab: true } }) });
  expect(notify).toHaveBeenLastCalledWith({ status: "online", count: 1 });
  stop();
  expect(goOffline).toHaveBeenCalled();
});
test("permission failures cannot be overwritten by late connection events", async () => {
  const notify = jest.fn();
  const stop = startPresence(notify);
  await flush();
  failRead();
  listeners[".info/connected"]({ val: () => true });
  listeners.presence({ val: () => ({ visitor: { tab: true } }) });
  await flush();
  expect(notify).toHaveBeenLastCalledWith(expect.objectContaining({ status: "unavailable", count: null }));
  expect(set).not.toHaveBeenCalled();
  stop();
});
test("stopping before authentication resolves prevents registration", async () => {
  const stop = startPresence(jest.fn());
  stop();
  await flush();
  expect(onValue).not.toHaveBeenCalled();
});
test("authentication failures show an unavailable state", async () => {
  jest.mocked(signInAnonymously).mockRejectedValueOnce(new Error("disabled"));
  const notify = jest.fn();
  const stop = startPresence(notify);
  await flush();
  expect(notify).toHaveBeenLastCalledWith(expect.objectContaining({ status: "unavailable" }));
  stop();
});
test("indicator displays counts and errors and hides offline", () => {
  const { rerender } = render(<OnlineCount presence={{ status: "online", count: 3 }} />);
  expect(screen.getByText("3 online")).toBeInTheDocument();
  rerender(<OnlineCount presence={{ status: "unavailable", count: null }} />);
  expect(screen.getByText("Count unavailable")).toBeInTheDocument();
  rerender(<OnlineCount presence={{ status: "offline", count: null }} />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
