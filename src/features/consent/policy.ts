import { POLICY_VERSION } from "../../config/policy";
import { CONSENT_KEY } from "../../config/storage";


export function hasPolicyConsent(): boolean {
  try {
    const record: unknown = JSON.parse(
      localStorage.getItem(CONSENT_KEY) ?? "null",
    );
    return (
      typeof record === "object" &&
      record !== null &&
      "version" in record &&
      record.version === POLICY_VERSION &&
      "acceptedAt" in record &&
      typeof record.acceptedAt === "string" &&
      Number.isFinite(Date.parse(record.acceptedAt))
    );
  } catch {
    return false;
  }
}
