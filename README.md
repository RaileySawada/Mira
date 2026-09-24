<div align="center">

  <img src="./public/logo.png" width="82" alt="Mira logo" />

  <h1>Mira</h1>

  <p>A little wiser, every day.</p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white" alt="Netlify" />
  </p>

</div>

Mira is a local-first study app with no account or external analytics. Core studying works offline; optional AI assistance uses a Netlify function.

## Getting started

```sh
npm install
npm run dev
```

## Features

- **Home:** seven-day activity graph, accuracy donut, current streak, and daily goal.
- **Reviewers:** create, edit, search, filter, and delete reviewers with question-and-answer flashcards.
- **Topics:** organize reviewers with named, color-coded topics.
- **Study:** flip flashcards or take scored written-answer quizzes.
- **Quizzes:** daily practice across your library and quizzes for individual reviewers.
- **Activity:** monthly calendar, activity indicators, daily summaries and searchable quiz history.
- **Settings:** name, daily goal, quiz length, shuffle, daily review, JSON import/export, and local data reset.
- **PWA:** installable with a production service worker that caches the app for offline use.

## Mira default

Mira uses one server-configured model for chat, reviewer creation, and library actions: `POLLINATIONS_MODEL`, falling back to `openai`. There is no model picker, and previously saved model preferences are ignored. Provider credentials remain on the server.

## Organize with Mira

Mira has one conversation interface, with no mode selector or separate creation form. Imported notes become an editable chat draft and are never sent automatically. When online, ask Mira to create study sets in a named folder and topic, or organize existing reviewers. For example: “Create biology flashcards in my Finals folder,” “Move Cell biology to Semester 2,” or “Copy Cell biology into Revision.” Mira can also create folders/topics, rename reviewers and change their topic.

Generated cards and library changes appear as previews. Choose **Save all reviewers** or **Apply changes** to store them locally. Missing destination folders/topics are created; ambiguous reviewer names require a source folder or exact title. Moves preserve card IDs and study history; copies get new IDs. No library deletion is available through AI. Saved study tools continue to work offline.

## Data and scoring

Study data is stored in the `mira-study` IndexedDB database. The old `mira.study.v1` localStorage record is retained as a migration recovery copy. Export a backup before clearing browser storage or changing devices. Imports replace existing data after validation and confirmation. Backups are limited to 5 MB. Use one browser tab for editing to avoid competing saves.

Accuracy is correct answers divided by all answered questions in completed quizzes, not a scientific measure of knowledge. Written answers ignore letter case and extra whitespace; other wording must match. Keep definitions short for written quizzes. Flashcard practice does not change scores or streaks.

A streak counts consecutive local-calendar days with completed quizzes, including a streak ending yesterday. Daily review is offered when the app is open; it does not run tests or notifications in the background. Unfinished quizzes are not saved.

## Project structure

```text
src/
  app/                  Application shell and navigation
  components/           Shared UI and icons
  features/ai/          Online tutor and batch generation
  features/reviewers/   Reviewer editor
  features/study/       Flashcards and quiz sessions
  hooks/                Local data state
  pages/                Home, Reviewers, Topics, Folders, Quizzes, Activity, Settings, Documentation
  services/             Persistence, backup validation, PWA registration
  types/                Shared data interfaces
  utils/                Statistics and question preparation
  assets/styles/        Tailwind and shared visual styles
```

## Validate and preview

```sh
npm run lint
npm run build
npm run preview
npm test
```

PWA caching is enabled only in production. Serve the generated `dist` directory at the domain root over HTTPS (localhost also works). Open it online once, allow the service worker to install, then test offline. A new release becomes active after old app tabs are closed.

Before publishing, set `og:url` and a canonical URL in `index.html`, and change the social image metadata to the absolute URL of `/social_card.png` on your deployment. No domain is assumed in the source.

## License

MIT. See [LICENSE](LICENSE).

## Appearance, navigation, and documentation

Settings includes Light, Dark, and System appearance. The choice is stored with
study preferences and included in JSON backups. Older backups default to System.
Appearance is applied before the first paint; System follows live device changes.
Theme buttons use a circular clip-path reveal with the View Transitions API.
Reduced-motion preferences and browsers without that API switch immediately.
Icons use Lucide React.

Pages use clean paths such as /reviewers and /settings. Navigation, including
browser Back and Forward, resets the page to the top. Old hash bookmarks are
converted to the corresponding clean paths. Production hosts must serve index.html
for app paths. public/\_redirects includes this fallback for compatible hosts;
configure an equivalent SPA rewrite on other hosting services.

In-app documentation is available at /guide, /privacy, /terms, and /about.

