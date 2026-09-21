export async function verifyAbuse(
  token: unknown,
  request: Request,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) return !process.env.CONTEXT || process.env.CONTEXT === "dev";
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(8000)]),
      },
    );
    if (!response.ok) return false;
    const result: unknown = await response.json();
    return (
      !!result &&
      typeof result === "object" &&
      "success" in result &&
      result.success === true &&
      "hostname" in result &&
      result.hostname === new URL(request.url).hostname &&
      "action" in result &&
      result.action === "mira-ai"
    );
  } catch {
    return false;
  }
}
