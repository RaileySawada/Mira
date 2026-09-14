# Contributing to Mira

Thanks for helping make this study space better. Contributions can include code, bug reports, documentation, accessibility improvements, and design feedback.

## Start a conversation

Use [GitHub Issues](https://github.com/RaileySawada/Mira/issues) to report a problem or propose a feature. For a substantial change, describe the problem and proposed approach before implementing it. Check existing issues first.

For bug reports, include steps to reproduce, expected and actual behavior, browser/device details, and screenshots when useful. Use sample study content; do not attach private backups.

## Run locally

Fork the repository, clone your fork, and create a branch for your change.

```sh
npm install
npm run dev
```

The app uses React, TypeScript, Vite, Tailwind CSS, and Lucide. Keep changes focused, follow the existing folders, and prefer readable code over abstractions. Add dependencies only when needed.

## Protect existing libraries

Study data lives in localStorage. Preserve backward compatibility when changing backup schemas. Test migrations with fictional data and keep imports validated. No login, backend, analytics, or external storage is required for the current app.

## Before opening a pull request

```sh
npm run build
npm run lint
npm run test:types
npm run test:coverage
```

For interactive changes, check desktop and mobile layouts, keyboard navigation, both themes, and relevant offline behavior. The Jest browser test starts its own production preview and requires Chrome:

```sh
npm run test:browser
```

Set CHROME_PATH if Chrome is installed outside the script's default Windows path.

## Submit your change

Open a pull request against the main repository. Explain the problem, what changed, and how you tested it. Include screenshots for UI changes and link related issues. Avoid unrelated formatting or generated build files.

Be considerate in reviews. Discuss the code, explain your reasoning, and make room for people who are learning.

## License

By submitting a contribution, you agree that it can be distributed under this repository's MIT License. Only contribute material you have permission to share.

