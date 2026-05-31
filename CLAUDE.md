# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `quasar dev` — start dev server (requires `@quasar/cli` installed globally)
- `quasar build` — production build (SPA mode)
- `quasar build -m pwa` — PWA build (used by Docker)
- `npm test` — run tests once (Vitest)
- `npm run test:watch` — run tests in watch mode
- `npm run lint` — ESLint on .js, .ts, .vue files
- `npm run format` — Prettier formatting on .js, .ts, .vue, .scss, .html, .md, .json

## Code Style

- 2-space indentation, LF line endings, UTF-8 (enforced by `.editorconfig`)
- Single quotes, semicolons (Prettier config in `.prettierrc`)
- ESLint uses `plugin:vue/vue3-essential` + `@typescript-eslint/recommended`; Prettier overrides ESLint formatting rules

## Architecture

- **Audio player** lives in `src/App.vue` and persists across all route navigation — do not move it to a page/layout
- **Backend API**: uses the `subsonic-api` npm package (Subsonic protocol); a common backend interface lives in `src/models/` to keep API calls decoupled
- **State**: Pinia stores in `src/stores/` for auth, settings, and song library
- **Server URL** and credentials are entered by the user in the UI at runtime — no `.env` file needed

## Workflow

- Trunk-based: commits go directly to `main`
- Docker image is built automatically by GitHub Actions on push to `main` and on version tags (`v*.*.*`); it builds in PWA mode and serves via nginx with hash routing
