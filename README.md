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

## Data and scoring

Study data is stored under `mira.study.v1` in localStorage. Export a backup before clearing browser storage or changing devices. Imports replace existing data after validation and confirmation. Backups are limited to 5 MB. Use one browser tab for editing to avoid competing saves.

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
for app paths. public/_redirects includes this fallback for compatible hosts;
configure an equivalent SPA rewrite on other hosting services.

In-app documentation is available at /guide, /privacy, /terms, and /about.


## Topics and branding

Version-2 backups use topics. Version-1 subjects and reviewer associations migrate automatically, while the existing localStorage key stays unchanged. Create a topic inside the reviewer editor; it saves together with the reviewer, and existing topic names are reused.

The mobile header opens a keyboard-accessible navigation drawer. The cropped transparent `public/brand/mark.png` powers navigation, with text beside it in the sidebar; the original `public/logo.png` remains the source artwork. Separate files in `public/icons/` serve the favicon and install icons; `public/social_card.png` is the sharing preview. Typography uses locally bundled Nunito as a close match to the rounded social-card lettering, including offline. Its SIL Open Font License is included in `src/assets/fonts/OFL-Nunito.txt`.

## Contributing

Contributions are welcome: bug reports, documentation, accessibility, design, and code. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. The app also includes a /contribute page with links to this repository and its issues.

## Testing with Jest

All automated tests run through Jest. React Testing Library exercises the UI using accessible labels and user interactions.

| Command | Purpose |
| --- | --- |
| `npm test` | Run application logic, hooks, components, pages, and server tests |
| `npm run test:server` | Run Netlify function tests |
| `npm run test:watch` | Rerun affected tests while developing |
| `npm run test:types` | Type-check the TypeScript tests |
| `npm run test:coverage` | Enforce coverage and write an HTML report to coverage/lcov-report/index.html |
| `npm run test:browser` | Build, start an isolated preview, and run the Chrome test through Jest |
| `npm run test:all` | Run type checks, coverage, and production browser checks |

The suite covers storage validation and migrations, failures and recovery, statistics, navigation, theme changes, scroll locking, every page and reusable component, reviewer/topic editing, quizzes, JSON import/export, and PWA registration. Coverage includes all runtime files under src; type-only interfaces are excluded. Required application coverage is 100% functions and lines, 99% statements, and 95% branches. Netlify functions have a separate Node Jest suite requiring 100% coverage. AI tests use mock responses and do not spend provider credits.

Jest uses Babel only for test compilation and a small adapter for Vite's import.meta.env.PROD flag. The separate TypeScript check validates types; production still builds with Vite.

The browser suite needs Chrome. Set CHROME_PATH if it is not at the default Windows installation path. It starts its own preview on port 4179 and uses an isolated browser profile. Screenshots go to the temporary directory printed by the test. Browser checks verify real layout, keyboard/focus behavior, theme transitions, and offline reload; jsdom tests do not claim to verify browser rendering or service-worker caching.

## Online study assistant (Netlify)

Mira's core library, quizzes, settings, and charts work locally. The optional assistant uses a Netlify Function and Pollinations; nothing is sent until the user submits a question or generation request. Generate 1–5 reviewers with 5 or 10 cards each, inspect the preview, then save the batch with its topic. You can also ask in chat, for example: "Create two biology reviewers with ten cards each." Mira can call a validated draft-generation tool; nothing is saved until you choose Save all reviewers. Existing topic names are reused. AI may be inaccurate; check material against course sources.

Set `POLLINATIONS_SK` in Netlify's environment variables with Functions scope, then redeploy. Optional server variables are `POLLINATIONS_BASE_URL` (default https://gen.pollinations.ai/v1) and `POLLINATIONS_MODEL` (default openai). Never prefix the secret with VITE_. Local .env files are not deployed. Configure a spending limit on the provider key; the endpoint is anonymous and has a Netlify limit of 10 requests per IP/domain per minute. Origin checks are not authentication.

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

| Asset | Use |
| --- | --- |
| `public/brand/logo.png` | Original transparent cat and wordmark; black in light mode, white in dark mode |
| `public/brand/mark.png` | Original cat artwork without the wordmark |
| `public/icons/favicon-64.png`, `favicon-32.png` | Rounded browser tab icons |
| `public/icons/apple-touch-icon.png` | 180 × 180 Apple home-screen icon |
| `public/icons/pwa-192.png`, `pwa-512.png` | Standard PWA icons |
| `public/icons/pwa-maskable-512.png` | Full-background icon with a padded mark for launcher masks |
| `public/social_card.png` | Social sharing preview |

Raster assets are derived directly from `public/logo.png` by `scripts/generate-brand-assets.mjs`. Run `node scripts/generate-brand-assets.mjs` to regenerate the committed assets using the installed Sharp tooling. Runtime branding needs no image-processing library or network request. The service worker precaches the app branding and install icons.

### First visit, policies and activity calendar

Before entering Mira, users review the Terms and Privacy tabs and explicitly accept both. `mira.policy-consent` stores the policy version and acceptance timestamp in localStorage, independently of library exports. Missing, malformed or outdated records show the gate again. Failed storage keeps the gate open with an error. AI and installation prompts mount only after acceptance. Shared document content lives in `src/config/documents.ts`; update `POLICY_VERSION` in `src/features/consent/policy.ts` when policies materially change. This is a local acknowledgment, not authentication.

Activity starts with a month calendar using local device dates. One completed quiz/daily review is slightly active, two to four is active, and five or more is super active. Selecting a date opens completed sessions, question totals, weighted accuracy and individual scores. Empty days and adjacent-month dates are selectable. The searchable, sortable history remains below the calendar. Temporary flashcard self-ratings and time online are not activity events.

Cards follow horizontal drags, settle back on short/cancelled gestures, and hand off to a subtle centered reveal after rating. Reduced motion skips these animations. The card viewport clips transforms to prevent page overflow while allowing long text to scroll. Edit and delete actions use labeled pencil/trash buttons.
