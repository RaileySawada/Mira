export const POLICY_VERSION = "2026-09-18";
export const CONSENT_KEY = "mira.policy-consent";
export function hasPolicyConsent(): boolean {
  try {
    const record: unknown = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null");
    return typeof record === "object" && record !== null && "version" in record && record.version === POLICY_VERSION && "acceptedAt" in record && typeof record.acceptedAt === "string" && Number.isFinite(Date.parse(record.acceptedAt));
  } catch { return false; }
}
