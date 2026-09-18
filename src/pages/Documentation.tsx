import { POLICY_VERSION } from "../features/consent/policy";
import type { Page } from "../types/study";
import { PageHeading } from "../components/ui";
import { Icon } from "../components/Icon";
import { RouteLink } from "../components/RouteLink";

import { documents } from "../config/documents";
import type { DocumentPage } from "../config/documents";

export function Documentation({ page }: { page: Page }) {
  if (!(page in documents))
    return (
      <>
        <PageHeading
          eyebrow="A SMALL DETOUR"
          title="This page is still a blank page."
          description="The address doesn’t match a Mira page."
        />
        <RouteLink page="Home" className="button primary">
          Back home <Icon name="arrow" size={16} />
        </RouteLink>
      </>
    );
  const document = documents[page as DocumentPage];
  return (
    <>
      <PageHeading
        eyebrow={document.eyebrow}
        title={document.title}
        description={document.intro}
      />
      {(page === "Privacy" || page === "Terms") && <p className="mb-6 text-xs text-stone-500">Policy version {POLICY_VERSION} · Optional services: <a className="underline" href="https://www.netlify.com/privacy/" target="_blank" rel="noreferrer">Netlify privacy</a> · <a className="underline" href="https://pollinations.ai" target="_blank" rel="noreferrer">Pollinations</a></p>}
      {page === "Contribute" && (
        <div className="mb-7 flex flex-wrap gap-3">
          <a
            className="button primary"
            href="https://github.com/RaileySawada/Mira"
            target="_blank"
            rel="noreferrer"
          >
            View repository
          </a>
          <a
            className="button secondary"
            href="https://github.com/RaileySawada/Mira/issues"
            target="_blank"
            rel="noreferrer"
          >
            Report an issue
          </a>
          <a
            className="button secondary"
            href="https://github.com/RaileySawada/Mira/blob/HEAD/CONTRIBUTING.md"
            target="_blank"
            rel="noreferrer"
          >
            Contribution guide
          </a>
        </div>
      )}
      <div className="grid gap-8 xl:grid-cols-[210px_1fr]">
        <nav className="documentation-tabs" aria-label="Documentation">
          {(["Docs", "Guide", "Contribute", "Privacy", "Terms", "About"] as const).map(
            (item) => (
              <RouteLink
                key={item}
                page={item}
                aria-current={page === item ? "page" : undefined}
                className={`nav-item ${page === item ? "active" : ""}`}
              >
                <Icon name={item} size={18} />
                {item === "Terms"
                  ? "Terms & conditions"
                  : item === "Guide"
                    ? "Study guide"
                    : item}
              </RouteLink>
            ),
          )}
        </nav>
        <article className="documentation-article panel max-w-3xl divide-y divide-stone-200 px-6 sm:px-9">
          {document.sections.map((section) => (
            <section className="py-7" key={section.title}>
              <h2 className="text-base font-semibold">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-500">
                {section.text}
              </p>
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
