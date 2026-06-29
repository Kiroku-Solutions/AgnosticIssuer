# quill\.md

> **A markdown-based, local-first issue tracker that travels with your repository.**

[![Tests](https://img.shields.io/badge/tests-1025_passing-2ea44f)](./docs/current-project-status.md)
[![Advisories](https://img.shields.io/badge/pnpm_audit-0_advisories-2ea44f)](./docs/current-project-status.md)
[![WCAG](https://img.shields.io/badge/WCAG-2.1_AA-2ea44f)](#security-and-privacy)
[![Stack](https://img.shields.io/badge/SvelteKit-2_+_Svelte_5-ff3e00)](./docs/ers.md)
[![Backend](https://img.shields.io/badge/backend-none-blueviolet)](#architecture)

[What it is in 30 seconds](#in-30-seconds) · [Operating modes](#operating-modes) · [Features](#features) · [Architecture](#architecture) · [Tech stack](#tech-stack) · [Security & privacy](#security-and-privacy) · [Quickstart](#getting-started) · [Roadmap](#roadmap) · [FAQ](#faq) · [ERS](./docs/ers.md) · [Build log](./docs/current-project-status.md)

---

## TL;DR

quill\.md is a free, open-source **client-side-only** web app for managing project issues that live **inside your Git repository as plain Markdown files**. There is no server, no database, no third-party SaaS, no telemetry. You author issues through a Svelte-powered editor, browse them through List / Kanban / Gantt panels, and version-control them with your normal Git workflow.

- **Two operating modes.** Full local CRUD in Chromium (via the File System Access API) + read-only remote browsing in any modern browser (via `isomorphic-git` partial clone).
- **Schema lives in your repo.** `.quill.md/config.json` and `.quill.md/templates/*.json` are per-project.
- **Zero attack surface.** No backend, no analytics, content-hashed, CSP / SRI / Trusted Types hardened.
- **Accessibility-first.** WCAG 2.1 AA across every surface, full keyboard navigation, screen-reader friendly.
- **1025 tests passing, 0 advisories, pnpm audit clean.**

---

## The problem

Modern issue trackers — GitHub Issues, Jira, Linear, Notion — are great collaboration tools, but they have a few sharp edges for solo developers and small teams:

- **Your data lives on someone else's server.** Outages, pricing changes, or sudden sunsetting can lock you out.
- **Issues aren't reviewable.** The canonical artifact in software is the diff, but issues live outside the repo and outside code review.
- **The schema is global.** Every project looks the same.
- **Offline and privacy are afterthoughts.**

quill\.md inverts that: issues are **plain Markdown files in your repo**, the schema is **per-project**, the app is a **static SPA** you can host on any static host (or skip hosting and run it locally).

---

## In 30 seconds

```text
your-repo/
├── .quill.md/
│   ├── config.json            ← statuses, labels, kanban columns, gantt settings
│   ├── templates/
│   │   ├── epic.json
│   │   ├── user-story.json
│   │   ├── task.json
│   │   └── bug.json
│   └── issues/
│       ├── 0042-fix-login-redirect.md
│       └── 0043-launch-public-beta.md
└── ... your code
```

Each issue is one Markdown file with:

- a **YAML frontmatter** — `id`, `title`, `type`, `status`, `assignee`, `labels`, `relations`, `start/end_date`, custom fields from your template
- one or more **named Markdown sections** delimited by `<!-- [SECTION_START: name] -->` markers (Description, Steps to reproduce, etc.)
- an **`integrity_hash`** — a SHA-256 of the file's own contents, written automatically on save and verified on load

You write issues in a purpose-built editor. You read them in three views. You commit them with `git commit` like any other file.

### Example issue

```markdown
---
id: 42
title: 'Fix login redirect'
author: 'jane'
creation_date: 2026-10-20
updated_date: 2026-10-21
issue_type: bug
status: in_progress
assignee: 'jane'
labels: [security, frontend]
relations:
  - { type: blocks, id: 45 }
  - { type: relates_to, id: 7 }
start_date: 2026-10-20
duration: 3
severity: high
priority: p1
integrity_hash: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
---

<!-- [SECTION_START: Description] -->

# Login form

After submitting valid credentials, the user is redirected to a
404 page instead of the dashboard.

<!-- [SECTION_END: Description] -->

<!-- [SECTION_START: Steps to reproduce] -->

1. Navigate to `/login`.
2. Enter valid credentials.
3. Click "Sign in".
4. Observe the URL.

<!-- [SECTION_END: Steps to reproduce] -->
```

---

## Operating modes

### Local Edit Mode _(Chromium-based browsers only)_

You click **"Open local folder"** and pick a directory. The app gets read-write access to your repo through the [File System Access API][fsa], reads the issue files, and gives you full CRUD:

- **Create, edit, delete, reorder** issues (Kanban drag for status changes)
- **Edit templates and project config** through a settings panel
- **Switch folders** on the fly; up to 5 recent folders persisted across sessions
- **Atomic writes** (temp file + rename) so a failed save never leaves a partial file on disk
- **Works offline** once the page is loaded

The folder handle is held by the browser; you commit your changes through your own Git workflow.

### Remote Read-Only Mode _(any modern browser)_

You point the app at a public or private Git repo URL. It uses [isomorphic-git][iso-git] to perform a **partial clone** of just the `.quill.md/` subtree — no other code is downloaded — and renders the issues through the same three views, but **read-only**:

- Kanban drag-and-drop is rendered but inert (visual only)
- The editor opens in preview mode only
- "New issue", "Save", and "Delete" are hidden

The cache lives in IndexedDB. A **Refresh** command re-fetches deltas. PATs are passed through `onAuth` and dropped the moment the fetch returns.

[fsa]: https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
[iso-git]: https://isomorphic-git.org

---

## Features

### Issues and authoring

- **Schema-driven editor.** Every template defines its own fields and sections; the form renders automatically.
- **Rich field types.** `text`, `longtext` (Markdown), `date`, `number`, `select`, `multi-select`, `user`, `relations`.
- **Markdown sections** with syntax highlighting (via `shiki`), rendered through `marked` + `DOMPurify` and styled with Tailwind Typography.
- **Cross-issue relations.** `parent` / `child` / `blocks` / `depends_on` / `relates_to`. Cycles are detected and refused at save time.
- **Custom fields per template.** An `epic` can have `business_value`; a `bug` has `severity` and `priority`. The form respects the active template.
- **Tamper detection.** Every file carries an `integrity_hash` field. If you hand-edit it in `vim` or VS Code and reload the app, you get a non-blocking banner: _"this file was modified outside quill\.md"_. The next save clears it; no work is lost.

### Views

- **List view** — virtualized table, sortable by every column (id, title, type, status, assignee, labels, updated_date).
- **Kanban view** — columns derived from `config.statuses`, color-coded. Drag a card to change its status (Local Mode only). Full keyboard parity (mouse, touch, arrow keys, Enter/Space).
- **Gantt view** — horizontal timeline grouped by `issue_type`, with dependency arrows drawn for `blocks` / `depends_on` relations. Textual fallback (a `<table>`) is always reachable for assistive tech.

All three views share a **filter bar** that combines `issue_type`, `status`, `assignee`, `labels`, free-text search, and `creation_date` / `updated_date` ranges. The active filter set is serialized to the URL so it's shareable and restorable on reload.

### Project workflow

- **Per-project schemas.** `.quill.md/templates/*.json` and `.quill.md/config.json` define statuses, labels, users, kanban columns, Gantt grouping, and the CORS proxy URL.
- **Built-in template bundle.** `Epic`, `User Story`, `Task`, `Bug` ship in the binary; pick what you want in the first-run wizard.
- **Author-your-own template editor.** Create custom types from scratch in the app (the wizard's "Create your own" path).
- **Trash, not delete.** Deleted issues move to `.quill.md/.trash/<timestamp>-<id>-<slug>.md`; an "Empty trash" command is one click away.
- **First-run wizard.** When you open a folder without a `.quill.md/`, the app offers a guided setup with the four built-in templates plus an option to author your own.

### Theme, accessibility, i18n

- **Light / dark / system** — toggle in the top bar, OS preference respected via `matchMedia` and re-resolved on every OS theme change.
- **WCAG 2.1 AA** — every surface audited with `axe-core`, full keyboard navigation, ARIA labels on every interactive control, color is never the only signal.
- **i18n-ready.** Every user-facing string lives in a single translation map (`src/lib/ui/strings.ts`). A custom lint rule (`scripts/check-i18n.mjs`) **fails the build** if a literal English string lands in a `.svelte` file outside the map.

---

## Architecture

Four layers, strictly separated. Swapping the filesystem or Git library is confined to the adapter layer.

```text
┌────────────────────────────────────────────────────────────┐
│  UI Layer   Svelte 5 components, Tailwind, lucide-svelte   │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│  State Layer   Svelte 5 runes + factories                  │
│  modeStore · configStore · templatesStore · issuesStore ·  │
│  filterStore · viewStore · themeStore · editorStore ·      │
│  uiStore                                                    │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│  Service Layer   pure logic, no I/O                        │
│  ParserService · ValidatorService · IssueService ·         │
│  TemplateService · ConfigService · IntegrityService ·      │
│  SlugService · WizardService                               │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│  Adapter Layer   the only layer that touches the world     │
│  LocalFsAdapter     (File System Access API)               │
│  RemoteGitAdapter   (isomorphic-git + LightningFS)         │
│  RendererAdapter    (marked + DOMPurify, Trusted Types)    │
└────────────────────────────────────────────────────────────┘
```

**Why four layers?** The Adapter layer is the **seam** between quill\.md and the browser's storage / network primitives. The Service layer is **pure** — it takes and returns domain objects, never touches the DOM, the network, or the filesystem — and is therefore fully unit-testable in plain Node. The State layer is the **single source of truth** for the UI; the UI is a pure function of it.

---

## Tech stack

| Concern            | Choice                                 | Why                                                                         |
| ------------------ | -------------------------------------- | --------------------------------------------------------------------------- |
| Framework          | **SvelteKit 2** + **Svelte 5** (runes) | Reactive without runtime overhead; ships as static SPA via `adapter-static` |
| Language           | TypeScript 6 strict                    | Catches entire categories of bugs at compile time                           |
| Styling            | **Tailwind CSS 4** (CSS-first config)  | No JS config file; tokens in `src/routes/layout.css`                        |
| Components         | **daisyUI 5** + custom design tokens   | Battle-tested primitives, brand surface on top                              |
| Icons              | **lucide-svelte**                      | Tree-shakeable SVG icons                                                    |
| Local filesystem   | **File System Access API**             | Native browser API; the only way to do real local CRUD in a browser         |
| Remote Git         | **isomorphic-git** + LightningFS       | The only mature Git impl that runs in a browser                             |
| Markdown rendering | **marked** + **DOMPurify**             | Fast + sanitized; registered as a Trusted Types sink                        |
| Integrity hash     | **Web Crypto API**                     | Native SHA-256; no third-party hashing library                              |
| Drag-and-drop      | **svelte-dnd-action**                  | Full keyboard parity for the Kanban                                         |
| Testing            | **Vitest 4** + **Playwright**          | 3 projects: `client` (Chromium), `server` (Node), `renderer` (jsdom)        |
| Build              | **Vite 8**                             | The SvelteKit default; static output via `@sveltejs/adapter-static`         |
| Package manager    | **pnpm**                               | Lockfile-only; `pnpm.overrides` for CVE pinning                             |

### Why this stack and not another?

- **SvelteKit + Svelte 5 + `adapter-static`** gives us a real SPA without the cost of a runtime like React. The bundle is small, hydration is instant, and the runes model makes store + reactivity ergonomic.
- **Tailwind 4 with CSS-first config** means we don't ship a JS config; tokens live alongside the CSS that consumes them.
- **isomorphic-git** is the only Git library that runs reliably in the browser. We use its partial-clone + tree-walk to fetch **only** the `.quill.md/` subtree of a remote repo — never the full history.
- **Vitest with a 3-project split** (`client` / `server` / `renderer`) lets us run Node-only tests without Chromium, while still supporting browser-API-dependent tests under real headless Chrome.
- **pnpm overrides** for `js-yaml` and `cookie` close two real CVEs without waiting for upstream.

---

## Security and privacy

This is a first-class concern, not an afterthought. See [`docs/current-project-status.md`](./docs/current-project-status.md) §"Security audit" for the full scorecard.

- **No backend, no analytics, no telemetry.** Zero requests leave your device except to the Git provider endpoint and the configured CORS proxy (Remote Mode only). The browser is the entire runtime.
- **Content Security Policy** with `require-trusted-types-for 'script'` and a `trusted-types quill-md dompurify default` policy name.
- **Subresource Integrity** — every modulepreload and module script stamped with `integrity="sha384-…"` by `scripts/add-sri.mjs` at build time.
- **COOP / COEP / CORP** headers in `static/_headers` for cross-origin isolation.
- **HSTS** with `preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` denying all sensors.
- **PATs never touch storage.** The Personal Access Token for Remote Mode is passed through `isomorphic-git`'s `onAuth` callback and dropped the moment the fetch returns. It never enters a Svelte `$state(...)` rune, never sees `localStorage`, never appears in a URL.
- **Branded types + runtime redactor** for PAT-shaped strings (GitHub classic 40-hex, GitHub fine-grained `ghp_*`, GitLab `glpat-*`).
- **`pnpm.overrides`** pins `js-yaml@^4.2.0` and `cookie@^0.7.0` to close CVE-2026-53550 and CVE-2024-47764.
- **Self-checked deployable.** `scripts/check-csp.mjs` scans the build output for `eval(`, `Function(`, `document.write(`; `pnpm audit` is part of the verification chain.

| Layer                                |  Score  |
| ------------------------------------ | :-----: |
| PAT handling (branded + redactor)    |  5 / 5  |
| Markdown sanitization (XSS)          |  5 / 5  |
| File integrity (SHA-256)             |  5 / 5  |
| Atomic writes                        |  5 / 5  |
| FSA permission model                 |  5 / 5  |
| Service validation (cycles, dangles) | 4.5 / 5 |
| Privacy / telemetry                  |  5 / 5  |
| Transport-layer headers (CSP/HSTS)   |  5 / 5  |
| Subresource Integrity                |  5 / 5  |
| Supply-chain (CVEs)                  |  5 / 5  |

---

## Browser support

| Browser            | Local Edit Mode | Remote Read-Only Mode |
| ------------------ | --------------- | --------------------- |
| Chrome (latest 2)  | ✅ Supported    | ✅ Supported          |
| Edge (latest 2)    | ✅ Supported    | ✅ Supported          |
| Firefox (latest 2) | ❌ No FSA       | ✅ Supported          |
| Safari (latest 2)  | ❌ No FSA       | ✅ Supported          |
| Mobile browsers    | ❌ Not in v1    | ❌ Not in v1          |

The hard dependency is the **File System Access API**, which is currently Chromium-only. Remote Read-Only Mode works in any modern browser because it goes through `fetch` and IndexedDB.

---

## Getting started

### From source

```sh
git clone https://github.com/<you>/quill-md
cd quill-md
pnpm install
pnpm dev          # http://localhost:5173
```

### Verify before you ship

```sh
pnpm check        # svelte-kit sync + svelte-check (0 errors, 0 warnings)
pnpm lint         # Prettier + ESLint + i18n guard + CSP guard
pnpm test         # 1025 tests across 51 files
pnpm build        # produces static bundle in ./build
pnpm audit        # 0 advisories
```

### First run in Local Mode

1. Open `http://localhost:5173`.
2. Click **"Open local folder"** and pick a folder inside a Git repo.
3. If the folder doesn't have a `.quill.md/` yet, run the wizard — pick from built-in templates or author your own.
4. Edit, save, commit with `git add . && git commit -m "..."`.
5. Push from your own Git workflow.

### First run in Remote Mode

1. Open the app.
2. Click **"Browse remote repository"**.
3. Enter the URL, branch, and a Personal Access Token (if the repo is private).
4. Pick a CORS proxy if the default (`https://cors.isomorphic-git.org`) doesn't work for your provider.

### Deploying

The output of `pnpm build` is a fully static bundle in `./build/`. Drop it on GitHub Pages, Netlify, Cloudflare Pages, S3, or any static host. There is no server runtime to provision.

The `static/_headers` file ships the full set of security headers (CSP, HSTS, COOP, COEP, CORP, Referrer-Policy, Permissions-Policy). GitHub Pages users: the `<meta http-equiv>` fallbacks in `src/app.html` cover the residual gaps; HSTS is the one header GitHub Pages won't honor and is documented in the audit.

---

## Project structure

```text
src/
├── lib/
│   ├── adapters/      ← talks to the world (FSA, isomorphic-git, marked)
│   ├── services/      ← pure logic (parse, validate, serialize, slugs)
│   ├── state/         ← reactive stores (Svelte 5 runes)
│   ├── types/         ← shared domain types
│   ├── ui/            ← design tokens + 17 primitive components
│   └── components/    ← hero surfaces (TopBar, Editor, KanbanView, ...)
├── routes/            ← SvelteKit routes (home, local, remote, wizard)
├── app.html
└── routes/layout.css
tests/
├── adapters/   ← FSA / isomorphic-git / renderer / handle-store / memory-fs
├── services/   ← every service has a dedicated test file
├── state/      ← every store has a dedicated test file
├── ui/         ← component tests + harnesses
├── build/      ← header shape + CSP nonce + bundle audit
└── a11y/       ← axe-core + keyboard nav
scripts/
├── add-sri.mjs       ← stamps SRI on every modulepreload + module script
├── check-csp.mjs     ← scans build/ for eval/Function/document.write
└── check-i18n.mjs    ← fails the build on hard-coded English strings
docs/
├── ers.md                     ← full Engineering Requirements Specification
└── current-project-status.md  ← step-by-step build log + security audit
static/
└── _headers                   ← CSP / HSTS / COOP / COEP / CORP
```

---

## Non-goals

quill\.md is **not** trying to be:

- **A full project management suite.** No time tracking, no estimates, no sprints, no capacity planning. If you need those, link out to your existing tooling.
- **A replacement for GitHub Issues at scale.** GitHub Issues has moderation, spam filtering, cross-repo search, and a million integrations we don't.
- **A real-time collaboration tool.** quill\.md is single-user at the editor level. For multi-user, use Git + pull requests like you already do.
- **A mobile app.** Mobile is explicitly out of scope for v1 (NFR-5). The Remote Mode is responsive enough to read on a phone, but the editor expects a desktop browser.
- **A SaaS.** quill\.md is fully open source, runs entirely client-side, and has no first-party server. If you want to self-host, you can; if you don't, you can use a public static host.
- **A migration tool from Jira/Linear/Notion.** The data model is too different to be a drop-in. If you want to move from a hosted tracker, plan on a one-off script.

---

## Roadmap

v0 is feature-complete. Step 8 polish is what's left before v0.1:

- [ ] Per-build CSP nonce (lands in Step 7/8)
- [ ] `pako` → `fflate` swap (drops the only `script-src` allow-list entry)
- [ ] Coverage on `local-fs.ts` and `handle-store.ts` in the `client` Vitest project
- [ ] Fuzz / property-based tests
- [ ] Real screen-reader smoke test (NVDA / VoiceOver / Orca)
- [ ] Mobile breakpoints (post-v1)
- [ ] In-app template editor for the wizard's "Create your own" path
- [ ] Live `RUN_LIVE_TESTS=1` remote integration test

See [`docs/current-project-status.md`](./docs/current-project-status.md) for the live step-by-step status.

---

## FAQ

**Q: Why not just use GitHub Issues?**
GitHub Issues is great — use it if it works for you. quill\.md is for people who want their issues to _live in their repo_ — diffable, mergeable, offline-capable, private by default, and not at the mercy of a third party's pricing or uptime.

**Q: Can I sync between Local and Remote modes?**
Not in v1. Local Mode writes to disk; Remote Mode is read-only by design. The intended workflow: edit in Local Mode, commit, push; read in Remote Mode in any browser (including on a phone).

**Q: Does it work offline?**
Local Mode — yes, fully offline once the page is loaded. Remote Mode — no, it needs the Git provider to be reachable.

**Q: What happens if I edit an issue file in vim?**
The next time the app loads it, you'll see a non-blocking banner: _"this file was modified outside quill\.md"_. You can still read it, edit it in the app, and save — the integrity hash is recomputed and the warning clears on the next save.

**Q: Is there a mobile app?**
Not in v1. See "Non-goals".

**Q: How is this different from other markdown issue trackers?**
Most are either (a) Electron apps (heavier, not as portable), (b) editor plugins (locked to one editor), or (c) browser apps with a server component (you're back to trusting someone else). quill\.md is the only one that's a static SPA with two distinct operating modes (full local CRUD + read-only remote) and zero backend.

**Q: Can I use this with a private repo?**
Yes — provide a Personal Access Token in Remote Mode. Local Mode uses your existing Git workflow; no PAT is needed.

**Q: What if my Git provider doesn't have permissive CORS?**
That's exactly why the CORS proxy exists. The default `https://cors.isomorphic-git.org` is free and public; you can also configure your own in `config.json`.

**Q: Does it support multi-user editing in real time?**
No — that's explicitly out of scope. quill\.md is single-user at the editor level. Multi-user happens through Git + pull requests like the rest of your code.

**Q: What's the license?**
See `LICENSE` if present. If absent, contact the maintainers — the project is intended to be open source.

---

## Contributing

The ERS in [`docs/ers.md`](./docs/ers.md) is the source of truth for what quill\.md is supposed to do. The build log in [`docs/current-project-status.md`](./docs/current-project-status.md) tells you what's done and what's next.

```sh
pnpm install
pnpm dev          # local development server
pnpm check        # typecheck
pnpm lint         # format + lint + i18n guard + CSP guard
pnpm test         # unit + integration + a11y + build
pnpm build        # static bundle
```

Before opening a PR, run the full verification chain. There is no CI — `pnpm check && pnpm lint && pnpm test` is the contract.

---

## Acknowledgements

Built on the shoulders of: [SvelteKit], [Svelte 5], [isomorphic-git], [marked], [DOMPurify], [gray-matter], [js-yaml], [Tailwind CSS], [daisyUI], [lucide], [shiki], [Vitest], [Playwright], [axe-core], and the entire open-source web platform.

[SvelteKit]: https://kit.svelte.dev
[Svelte 5]: https://svelte.dev
[isomorphic-git]: https://isomorphic-git.org
[marked]: https://marked.js.org
[DOMPurify]: https://github.com/cure53/DOMPurify
[gray-matter]: https://github.com/jonschlinkert/gray-matter
[js-yaml]: https://github.com/nodeca/js-yaml
[Tailwind CSS]: https://tailwindcss.com
[daisyUI]: https://daisyui.com
[lucide]: https://lucide.dev
[shiki]: https://shiki.style
[Vitest]: https://vitest.dev
[Playwright]: https://playwright.dev
[axe-core]: https://github.com/dequelabs/axe-core
