# Mira

A little wiser, every day. A local-first study app built with React, TypeScript, Vite, and Tailwind CSS. No account, backend, or external analytics.

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
- **Activity:** completed quiz history.
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
  features/reviewers/   Reviewer editor
  features/study/       Flashcards and quiz sessions
  hooks/                Local data state
  pages/                Home, Reviewers, Topics, Quizzes, Activity, Settings
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
node --test tests/study.test.mjs
```

PWA caching is enabled only in production. Serve the generated `dist` directory at the domain root over HTTPS (localhost also works). Open it online once, allow the service worker to install, then test offline. A new release becomes active after old app tabs are closed.

Before publishing, set `og:url` and a canonical URL in `index.html`, and change the social image metadata to the absolute URL of `/social-card.png` on your deployment. No domain is assumed in the source.

## License

MIT. See [LICENSE](LICENSE).


### Browser smoke test

With the production preview running, execute `node tests/browser-smoke.mjs`.
It uses an isolated headless Chrome profile and checks the main study flows,
backup imports, responsive layout, persistence, and offline reload. It defaults
to Chrome on Windows; set `CHROME_PATH` for another installation. Screenshots
are written to the temporary profile directory printed by the test.

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
