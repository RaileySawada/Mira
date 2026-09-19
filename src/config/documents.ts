export type DocumentPage = "Docs" | "Guide" | "Terms" | "Privacy" | "About" | "Contribute";
export const documents: Record<
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
      {"title":"First visit and policy acceptance","text":"Before entering the app, read the Terms and Privacy tabs and explicitly accept both. Mira records the policy version and acceptance time on this device. A missing, unreadable or outdated record shows the agreement again. The app and optional AI do not mount until acceptance; downloaded application files can still be cached. Acceptance is separate from JSON library backups."},
      {"title":"Mobile browsing and controls","text":"Use the left hamburger to open navigation. The header shows the original cat mark, while the sidebar adds the Mira name beside it. Topic filters open searchable menus within the visible screen, including above the on-screen keyboard. Folders have a compact searchable picker on mobile. Grid and list views are distinct, with compact divided rows in list mode. Pencil and trash buttons edit and delete; their accessible labels explain each action."},
      { title: "Library: reviewers, topics and folders", text: "A reviewer is a set of question-and-answer flashcards. Topics label what a reviewer teaches; folders group reviewers for a course, exam, or project. Create and rename folders on the Folders page. Move a reviewer using its folder selector or the reviewer editor. Deleting a folder moves its reviewers to Unfiled without deleting cards. Each reviewer has one topic and at most one folder. You can create topics directly while adding a reviewer." },
      { title: "Flashcards: keyboard, touch and self-ratings", text: "Open Study cards. Tap the card or press Space to flip it. Swipe left or press Left Arrow for I don’t know; swipe right or press Right Arrow for I know. The two buttons do the same thing. Previous and Next card let you navigate without rating. Rating the last card shows this session’s known and needs-practice totals. These self-ratings are temporary and do not count toward quiz accuracy or streaks. Mobile study and quiz sessions fill the screen, with scrolling for longer content." },
      { title: "Quizzes and daily review", text: "Written quizzes compare your answer to the saved definition, ignoring letter case and repeated whitespace. Synonyms are not automatically accepted. Check an answer, continue, then finish and save the result. An unfinished quiz is discarded after a leave confirmation. Reviewer quizzes include every card. Daily review mixes available cards across your library using its own question count and shuffle setting: 20 by default for new libraries, or five more than the old quiz limit for older backups (up to 100). You can change Daily review questions in Settings. Normal mode offers up to four distinct answers drawn from the saved study set. Hard mode uses written recall. Select the mode before checking the first answer. Sets with fewer than two distinct answers use Hard mode. Both modes work offline." },
      { title: "Achievements", text: "Open Achievements to see ten badges, their requirements and progress. Locked artwork is gray; earned badges are colored. A congratulation dialog shows newly earned badges after a successful save, grouping rewards earned together. Choose Keep learning to return. Existing rewards do not replay on reload or when importing their saved unlock records. Each badge matches its artwork: First Step (first completed session), Study Streak (three consecutive study days), Quiz Master (ten quizzes scoring at least 80%), Perfect Score (100% on a quiz), Bookworm (import a reviewer), Night Owl (complete a session between midnight and 5:59 a.m.), Focus Mode (finish and save the 25-minute timer), Fast Learner (a correct answer within ten seconds in a saved quiz), Helper (receive a Mira response), and Century Club (100 answered questions in saved quizzes). The timer pauses when the app is hidden. Flashcard completions count toward badge study days, but not quiz accuracy or the Home quiz streak. Earlier mismatched badges are recalculated from recorded evidence. Earned badge IDs persist with your library and are included in JSON backups. Deleting a reviewer does not remove a saved badge. A reset or replacement import replaces these records. Flashcard self-ratings do not count as completed quizzes." },
      { title: "Progress and activity", text: "Home starts with Mira’s contextual expression and your last opened reviewer with its folder. Mira types a finite series of greetings and messages about your library, current reviewer and folder, completed study sessions and badges. Messages advance automatically after a short reading pause, pause when the tab is hidden, and stop on the last message. Reduced motion shows complete text without typing and still advances automatically. Home also shows your reviewer count, completed quizzes, question activity and weighted quiz accuracy. Streaks count consecutive local-calendar days with completed quizzes, allowing yesterday as the latest day. Activity opens with a month calendar. Select a day for completed sessions, total questions, weighted accuracy and individual results. Indicators count completed quizzes and daily reviews: 1 slightly active, 2–4 active, 5+ super active. Dates use your device timezone. The searchable, sortable, paginated history remains below the calendar. Grid/list choices on Reviewers, Topics and Quizzes are remembered separately on this device." },
      { title: "Mira AI: questions and reviewer drafts", text: "Open Ask Mira in the lower-right corner when online. Ask a study question or request reviewer creation directly in chat. You can also use Create reviewers to choose one to five sets with five or ten cards each. Expand drafts to check questions and answers before saving. Generated content can be inaccurate; verify it against your course material. Online chat requests send your question, recent chat context and a study overview through Netlify to Pollinations. The overview includes your saved name, total library counts, up to 10 reviewer summaries, 15 topic names, 15 folder names, current reviewer, goals, activity statistics, earned achievements and five recent quiz results. Full flashcard contents are not included. The overview is built on submission, not uploaded in the background. On disconnect the assistant hides and requests stop; its open conversation returns when reconnected." },
      { title: "Voice input", text: "Supported browsers show a microphone beside the message input. Allow microphone access, speak, then press Stop. Recognition resumes after pauses until stopped. Provisional text may change while the browser confirms words. Review and edit the transcript before Send; recording never sends automatically. Speech uses your browser language and may use the browser’s online speech service. Permission errors or unsupported browsers do not prevent typing. Closing the assistant stops recording." },
      { title: "Install and offline availability", text: "When your browser offers installation, Mira shows a bottom prompt once per tab session. Choose Install Mira or Not now. On iPhone and iPad, follow the Share menu and Add to Home Screen instructions instead. Installed apps do not show this prompt. Allow the production app to finish loading online before studying offline. Your library, folders, quizzes, charts and settings work offline; AI and speech require connectivity. Installation availability is controlled by the browser. If the prompt is unavailable, check your browser’s install menu or the guide." },
      { title: "Storage, backups and session memory", text: "Mira has no login or automatic cloud synchronization. LocalStorage holds your library, folders, results and settings. Export JSON in Settings for a backup; import replaces this device’s library after confirmation and accepts older backups without folders. Maximum import size is 5 MB. Device-specific layout choices and temporary AI conversations are not part of a library export. Chat messages use sessionStorage for the current tab and are cleared when you close the assistant or start a new conversation. Unsent inputs and unsaved generated drafts remain in memory only. Keep backups before clearing browser data, and use one tab for edits." },
      { title: "Preferences, accessibility and troubleshooting", text: "Settings controls your name, daily goal, daily-review length, shuffle and daily-review shortcut. Light, dark and system themes save immediately. Other settings save with Save preferences. Reduced-motion preferences disable decorative transitions. Searchable selectors support arrow keys, Enter and Escape. If storage fails, Mira shows an error instead of claiming your work was saved. Export before clearing data. For bugs or suggestions, open Contribute to visit the repository and issue tracker." },
    ],
  },
  Guide: {
    eyebrow: "A GOOD PLACE TO START",
    title: "A little guidance goes a long way.",
    intro: "Everything you need to settle into your study space.",
    sections: [
      {"title":"08 · Start safely and keep a backup","text":"Read the terms and privacy policy on your first visit, then check both agreement boxes to continue. Optional AI is not needed for studying. Export a JSON backup regularly, especially before changing devices or clearing browser data. Consent is saved per browser and is requested again if it is missing or the policy version changes."},
      {
        title: "01 · Build your first reviewer",
        text: "Create a topic to organize your library, then choose New reviewer. You can also create a new topic directly in the reviewer form; it saves together with your reviewer. Add a title and question-and-answer cards. Use short, specific answers if you plan to take written quizzes. You can edit or delete reviewers any time.",
      },
      {
        title: "02 · Practice, then test yourself",
        text: "Study cards lets you flip by tapping or pressing Space. Drag left for needs practice or right for known, or use the arrow keys and rating buttons. Short drags settle back; a completed swipe brings the next card into the center. Reduced-motion settings simplify these transitions. Take quiz lets you choose Normal (multiple choice from saved answers) or Hard (written recall). Hard answers match saved definitions, ignoring case and extra spaces. Normal needs at least two distinct answers in the study set. Only completed quizzes are recorded; closing an unfinished test discards its answers.",
      },
      {
        title: "03 · Find your daily rhythm",
        text: "Daily review draws from all your reviewers. Choose your question count, daily goal, and shuffle preference in Settings. Enabling daily review puts the shortcut on Home. It works while you are using Mira, without background scheduling or notifications.",
      },
      {
        title: "04 · Read your progress",
        text: "Accuracy is the percentage of correct answers across completed quizzes. The graph counts questions answered each day. The Activity calendar lets you browse months and open a day’s summary. Its activity icons count completed quizzes, not time spent online or temporary flashcard ratings. A streak counts consecutive local-calendar days with completed quizzes and remains active when you last studied yesterday. Flashcard practice does not change these statistics.",
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
      {"title":"Agreement record and activity calendar","text":"Mira stores the accepted policy version and an ISO acceptance timestamp in localStorage, separately from your library. The calendar is calculated locally from saved quiz and daily-review results; it does not measure browsing time, microphone use or general device activity. Clearing browser site data removes the acceptance record. A library reset or import does not transfer another person’s acceptance."},
      {"title":"Voice and optional online services","text":"Microphone access is requested only when you choose voice input. Browser speech recognition may send audio to its own service. Mira uses the resulting text in your composer and does not send it to the AI until you submit it. Netlify processes the AI request and the configured Pollinations provider generates a response. Their policies govern their processing; Mira cannot delete provider-held records. Do not submit confidential material. Closing the assistant clears its local conversation, not records an external provider may retain."},
      {"title":"Questions and changes","text":"Use the repository issue tracker for general privacy questions without posting private data, recordings or backups. Hosting operators can have additional practices outside this source code. Check this policy when the app requests a new agreement. AI generation, voice and ordinary online requests remain subject to the services involved."},
      {
        title: "What stays on your device",
        text: "Your chosen name, topics, flashcards, last opened reviewer, earned badge IDs, completed flashcard-session dates, import/timer/AI guidance milestones, a fast-answer flag, completed quiz results and difficulty, and preferences are stored in this browser’s localStorage. Your saved library is not uploaded automatically, and no account is required. When you send an online AI chat, your submitted question, recent chat messages and saved study overview go to our Netlify function and then Pollinations. This overview includes your display name, library organization and counts, current reviewer, goals, activity, recent results and achievements. Lists are limited for performance; full flashcard contents are excluded. Reviewer generation sends submitted topics and notes. AI messages are kept in this tab’s sessionStorage until you close the assistant; generated reviewers are stored locally only when you save them. Provider and hosting policies apply to those requests.",
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
      {"title":"Acceptance and policy updates","text":"To use this version of Mira, review these terms and the privacy policy and affirm both using the agreement screen. If you do not agree, do not continue into the app. Acceptance is stored in this browser with the policy version and time; updated versions require a new agreement. This local record is not an account, signature verification or proof of identity."},
      {"title":"Optional AI and speech tools","text":"AI drafts and answers can be incomplete or incorrect. Review them before saving or relying on them. Submit only material you are permitted to share with the online provider. Speech recognition can make mistakes; check the transcript before sending. AI availability depends on connectivity and external providers and may be limited or interrupted. You can study entirely without these optional tools."},
      {"title":"Activity indicators","text":"Calendar activity labels summarize how many quizzes or daily reviews you completed on a local date. They are motivational descriptions, not judgments about effort, skill or wellbeing. Flashcard ratings are temporary and do not contribute to calendar totals, saved accuracy or streaks."},
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
      {"title":"Test real interaction paths","text":"Run build, lint, TypeScript checks and the relevant Jest suites before submitting a change. Run the browser suite for responsive or offline changes. Check first-visit acceptance, stored and outdated policy versions, storage failures, month/year boundaries, empty calendar days, weighted scores, reduced motion, touch cancellation, and rightward swipe overflow. Use mock AI responses and fictional study data."},
      {"title":"Keep docs and assets consistent","text":"Update the handbook, guide and policies when behavior or data handling changes. Bump the policy version for material Terms or Privacy changes. Preserve the original raster artwork when regenerating brand and PWA assets. Keep client keys out of the bundle and never include .env or real library exports in a contribution."},
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
      {"title":"A little progress, made visible","text":"Mira combines original cat artwork, touch-friendly flashcards, written quizzes, folders and a calendar of completed study sessions. Quiet daily indicators celebrate showing up; they do not measure your worth or promise an exam result. The project stays open for improvements from its community."},
      {
        title: "Developed with love for Mira, by Railey",
        text: "Your learning space should feel encouraging, not overwhelming. Mira brings reviewers, flashcards, quizzes, and progress together in a simple place that belongs to you.",
      },
      {
        title: "Local by design",
        text: "No account to create. Core study tools work without a study server; optional AI uses an online provider. Your library stays in your browser, with portable JSON backups and offline access after installation.",
      },
      {
        title: "Built to be made your own",
        text: "Mira uses React, TypeScript, Tailwind CSS, Vite, shadcn charts, Recharts, and Lucide icons. Its source is MIT licensed. The repository README explains the structure, development commands, and deployment setup; the LICENSE file contains the full license.",
      },
    ],
  },
};
