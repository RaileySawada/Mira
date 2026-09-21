import { useState } from "react";
import { documents } from "../../config/documents";
import { CONSENT_KEY } from "../../config/storage";
import { POLICY_VERSION } from "../../config/policy";


export function PolicyConsent({ onAccept }: { onAccept: () => void }) {
  const [page, setPage] = useState<"Terms" | "Privacy">(() =>
    location.pathname === "/privacy" ? "Privacy" : "Terms",
  );
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState("");
  const document = documents[page];
  return (
    <main className="consent-page">
      <div className="consent-card panel">
        <img
          src="/brand/mark.png"
          className="brand-image"
          alt="Mira"
          width={52}
          height={52}
        />
        <p className="eyebrow mt-5">BEFORE YOUR FIRST CHAPTER</p>
        <h1>Welcome to Mira.</h1>
        <p className="consent-intro">
          Please review our terms and privacy policy before using your study
          space. Your library stays on this device; optional AI sends only what
          you submit and recent conversation context.
        </p>
        <div className="consent-tabs" aria-label="Policies">
          {(["Terms", "Privacy"] as const).map((item) => (
            <button
              key={item}
              aria-pressed={page === item}
              onClick={() => setPage(item)}
            >
              {item === "Terms" ? "Terms & conditions" : "Privacy policy"}
            </button>
          ))}
        </div>
        <article
          className="consent-document"
          key={page}
          tabIndex={0}
          aria-label={
            page === "Terms" ? "Terms & conditions" : "Privacy policy"
          }
        >
          <p className="text-xs text-stone-500">
            Policy version {POLICY_VERSION}
          </p>
          {document.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </section>
          ))}
        </article>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!terms || !privacy) return;
            try {
              localStorage.setItem(
                CONSENT_KEY,
                JSON.stringify({
                  version: POLICY_VERSION,
                  acceptedAt: new Date().toISOString(),
                }),
              );
              onAccept();
            } catch {
              setError(
                "Your agreement could not be saved. Please allow browser storage and try again.",
              );
            }
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={terms}
              onChange={(event) => setTerms(event.target.checked)}
            />
            I agree to the terms & conditions.
          </label>
          <label>
            <input
              type="checkbox"
              checked={privacy}
              onChange={(event) => setPrivacy(event.target.checked)}
            />
            I have read and agree to the privacy policy.
          </label>
          {error && <p role="alert">{error}</p>}
          <button
            type="submit"
            className="button primary"
            disabled={!terms || !privacy}
          >
            Agree & continue
          </button>
          <p className="consent-note">
            If you do not agree, you can leave this page. AI and microphone use
            remain optional. Acceptance is saved only in this browser and is not
            included in library backups.
          </p>
        </form>
      </div>
    </main>
  );
}
