import { requestAi } from "../../src/services/ai";
const input = {
  mode: "chat" as const,
  prompt: "Explain cells",
  topic: "",
  count: 1,
};
function response(
  body: unknown,
  status = 200,
  type: string | null = "application/json",
): Response {
  return {
    ok: status === 200,
    status,
    headers: { get: () => type },
    json: async () => body,
  } as unknown as Response;
}
afterEach(() => {
  jest.restoreAllMocks();
});
test("sends only explicitly submitted data and keeps replies out of caches", async () => {
  const fetchMock = jest.fn().mockResolvedValue(response({ answer: "Hello" }));
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    writable: true,
    value: fetchMock,
  });
  const signal = new AbortController().signal;
  expect(await requestAi(input, signal)).toEqual({ answer: "Hello" });
  expect(fetchMock).toHaveBeenCalledWith(
    "/.netlify/functions/ai",
    expect.objectContaining({
      body: JSON.stringify(input),
      signal,
      cache: "no-store",
    }),
  );
});
test("does not make requests offline", async () => {
  jest.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  const fetchMock = jest.fn();
  globalThis.fetch = fetchMock;
  await expect(requestAi(input, new AbortController().signal)).rejects.toThrow(
    "offline",
  );
  expect(fetchMock).not.toHaveBeenCalled();
});
test.each([
  [503, { error: "Not configured" }, "application/json", "Not configured"],
  [500, {}, "application/json", "unavailable"],
  [500, null, "application/json", "unavailable"],
  [200, null, "text/html", "Netlify"],
  [429, null, null, "Too many requests"],
])(
  "handles HTTP %s and unexpected content",
  async (status, body, type, expected) => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        response(body, status as number, type as string | null),
      );
    await expect(
      requestAi(input, new AbortController().signal),
    ).rejects.toThrow(expected as string);
  },
);
