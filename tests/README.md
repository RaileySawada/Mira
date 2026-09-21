# Tests

- `unit/`: data validation, scheduling, storage, parsing and service logic.
- `ui/`: React components, hooks and user interactions (Jest + Testing Library).
- `server/`: Netlify AI endpoint and abuse-protection tests.
- `browser/`: production-build browser flows, mobile layouts and offline checks.
- `support/`: shared fixtures, Jest setup, transforms and asset mocks.

Run `npm test`, `npm run test:types`, `npm run test:coverage`, and `npm run test:browser` from the repository root. Coverage thresholds are unchanged. Generated coverage lives in `coverage/`; temporary local logs belong in `artifacts/validation/`. Neither is committed.
