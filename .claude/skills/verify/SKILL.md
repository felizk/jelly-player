---
name: verify
description: Validate changes end-to-end by running lint and a full PWA build. Use before committing to catch type errors, lint violations, and build failures.
---

Run these steps in order and report any failures clearly:

1. Run `npm run lint` — report any ESLint errors or warnings
2. Run `quasar build -m pwa` — report any TypeScript or build errors

If both pass, confirm that the code is clean and the build succeeded. If either fails, show the relevant error output and suggest fixes.
