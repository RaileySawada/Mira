import type { Page } from "../types/study";
import { PageHeading } from "../components/ui";
import { Icon } from "../components/Icon";
import { RouteLink } from "../components/RouteLink";

type DocumentPage = "Docs" | "Guide" | "Terms" | "Privacy" | "About" | "Contribute";
const documents: Record<
  DocumentPage,
  {
    eyebrow: string;
    title: string;
    intro: string;
    sections: { title: string; text: string }[];
  }
> = {
  Docs: {
    eyebrow: "THE MIRA HANDBOOK",
    title: "Everything you can do with Mira.",
    intro: "A practical reference for your library, study sessions, privacy, and offline use.",
    sections: [
      { title: "Library: reviewers, topics and folders", text: "A reviewer is a set of question-and-answer flashcards. Topics label what a reviewer teaches; folders group reviewers for a course, exam, or project. Create and rename folders on the Folders page. Move a reviewer using its folder selector or the reviewer editor. Deleting a folder moves its reviewers to Unfiled without deleting cards. Each reviewer has one topic and at most one folder. You can create topics directly while adding a reviewer." },
      { title: "Flashcards: keyboard, touch and self-ratings", text: "Open Study cards. Tap the card or press Space to flip it. Swipe left or press Left Arrow for I don’t know; swipe right or press Right Arrow for I know. The two buttons do the same thing. Previous and Next card let you navigate without rating. Rating the last card shows this session’s known and needs-practice totals. These self-ratings are temporary and do not count toward quiz accuracy or streaks. Mobile study and quiz sessions fill the screen, with scrolling for longer content." },
      { title: "Quizzes and daily review", text: "Written quizzes compare your answer to the saved definition, ignoring letter case and repeated whitespace. Synonyms are not automatically accepted. Check an answer, continue, then finish and save the result. An unfinished quiz is discarded after a leave confirmation. Daily review mixes available cards across your library using the question count and shuffle settings. Multiple-choice quizzes are not available yet; all current quiz grading works offline." },
      { title: "Progress and activity", text: "Home shows your reviewer count, completed quizzes, question activity and weighted quiz accuracy. Streaks count consecutive local-calendar days with completed quizzes, allowing yesterday as the latest day. Activity lists saved results with search, column sorting and pagination. Grid/list choices on Reviewers, Topics and Quizzes are remembered separately on this device." },
      { title: "Mira AI: questions and reviewer drafts", text: "Open Ask Mira in the lower-right corner when online. Ask a study question or request reviewer creation directly in chat. You can also use Create reviewers to choose one to five sets with five or ten cards each. Expand drafts to check questions and answers before saving. Generated content can be inaccurate; verify it against your course material. Only submitted questions, notes, topics and recent chat context go through the Netlify function to Pollinations. Your complete saved library is not sent automatically. On disconnect the assistant hides and requests stop; its open conversation returns when reconnected." },
      { title: "Voice input", text: "Supported browsers show a microphone beside the message input. Allow microphone access, speak, then press Stop. Recognition resumes after pauses until stopped. Provisional text may change while the browser confirms words. Review and edit the transcript before Send; recording never sends automatically. Speech uses your browser language and may use the browser’s online speech service. Permission errors or unsupported browsers do not prevent typing. Closing the assistant stops recording." },
      { title: "Install and offline availability", text: "When your browser offers installation, Mira shows a bottom prompt once per tab session. Choose Install Mira or Not now. On iPhone and iPad, follow the Share menu and Add to Home Screen instructions instead. Installed apps do not show this prompt. Allow the production app to finish loading online before studying offline. Your library, folders, quizzes, charts and settings work offline; AI and speech require connectivity. Installation availability is controlled by the browser. If the prompt is unavailable, check your browser’s install menu or the guide." },
      { title: "Storage, backups and session memory", text: "Mira has no login or automatic cloud synchronization. LocalStorage holds your library, folders, results and settings. Export JSON in Settings for a backup; import replaces this device’s library after confirmation and accepts older backups without folders. Maximum import size is 5 MB. Device-specific layout choices and temporary AI conversations are not part of a library export. Chat messages use sessionStorage for the current tab and are cleared when you close the assistant or start a new conversation. Unsent inputs and unsaved generated drafts remain in memory only. Keep backups before clearing browser data, and use one tab for edits." },
      { title: "Preferences, accessibility and troubleshooting", text: "Settings controls your name, daily goal, quiz length, shuffle and daily-review shortcut. Light, dark and system themes save immediately. Other settings save with Save preferences. Reduced-motion preferences disable decorative transitions. Searchable selectors support arrow keys, Enter and Escape. If storage fails, Mira shows an error instead of claiming your work was saved. Export before clearing data. For bugs or suggestions, open Contribute to visit the repository and issue tracker." },
    ],
  },
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
        text: "Your chosen name, topics, flashcards, completed quiz results, and preferences are stored in this browser’s localStorage. Your saved library is not uploaded automatically, and no account is required. Optional AI requests send only the topic, notes, or question you explicitly submit and recent chat messages for follow-up context to our Netlify function and then Pollinations. AI messages are kept in this tab’s sessionStorage until you close the assistant; generated reviewers are stored locally only when you save them. Provider and hosting policies apply to those requests.",
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
