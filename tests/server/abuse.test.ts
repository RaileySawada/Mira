import { verifyAbuse } from "../../netlify/lib/verifyAbuse";
const request = () => new Request("https://mira.test/.netlify/functions/ai");
afterEach(() => {
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.CONTEXT;
  jest.restoreAllMocks();
});
test("production fails closed when verification is not configured", async () => {
  process.env.CONTEXT = "production";
  expect(await verifyAbuse(undefined, request())).toBe(false);
});
test("validates token on server with exact hostname and action", async () => {
  process.env.TURNSTILE_SECRET_KEY = "private";
  const fetcher = jest.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({
      success: true,
      hostname: "mira.test",
      action: "mira-ai",
    }),
  );
  expect(await verifyAbuse("token", request())).toBe(true);
  expect(fetcher).toHaveBeenCalledWith(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    expect.objectContaining({ method: "POST" }),
  );
});
test.each([
  { success: false },
  { success: true, hostname: "evil.test", action: "mira-ai" },
  { success: true, hostname: "mira.test", action: "other" },
])("rejects invalid verification %j", async (result) => {
  process.env.TURNSTILE_SECRET_KEY = "private";
  jest.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(result));
  expect(await verifyAbuse("token", request())).toBe(false);
});
test("network failures and missing tokens fail gracefully", async () => {
  process.env.TURNSTILE_SECRET_KEY = "private";
  jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
  expect(await verifyAbuse("token", request())).toBe(false);
  expect(await verifyAbuse(undefined, request())).toBe(false);
});

test.each(["deploy-preview", "branch-deploy"])(
  "%s fails closed without a secret",
  async (context) => {
    process.env.CONTEXT = context;
    expect(await verifyAbuse("token", request())).toBe(false);
  },
);
test("verification HTTP errors and oversized tokens never authorize a request", async () => {
  process.env.TURNSTILE_SECRET_KEY = "private";
  const fetcher = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response("unavailable", { status: 503 }));
  expect(await verifyAbuse("token", request())).toBe(false);
  fetcher.mockClear();
  expect(await verifyAbuse("x".repeat(2049), request())).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
});
