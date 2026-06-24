# Step 6 — Smoke test results (agent-environment subset)

> **Status:** Partial — the agent environment has no Chromium-based
> browser and no GUI, so most of `docs/smoke-tests/step-6.md` cannot
> run here. This file documents what **was** verified in the agent
> environment (static analysis of the production build, the
> verification chain, and the automated test suite). The full manual
> smoke is queued for a human reviewer.
>
> **Date:** 2026-06-24
> **Reviewer:** `agent-coder` (sub-phase 6M)
> **Branch:** `feat/step-6-ui-layer-1`

---

## Verification chain (run in the agent environment)

| Check                                                        | Result                                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                                                 | 0 errors, 0 warnings                                                                                                |
| `pnpm lint` (Prettier + ESLint + `check-i18n` + `check-csp`) | Clean; `0 hard-coded English strings across 27 .svelte files`; `0 violations, 1 allow-listed warning(s)`            |
| `pnpm test`                                                  | **815 passing, 1 skipped** across 51 files                                                                          |
| `pnpm build`                                                 | Succeeds in 8.98s; `build/_app/immutable/` + `build/_headers` + `build/_redirects` + `build/integrity.json` emitted |
| `pnpm audit`                                                 | No known vulnerabilities                                                                                            |
| `pnpm check:csp`                                             | `0 violations, 1 allow-listed warning(s), 21 build file(s) scanned`                                                 |
| `pnpm check:i18n`                                            | `0 hard-coded English strings across 27 .svelte files`                                                              |

The verification chain is green. The one allow-listed warning is the
pako `Function(\`binder\`...)`inflate fast path (transitive via`isomorphic-git`). Follow-up documented in
`docs/audits/2026-06-23/step-6-csp.md` §8 (replace pako with fflate).

## Static analysis of `build/`

### Bundle inventory (`build/_app/immutable/`)

The production bundle consists of:

- `entry/start.*.js` — the SvelteKit runtime entry.
- `entry/app.*.js` — the SvelteKit app entry (mounts the root component).
- `chunks/*.js` — 9 chunks (including the isomorphic-git / pako chunk).
- `nodes/*.js` — route-level nodes.
- `assets/` — the static assets (compiled CSS, etc.).

12 immutable assets are emitted in total. Each one is registered in
`build/integrity.json` with its SHA-384 hash.

### SRI coverage (per `build/integrity.json`)

`scripts/add-sri.mjs` ran end-to-end on the build output:

```
add-sri: wrote 12 integrity entries to T:\Kiroku\AgnosticIssuer\build\integrity.json (verified by re-read)
```

Every `<link rel="modulepreload">` and module `<script>` in
`build/index.html` is stamped with `integrity="sha384-…"` and
`crossorigin="anonymous"`. The re-read verification at the end of the
script confirms the entry count matches the in-memory map — no
partial-write failure mode.

Sample (from `build/index.html`):

```html
<link
	href="/_app/immutable/entry/start.CfgkvWaa.js"
	rel="modulepreload"
	integrity="sha384-cbsuzJVx/kDcwcrLQXYsEO0FKq+tKDRlaHEXTi/Absoc6u19moUhQgrAJfqBbdyp"
	crossorigin="anonymous"
/>
```

### CSP coverage

`scripts/check-csp.mjs` scanned 21 files (`build/index.html` + 20 JS
chunks) for `eval(`, `new Function(`, `Function(`, `document.write(`:

- 0 violations.
- 1 allow-listed warning (the pako inflate fast path).
- 0 inline event handlers (`onclick="..."` etc.) in `build/index.html`.

