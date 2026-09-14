import type { Page } from "../types/study";
import { PageHeading } from "../components/ui";
import { Icon } from "../components/Icon";
import { RouteLink } from "../components/RouteLink";

type DocumentPage = "Guide" | "Terms" | "Privacy" | "About" | "Contribute";
const documents: Record<
  DocumentPage,
  {
    eyebrow: string;
    title: string;
    intro: string;
    sections: { title: string; text: string }[];
  }
> = {
  Guide: {
    eyebrow: "A GOOD PLACE TO START",
    title: "A little guidance goes a long way.",
    intro: "Everything you need to settle into your study space.",
    sections: [
      {
        title: "01 · Build your first reviewer",
        text: "Create a topic to organize your library, then choose New reviewer. You can also create a new topic directly in the reviewer form; it saves together with your reviewer. Add a title and question-and-answer cards. Use short, specific answers if you plan to take written quizzes. You can edit or delete reviewers any time.",
      },
      {
        title: "02 · Practice, then test yourself",
        text: "Study cards lets you flip between questions and answers at your own pace. Take quiz checks written answers against your saved definitions, ignoring letter case and extra spaces. Other wording must match. Only completed quizzes are recorded; closing an unfinished test discards its answers.",
      },
      {
        title: "03 · Find your daily rhythm",
        text: "Daily review draws from all your reviewers. Choose your question count, daily goal, and shuffle preference in Settings. Enabling daily review puts the shortcut on Home. It works while you are using Mira, without background scheduling or notifications.",
      },
      {
        title: "04 · Read your progress",
        text: "Accuracy is the percentage of correct answers across completed quizzes. The graph counts questions answered each day. A streak counts consecutive local-calendar days with completed quizzes and remains active when you last studied yesterday. Flashcard practice does not change these statistics.",
      },
      {
        title: "05 · Back up and move devices",
        text: "In Settings, export a JSON backup containing your topics, reviewers, results, and preferences. Transfer it to your new device and import it there. Import replaces that device’s library after confirmation. Invalid files are rejected. Maximum import size is 5 MB.",
      },
      {
        title: "06 · Install and study offline",
        text: "Use your browser’s Install app or Add to Home Screen option. On iPhone, use Safari’s Share menu. Open the production app online once and allow offline setup to finish before disconnecting. Saved reviewers, quizzes, settings, and charts work offline; AI requires an internet connection and its controls are hidden offline. If offline setup reports an error, reconnect and reload. After an app update, close old Mira tabs and reopen.",
      },
      {
        title: "07 · If something feels off",
        text: "Check your browser’s storage permissions if changes cannot be saved. Export a backup before freeing space or clearing site data. Use one tab for editing to avoid competing saves. Mira has no account recovery or cloud copy of your library.",
      },
    ],
  },
  Privacy: {
    eyebrow: "YOUR KNOWLEDGE, YOUR CONTROL",
    title: "Privacy, in plain language.",
    intro: "How this version of Mira handles your study data.",
    sections: [
      {
        title: "What stays on your device",
        text: "Your chosen name, topics, flashcards, completed quiz results, and preferences are stored in this browser’s localStorage. Your saved library is not uploaded automatically, and no account is required. Optional AI requests send only the topic, notes, or question you explicitly submit to our Netlify function and then Pollinations. AI replies stay in memory until you close the assistant; generated reviewers are stored locally only when you save them. Provider and hosting policies apply to those requests.",
      },
      {
        title: "Storage and offline files",
        text: "Mira uses localStorage for your library and a service worker cache for offline application files. This version does not include advertising, third-party analytics, or tracking cookies. Your hosting provider may process ordinary web requests and access logs; its policies are separate.",
      },
      {
        title: "Backups are yours to manage",
        text: "Export creates an unencrypted JSON file on your device. Import reads the file locally. Anyone you share a backup with can read its contents, so choose what you include and where you keep it.",
      },
      {
        title: "Deleting and retaining data",
        text: "Data remains in this browser until you clear it or the browser removes it. Clear all local data in Settings resets your study library and preferences. Browser site-data controls also remove offline caches. Downloaded backups remain wherever you saved them and must be deleted separately.",
      },
      {
        title: "Shared devices",
        text: "There is no login or application lock. Someone with access to the same browser profile can access your library. Use your device’s own access controls and avoid storing sensitive personal information in study cards.",
      },
    ],
  },
  Terms: {
    eyebrow: "A SHARED UNDERSTANDING",
    title: "Terms & conditions.",
    intro: "The basics of using this local-first, open-source study app.",
    sections: [
      {
        title: "Using Mira",
        text: "Mira is a personal study tool for creating reviewers and practicing recall. Use it lawfully and respect other people’s privacy and intellectual property. Only add or share material that you have permission to use.",
      },
      {
        title: "Your content and responsibility",
        text: "You retain your rights to the content you create. You are responsible for its accuracy, the backups you keep, and any material you choose to share. Mira does not publish your library or keep a recovery copy.",
      },
      {
        title: "Learning results",
        text: "Quiz scores reflect matching answers to your saved cards. They are not a certification of knowledge or a guarantee of exam performance. Check your study material against your course sources and correct errors when you find them.",
      },
      {
        title: "Availability and data",
        text: "Browser storage and offline features depend on your device and browser. Keep regular exports, especially before clearing browser data or changing devices. Unfinished quizzes are not saved.",
      },
      {
        title: "Open-source software",
        text: "Mira’s source code is released under the MIT License. You may use, copy, modify, and distribute it subject to that license, including retaining its copyright and permission notice. Third-party dependencies retain their respective licenses.",
      },
      {
        title: "No warranty",
        text: "The software is provided as is, without warranty, under the MIT License. The license contains the applicable warranty disclaimer and limitation of liability. These terms do not change rights that cannot be excluded under applicable law.",
      },
    ],
  },
  Contribute: {
    eyebrow: "LET’S MAKE IT BETTER, TOGETHER",
    title: "A little help makes a big difference.",
    intro:
      "Mira is open source. There’s room here for your ideas, care, and curiosity.",
    sections: [
      {
        title: "Everyone has something to offer",
        text: "You can contribute code, report bugs, improve documentation, test accessibility, or suggest a more thoughtful study experience. You don’t need to be an experienced developer to help.",
      },
      {
        title: "Start with a conversation",
        text: "Check existing GitHub issues before reporting a bug or proposing a feature. Describe the problem, include steps to reproduce it, and use fictional study content in examples. Never share private backups.",
      },
      {
        title: "Make a focused change",
        text: "Fork the repository, create a branch, and follow the contribution guide. Keep the current React and TypeScript structure, protect existing local data, and test your changes on desktop and mobile.",
      },
      {
        title: "Share your work",
        text: "Open a pull request with a short explanation, relevant screenshots, and your test results. Contributions are shared under Mira’s MIT License. Be kind in reviews and leave space for others to learn.",
      },
    ],
  },
  About: {
    eyebrow: "MADE WITH A LITTLE CARE",
    title: "A quieter kind of study app.",
    intro:
      "Mira makes room for curiosity, one card and one small win at a time.",
    sections: [
      {
        title: "Developed with love for Mira, by Railey",
        text: "Your learning space should feel encouraging, not overwhelming. Mira brings reviewers, flashcards, quizzes, and progress together in a simple place that belongs to you.",
      },
      {
        title: "Local by design",
        text: "No account to create and no study server to depend on. Your library stays in your browser, with portable JSON backups and offline access after installation.",
      },
      {
        title: "Built to be made your own",
        text: "Mira uses React, TypeScript, Tailwind CSS, Vite, shadcn charts, Recharts, and Lucide icons. Its source is MIT licensed. The repository README explains the structure, development commands, and deployment setup; the LICENSE file contains the full license.",
      },
    ],
  },
};
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
          {(["Guide", "Contribute", "Privacy", "Terms", "About"] as const).map(
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
        <article className="panel max-w-3xl divide-y divide-stone-200 px-6 sm:px-9">
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