## Topics and branding

Version-2 backups use topics. Version-1 subjects and reviewer associations migrate automatically, with the original localStorage record retained for recovery. Create a topic inside the reviewer editor; it saves together with the reviewer, and existing topic names are reused.

The mobile header opens a keyboard-accessible navigation drawer. The cropped transparent `public/brand/mark.png` powers navigation, with text beside it in the sidebar; the original `public/logo.png` remains the source artwork. Separate files in `public/icons/` serve the favicon and install icons; `public/social_card.png` is the sharing preview. Typography uses locally bundled Nunito as a close match to the rounded social-card lettering, including offline. Its SIL Open Font License is included in `src/assets/fonts/OFL-Nunito.txt`.

## Contributing

Contributions are welcome: bug reports, documentation, accessibility, design, and code. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. The app also includes a /contribute page with links to this repository and its issues.

## Testing with Jest

All automated tests run through Jest. React Testing Library exercises the UI using accessible labels and user interactions.

| Command                 | Purpose                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| `npm test`              | Run application logic, hooks, components, pages, and server tests            |
| `npm run test:server`   | Run Netlify function tests                                                   |
| `npm run test:watch`    | Rerun affected tests while developing                                        |
| `npm run test:types`    | Type-check the TypeScript tests                                              |
| `npm run test:coverage` | Enforce coverage and write an HTML report to coverage/lcov-report/index.html |
| `npm run test:browser`  | Build, start an isolated preview, and run the Chrome test through Jest       |
| `npm run test:all`      | Run type checks, coverage, and production browser checks                     |

The suite covers storage validation and migrations, failures and recovery, statistics, navigation, theme changes, scroll locking, every page and reusable component, reviewer/topic editing, quizzes, JSON import/export, and PWA registration. Coverage includes all runtime files under src; type-only interfaces are excluded. Required application coverage is 100% functions and lines, 99% statements, and 95% branches. Netlify functions have a separate Node Jest suite requiring 100% coverage. AI tests use mock responses and do not spend provider credits.

Jest uses Babel only for test compilation and a small adapter for Vite's import.meta.env.PROD flag. The separate TypeScript check validates types; production still builds with Vite.

The browser suite needs Chrome. Set CHROME_PATH if it is not at the default Windows installation path. It starts its own preview on port 4179 and uses an isolated browser profile. Screenshots go to the temporary directory printed by the test. Browser checks verify real layout, keyboard/focus behavior, theme transitions, and offline reload; jsdom tests do not claim to verify browser rendering or service-worker caching.

## Online study assistant (Netlify)

Mira's core library, quizzes, settings, and charts work locally. The optional assistant uses a Netlify Function and Pollinations; nothing is sent until the user submits a question or generation request. Generate 1–5 reviewers with 5 or 10 cards each, inspect the preview, then save the batch with its topic. You can also ask in chat, for example: "Create two biology reviewers with ten cards each." Mira can call a validated draft-generation tool; nothing is saved until you choose Save all reviewers. Existing topic names are reused. AI may be inaccurate; check material against course sources.

Set `POLLINATIONS_SK` in Netlify's environment variables with Functions scope, then redeploy. Optional server variables are `POLLINATIONS_BASE_URL` (default https://gen.pollinations.ai/v1) and `POLLINATIONS_MODEL` (default openai). Never prefix the secret with VITE\_. Local .env files are not deployed. Configure a spending limit on the provider key; the endpoint is anonymous and has a Netlify limit of 10 requests per IP/domain per minute. Origin checks are not authentication.

The included netlify.toml builds dist and deploys netlify/functions. A manual upload of dist alone does not deploy functions: use a Git-connected Netlify build or the Netlify CLI. For local AI development, use `npm run dev:netlify`; plain Vite remains sufficient for offline/local study development.

AI requests are bounded and cancellable, are never cached, and disappear from the UI when offline. A browser may report online while the connection is unusable; requests then show an error or time out. Saved data remains available. AI responses depend on network/provider speed; core studying never waits for the AI server.

The chart and assistant code load in separate chunks. The production service worker precaches all emitted chunks so charts work offline even if not previously visited. Open the production app online and allow setup to finish before disconnecting. Close older tabs after updates. Netlify serves hashed assets with immutable caching and revalidates the service worker.