The CSP template in `static/_headers` covers every directive from the
audit's minimum-viable template. The `trusted-types nomad-md dompurify
default` policy name enables Trusted Types enforcement at the DOMPurify
sink.

### i18n coverage

`scripts/check-i18n.mjs` scanned every `.svelte` file under
`src/lib/components/**` and `src/routes/**`:

- 0 hard-coded English strings.
- 27 `.svelte` files scanned.
- Every user-facing string is sourced from `src/lib/ui/strings.ts`
  via the `t(key, params?)` helper.

The script's heuristics prune false positives (class names, test
hooks, version strings, file paths, numeric-only strings, SVG
attributes).

### Automated tests (the subset that runs in headless Playwright)

| Test file                                  | Cases | What it covers                                                      |
| ------------------------------------------ | :---: | ------------------------------------------------------------------- |
| `tests/ui/tabs.svelte.test.ts`             |   6   | Tabs keyboard nav (←/→/Home/End/Enter/Space) + aria-selected.       |
| `tests/ui/modal.svelte.test.ts`            |   3   | Modal focus trap + ESC + backdrop.                                  |
| `tests/ui/app-shell.svelte.test.ts`        |  13   | Three-region layout + IntegrityWarningBanner.                       |
| `tests/ui/recent-folders.svelte.test.ts`   |   4   | RecentFoldersList render + Forget affordance.                       |
| `tests/ui/kanban-dnd.svelte.test.ts`       |   5   | Kanban DnD (svelte-dnd-action) + keyboard parity.                   |
| `tests/ui/list-keyboard.svelte.test.ts`    |   5   | List view ↓/↑/Enter + auto-focus first row.                         |
| `tests/ui/remote-toolbar.svelte.test.ts`   |   7   | RemoteToolbar Refresh + Sign out + read-only guards.                |
| `tests/ui/form-fields.svelte.test.ts`      |   7   | Editor's FormFields template-driven render + inline errors.         |
| `tests/ui/markdown-preview.svelte.test.ts` |   4   | Editor's MarkdownPreview 250 ms debounce + DOMPurify.               |
| `tests/ui/settings-panel.svelte.test.ts`   |   7   | SettingsPanel slide-in + theme picker + Recent folders.             |
| `tests/ui/filter-url-sync.svelte.test.ts`  |   4   | FilterUrlSync on-mount + on-change + popstate.                      |
| `tests/ui/strings.test.ts`                 |   —   | The `t()` helper: missing-key, function-form leaves, params.        |
| `tests/a11y/step-6.a11y.test.ts`           |  10   | axe-core 4.12.1 across 9 surfaces; 0 serious + critical violations. |
| `tests/a11y/keyboard-nav.test.ts`          |   6   | Keyboard-only UC-1 walkthrough.                                     |

These cover the structural + a11y + automated portion of the smokes in
`docs/smoke-tests/step-6.md`. They do **not** cover:

- The FSA picker (no Chromium driver in the agent environment).
- The real Git provider's CORS proxy response.
- The dev-tools console output for CSP violations.
- The screen-reader announcement (NVDA / VoiceOver / Orca).
- The OS theme live update (no OS in the agent environment).

These are the manual smokes queued for a human reviewer.

## Smokes queued for a human reviewer

The following smokes from `docs/smoke-tests/step-6.md` cannot run in
the agent environment and are pending a human:

- **UC-1 (Open folder → create issue → save → reload)** — requires the
  File System Access API in Chromium.
- **UC-2 (Browse remote read-only)** — requires a real Git provider
  PAT + the `cors.isomorphic-git.org` proxy.
- **UC-3 (Kanban drag updates status + persists)** — requires mouse
  drag in a real browser.
- **UC-4 (Gantt renders bars + dependency arrows)** — requires a real
  browser SVG renderer.
- **Keyboard-only smoke (NFR-4)** — requires a real keyboard.
- **CSP smoke** — requires DevTools in a real browser.
- **Theme smoke (FR-14)** — requires OS theme emulation.
- **Integrity warning smoke (FR-15)** — requires an external file
  editor (e.g. VS Code) and a real browser.
- **Filter URL sync smoke (FR-7 + 6I)** — requires a real browser to
  observe the URL bar.

When the human runs the smokes, fill in this file with:

- Date / reviewer name.
- Browser + version for each smoke.
- Pass / Fail per smoke.
- Any deviations from the expected behaviour, with screenshots or
  copy-paste of the relevant DevTools output.

## Open items that did NOT block the smoke

These are documented in `docs/changelogs/step-6-report.md` §"Known
gaps / follow-ups" but are explicitly out of scope for the Step 6
verification:

- `onRefreshSuccess` dep in `ModeStore` is unwired (6F hand-off).
- `FilterUrlSync` "skip when Settings panel is open" guard is
  deferred (6I hand-off).
- `pako` → `fflate` swap (6L follow-up).
- Per-build CSP nonce (6L follow-up).
- Real screen-reader smoke (6K follow-up).
- In-app template editor (wizard's "Create your own" disabled radio).
- `configStore.save()` writer for the CORS proxy.
- Mobile breakpoints (NFR-5 excludes mobile in v1).
- Fuzz / property-based tests (deferred to Step 8 polish).
- Coverage on `local-fs.ts` and `handle-store.ts`.
- Kanban DnD Enter/Space keybinding (6E open question #4).
- Gantt `aria-roledescription` + bar-by-bar descriptions (6K open
  follow-up).