Implementation references: [shadcn charts](https://ui.shadcn.com/docs/components/radix/chart), [Netlify Functions](https://docs.netlify.com/build/functions/api/), [Pollinations API](https://github.com/pollinations/pollinations/tree/main/gen.pollinations.ai).

## Local AI development

Run `npm run dev:netlify` and open http://localhost:8888. Netlify Dev starts Vite on port 5174 and runs the serverless AI function through port 8888. Keep `POLLINATIONS_SK` in your local `.env` (never commit it). Plain `npm run dev` starts only Vite and does not serve AI functions.

The floating assistant uses the supplied Mira and user avatars. Questions appear as a conversation, with the latest six messages (up to 1,800 characters each) included for follow-up context. Chat is kept in this tab’s sessionStorage while the assistant remains open and is cleared when it closes or a new conversation starts. On disconnect the assistant hides and requests stop; the open conversation returns after reconnecting. Only submitted chat text and recent conversation context are sent to Pollinations; saved reviewers are not uploaded.

The CLI uses `--offline` to avoid requiring a linked Netlify account for local configuration. This does not block your function from reaching Pollinations: AI still requires internet access. The development-only Sharp override selects the patched image-processing release.

### Voice input

In supported browsers, tap the microphone beside the chat input and allow microphone access. Stop recording, edit the transcript, then press Send. Recording never submits a message automatically. Recognition uses the browser language and may send audio to the browser’s speech service; Mira sends only the submitted text to Pollinations. The microphone is hidden when unsupported, and AI is hidden offline. Closing the assistant stops recording. See [browser speech recognition support](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

## Study controls, folders, and installation

- Flashcards: tap or Space to flip; Left Arrow/swipe left marks “I don’t know”; Right Arrow/swipe right marks “I know”. Session self-ratings do not change quiz accuracy or streaks.
- Mobile flashcards and written quizzes use the full viewport height. Multiple choice is deferred; quizzes still use written answers offline.
- Folders organize reviewers independently of topics. Create, rename, assign, move, and delete folders from the Folders page. Deleting a folder preserves reviewers in Unfiled. Folder data is included in JSON backups; older backups remain supported.
- A bottom install prompt appears once per tab session when native installation is offered. iPhone/iPad receive manual Add to Home Screen instructions. Installed standalone apps do not show the prompt. Browser policy determines native installation availability.
- Visit Docs at /docs for the complete in-app handbook, including data storage, AI, voice, offline behavior, and troubleshooting.

### Branding assets

| Asset                                           | Use                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `public/brand/logo.png`                         | Original transparent cat and wordmark; black in light mode, white in dark mode |
| `public/brand/mark.png`                         | Original cat artwork without the wordmark                                      |
| `public/icons/favicon-64.png`, `favicon-32.png` | Rounded browser tab icons                                                      |
| `public/icons/apple-touch-icon.png`             | 180 × 180 Apple home-screen icon                                               |
| `public/icons/pwa-192.png`, `pwa-512.png`       | Standard PWA icons                                                             |
| `public/icons/pwa-maskable-512.png`             | Full-background icon with a padded mark for launcher masks                     |
| `public/social_card.png`                        | Social sharing preview                                                         |

Raster assets are derived directly from `public/logo.png` by `scripts/generate-brand-assets.mjs`. Run `node scripts/generate-brand-assets.mjs` to regenerate the committed assets using the installed Sharp tooling. Runtime branding needs no image-processing library or network request. The service worker precaches the app branding and install icons.

### First visit, policies and activity calendar

Before entering Mira, users review the Terms and Privacy tabs and explicitly accept both. `mira.policy-consent` stores the policy version and acceptance timestamp in localStorage, independently of library exports. Missing, malformed or outdated records show the gate again. Failed storage keeps the gate open with an error. AI and installation prompts mount only after acceptance. Shared document content lives in `src/config/documents.ts`; update `POLICY_VERSION` in `src/features/consent/policy.ts` when policies materially change. This is a local acknowledgment, not authentication.

Activity starts with a month calendar using local device dates. One completed quiz/daily review is slightly active, two to four is active, and five or more is super active. Selecting a date opens completed sessions, question totals, weighted accuracy and individual scores. Empty days and adjacent-month dates are selectable. The searchable, sortable history remains below the calendar. Temporary flashcard self-ratings and time online are not activity events.

Cards follow horizontal drags, settle back on short/cancelled gestures, and hand off to a subtle centered reveal after rating. Reduced motion skips these animations. The card viewport clips transforms to prevent page overflow while allowing long text to scroll. Edit and delete actions use labeled pencil/trash buttons.

### Study dashboard and rewards

Home shows the last opened reviewer and its folder before charts, with five Mira expressions and ten messages per expression. Normal quizzes use up to four distinct saved definitions as offline answer choices; Hard quizzes use written recall. A set needs two distinct definitions for Normal mode. Achievements tracks ten milestones and preserves earned badge IDs in IndexedDB and JSON exports. Optimized WebP expressions and badges are precached for offline use; original PNG artwork stays in `public/emoticons` and `public/new-rewards`.

Badge missions now match the text in all ten original images. Quiz Master counts scores of 80% or above; Fast Learner requires a correct response within 10 seconds in a saved quiz; Night Owl uses midnight–5:59 a.m. local time. The Achievements page includes a 25-minute focus timer (pauses when hidden; save after completion). Bookworm records a successful reviewer import, and Helper records a successful AI guidance response. Legacy mismatched badge IDs are recalculated from available evidence.

Newly earned badges appear in a grouped congratulation dialog after progress saves. Chat rewards appear after Mira finishes replying. Existing saved unlocks are not replayed on reload. Reward artwork is generated from `public/new-rewards` with `node scripts/generate-study-art.mjs` and precached offline.

Home greetings now type through a finite, personalized sequence about the library, study desk, sessions and badges. Messages advance automatically and stop at the last message; hidden tabs pause, and reduced motion skips typing while retaining automatic advancement. Reviewer quizzes always include every card. Daily review has a separate 1–100 question preference: new libraries default to 20; older preferences receive five extra questions, capped at 100 and available cards.

Online AI chat includes a bounded study overview: saved name, complete library counts, ten reviewer summaries, fifteen topic/folder names, current reviewer, goals, activity, five recent quiz results and earned badges. It is built only when sending a chat; nothing is uploaded in the background or while offline. Full flashcard text is excluded, and Mira is instructed to acknowledge the overview’s limits.

### Firebase live presence

Create a Firebase Realtime Database and enable **Authentication → Sign-in method → Anonymous**. Set `FIREBASE_DATABASE_URL` to its exact console URL, then publish `database.rules.json` using the Firebase Console rules editor or `firebase deploy --only database --project YOUR_PROJECT_ID`. Restart Netlify Dev after environment changes; add the same variables in Netlify and rebuild for production. Existing `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, and `FIREBASE_APP_ID` are supported, along with `VITE_FIREBASE_*` aliases. Only this explicit web-config allowlist is bundled; Pollinations secrets stay server-side.

The sidebar and mobile header show connected anonymous browser identities, not verified people. Tabs using the same Firebase identity count once. Presence stores only anonymous IDs and per-connection booleans, with server disconnect cleanup; no name or study records are sent to Firebase. The live count hides offline and reports errors without displaying a fabricated count. Firebase loads lazily after policy acceptance. Disconnect counts can take a short time to settle after a sudden network loss.

## Mira v3 Adaptive Learning

### Adaptive learning and mastery

Mira derives New, Learning, Needs review and Mastered states from saved card ratings and quiz results. Three consecutive correct reviews can mark a card Mastered until it becomes due. A missed or due card needs review. Home shows due cards, cards to revisit, recently improved cards and topic/folder/reviewer insights. Self-ratings contribute to learning signals, never quiz accuracy. Mira’s five expressions respond supportively to recent scores, changes, goals, streaks, inactivity, weak cards and new achievements; they are not judgments of ability.

### Spaced repetition and daily review

Mira v3 uses a deterministic lightweight scheduler, not FSRS. Correct reviews schedule a card in 1 day, then 3 days, then double the interval up to 180 days. A missed answer resets repetitions and schedules a retry in 10 minutes. Daily review prioritizes overdue cards, cards needing review, frequent misses, long-unreviewed cards and new cards. Recently reviewed cards move behind new material; mastered cards fill remaining slots only when needed. The selected set can be shuffled, and its size remains configurable. All scheduling works offline.

### Question history, answer alternatives and streaks

Completed quizzes retain each question and expected-answer snapshot, your answer, correctness and response duration alongside the existing totals. Open Activity calendar day details to inspect them. Reviewer editing offers optional accepted alternative answers. Written grading normalizes Unicode, case, whitespace and harmless punctuation; meaningful math symbols remain distinct. Streaks count local-calendar days with a completed quiz, daily review or flashcard practice session. Opening a reviewer alone never counts. The same rule is used by Home, badges, Activity and Mira’s overview.

### Unfinished quizzes and Voice Study Mode

Unfinished quizzes save snapshots, ordering, mode, submitted answers and draft text locally. On return, choose Continue unfinished quiz or Discard; Mira never resumes automatically. Drafts are removed after successful completion or explicit discard. In Hard mode, Start voice study reads the question when speech synthesis is available. Pause, Stop and Repeat control playback; Speak answer uses the existing microphone service. Stop the microphone, edit the transcript and explicitly check the answer. Unsupported browsers and offline recognition fall back to typing; core study never requires speech services.

### v3 storage, migration and backups

Growing study data is stored in a version-3 IndexedDB database with separate stores for reviewers, cards, attempts, question results, schedules and quiz drafts. Small preferences may remain in localStorage. Existing v1/v2 libraries migrate automatically and are read back for verification. The original localStorage backup is retained for recovery and is not the live library after migration. JSON exports remain portable and v1/v2 imports remain supported. Unknown fields are discarded and invalid data is rejected before saving. Keep regular exported backups: clearing browser/site data removes local study records.

### Local document imports and optional AI context

Import notes accepts TXT, Markdown and CSV locally. CSV supports question/answer columns, quoted commas and multiline fields. Preview, edit and remove text before opening the reviewer editor. Text selections for one card are limited to 5,000 characters; CSV supports up to 1,000 rows and files up to 1 MB. PDF extraction is not included; export a PDF as text first. Generate with Mira requires an explicit consent checkbox and only pre-fills the selected text; submit separately to send up to 3,000 characters to Pollinations. Use current reviewer as context is OFF by default. When enabled for chat, only up to 30 cards from the current reviewer are shared, with a 12,000-character content budget. Omitted cards are disclosed. Reviewer text is untrusted data, never system instructions.

### Anonymous AI verification

Online AI requests may require Cloudflare Turnstile verification. The server verifies single-use tokens, hostname and action before contacting Pollinations; rate limits, payload limits, timeouts and origin checks remain in place. Origin checks are not authentication. No account is required and Mira does not persist verification tokens or add a tracking identifier. Cloudflare processes verification information under its own policies. Failed verification affects AI only; saved reviewers, quizzes and offline studying remain available.

### Turnstile deployment

Configure `VITE_TURNSTILE_SITE_KEY` for the frontend build and `TURNSTILE_SECRET_KEY` as a server-only Netlify secret. Configure the widget for your deployment hostname. Production AI fails closed when the secret is absent; local development without keys keeps existing AI testing available. Never prefix the secret with `VITE_`. Redeploy after changes. Verification tokens are not stored.

### Validation and CI

`.github/workflows/ci.yml` runs npm ci, lint, type checks, coverage, server tests, production build and Chrome browser tests for pushes and pull requests. Coverage thresholds are unchanged. `fake-indexeddb` is a test-only dependency for migration and storage regressions.

### Navigation and chat workspace

Mira has a dedicated `/mira` workspace alongside the floating assistant. Enter sends a message; Shift+Enter inserts a line break. Both share the same online-only AI flow. The theme-aware line logo and ambient background respect reduced-motion preferences. Settings and documentation live in the sidebar’s More menu; presence is shown only in the header. Unknown routes show a 404 indicator. See `tests/README.md` for the test layout; generated local reports belong in ignored `artifacts/validation/`.

### Shared definitions

- `src/types/study.ts`: persisted library data; `session.ts`: quiz sessions and drafts.
- `src/types/ai.ts`: AI request, conversation, reviewer-context and overview contracts.
- `src/types/learning.ts`: mastery, mood and study-card types; `ui.ts`: shared control types.
- `src/types/presence.ts`: online presence state and Firebase configuration shape.
- `src/config/`: routes, storage keys, policy version, learning thresholds and general time constants.
- `src/config/firebase.ts` reads public build configuration; `src/lib/firebase.ts` initializes Firebase SDK clients. These files have different responsibilities.

Features own their behavior. Private component props, vendor-adapter types, implementation constants and feature content stay beside the code that uses them. Shared types do not import feature implementations. Storage key values and study thresholds remain unchanged by this organization.

## Releases and installed PWA updates

The browser app and installed PWA share the version in package.json. The footer displays the running version; /version.json identifies the deployed version and build fingerprint. Database schema and consent-policy versions are independent.

- Fix release: npm run version:patch
- Compatible feature release: npm run version:minor
- Breaking release: npm run version:major

These commands update package.json and package-lock.json without creating a commit or tag. Run npm run lint and npm run test:all before publishing. Commit both version files with your release changes and optionally tag that commit with the matching version.

Each production build creates an offline cache named mira-VERSION-BUILD. Changed assets or service-worker code receive a fresh fingerprint. The manifest identity stays stable so users keep the same installed app. Updates download online and wait until all Mira tabs and installed windows close before activation; reopen Mira to use the update. Active study sessions are not force-reloaded, and the local study database is preserved.

If Netlify completes building, function bundling, and secret scanning but its deploy API returns HTTP 500, retry the failed deploy from its dashboard. If it repeats, send Netlify support the deploy ID and full log. That error alone does not mean dist is missing.
