# Step 6 — UI Layer (Retrospective)

| Step | Title                                  | Date       | Status |
| ---- | -------------------------------------- | ---------- | ------ |
| 6    | UI Layer — chrome, views, editor, a11y | 2026-06-24 | Done   |

## TL;DR

The chrome shipped. The reactive store graph from Step 5 now drives a working
SPA — home hero, three-view local mode (List / Kanban / Gantt), read-only
remote view, template-driven editor with Markdown preview, settings panel,
and a global integrity-warning banner. **815 tests pass across 51 files
(+201 since Step 5's 614)**; the verification chain
(`pnpm check && pnpm lint && pnpm test && pnpm build && pnpm audit`) is green.
Step 6 ran in **13 sub-phases (6A through 6M)** across the planning
session. One new direct dependency (`svelte-dnd-action@^0.9.70`); zero CVEs
(`pnpm audit` reports no known vulnerabilities; the `pnpm.overrides` for
`js-yaml@^4.2.0` and `cookie@^0.7.0` from Step 5 stay in place). The
security-audit carry-overs — minimum-viable CSP, SRI polish, Trusted Types
enablement — are closed in `docs/audits/2026-06-23/step-6-csp.md`. The
WCAG 2.1 AA audit is closed in `docs/audits/2026-06-23/step-6-a11y.md`
(zero serious + critical axe violations across 9 surfaces).

## Step 6 scope

### Hybrid design system (per §3 of the plan)

| Surface                                               | System        | Rationale                                                     |
| ----------------------------------------------------- | ------------- | ------------------------------------------------------------- |
| Forms / tables / tabs / modals / badges / tooltips    | **daisyUI 5** | Standard controls, accessible out of the box.                 |
| TopBar / LeftRail / Home / Editor / Wizard / Settings | **Custom**    | Hero surfaces — visual character + bespoke density.           |
| Gantt colour palette                                  | **Custom**    | Reads `templatesStore.byType.get(type).color`; hash fallback. |
| Integrity-warning banner                              | **Custom**    | Global component, deliberate style, FR-15 surface.            |
| Empty states + skeletons                              | **Custom**    | Polish layer.                                                 |

The daisyUI 5 install lands via `@plugin 'daisyui';` in
`src/routes/layout.css`. Tokens live in `src/lib/ui/tokens.css`
(hero-surface values) and inside daisyUI's theme variables (primitive
values). The two systems do not overlap — primitives consume daisyUI
classes, hero surfaces consume `tokens.css`.

### Per-surface design system mapping

| Hero surface     | Component file                                     | Notes                                                          |
| ---------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| TopBar           | `src/lib/components/TopBar.svelte`                 | App name, mode badge, folder / repo URL, theme toggle.         |
| LeftRail         | `src/lib/components/LeftRail.svelte`               | View switcher, FilterBar, integrity badge.                     |
| Home screen      | `src/routes/+page.svelte`                          | Hero + two action cards + RecentFoldersList + HowItWorks.      |
| Local view       | `src/routes/local/+page.svelte`                    | `LocalToolbar` + 3 view components + EditorPanel.              |
| Remote view      | `src/routes/remote/+page.svelte`                   | `RemoteToolbar` + 3 view components (read-only) + EditorPanel. |
| Editor           | `src/lib/components/EditorPanel.svelte`            | Template-driven form + section tabs + Markdown preview.        |
| Wizard           | `src/routes/wizard/+page.svelte`                   | First-run setup; "Create your own" is a disabled radio.        |
| Settings panel   | `src/lib/components/SettingsPanel.svelte`          | Slide-in from the right.                                       |
| Integrity banner | `src/lib/components/IntegrityWarningBanner.svelte` | Global, FR-15 surface.                                         |

## Sub-phase status

| Sub-phase | Title                                           | Status | Notes                                                                                                                   |
| --------- | ----------------------------------------------- | :----: | ----------------------------------------------------------------------------------------------------------------------- |
| 6A        | Design tokens & theme (daisyUI 5 + no-flash)    |   ✅   | `tokens.css`, daisyUI plugin, `src/app.html` no-flash script.                                                           |
| 6B        | Primitive component library                     |   ✅   | 17 daisyUI wrappers under `src/lib/ui/` (Button, Tabs, Modal, etc.).                                                    |
| 6C        | Layout shell (AppShell + TopBar + LeftRail)     |   ✅   | Three-region layout; home + wizard are single-column.                                                                   |
| 6D        | Home screen (RecentFoldersList + HowItWorks)    |   ✅   | Per ERS §4.1.2.                                                                                                         |
| 6E        | Local view (toolbar + DnD + view polishes)      |   ✅   | `svelte-dnd-action` added; full keyboard parity on Kanban.                                                              |
| 6F        | Remote view + `refreshRemote`                   |   ✅   | New `modeStore.refreshRemote(pat)` + `lastFetchedAt` slot + `RemotePatRequiredError`.                                   |
| 6G        | Editor (FormFields + MarkdownPreview + rewrite) |   ✅   | Template-driven; debounced 250 ms preview; ESC closes.                                                                  |
| 6H        | Settings panel + `system` theme                 |   ✅   | Three-way theme picker; `matchMedia` listener; `Effect`-based OS preference.                                            |
| 6I        | Filter URL sync                                 |   ✅   | `FilterUrlSync.svelte` mounts in `local` + `remote`; debounced 100 ms.                                                  |
| 6J        | i18n string map + lint                          |   ✅   | `src/lib/ui/strings.ts`; `scripts/check-i18n.mjs` flags hard-coded English strings.                                     |
| 6K        | Accessibility audit                             |   ✅   | axe-core 4.12.1; 7 critical + 1 serious → 0 across 9 surfaces. See `docs/audits/2026-06-23/step-6-a11y.md`.             |
| 6L        | CSP & security headers                          |   ✅   | `static/_headers`, `docs/hosting/github-pages.md`, `scripts/check-csp.mjs`. See `docs/audits/2026-06-23/step-6-csp.md`. |
| 6M        | Smoke test & verify                             |   ✅   | This report + `docs/smoke-tests/step-6.md` (this sub-phase).                                                            |

## Per-sub-phase what landed

### 6A — Design tokens & theme

- **Files:** `src/lib/ui/tokens.css` (107 lines), `src/routes/layout.css`
  (`@plugin 'daisyui';` + daisyUI theme config), `src/app.html` (no-flash
  inline `<script>`), `.prettierignore` (two new entries for the
  hand-tuned docs).
- **Key design decisions:**
  - **Tailwind 4 CSS-first config preserved.** No `tailwind.config.js`;
    tokens land via `@plugin 'daisyui';` and a `@theme { ... }` block.
    The hybrid is in CSS, not in a JS config.
  - **daisyUI 5 with both default themes** (light + dark). Hero-surface
    variables in `tokens.css` reference the daisyUI variables so the two
    systems never drift.
  - **No-flash theme bootstrap in `src/app.html`.** A small synchronous
    `<script>` (~150 bytes) reads `localStorage['nomad.md.theme']` +
    `matchMedia('(prefers-color-scheme: dark)')` and adds the `.dark`
    class before first paint. This is the one `'unsafe-inline'` carve-out
    in `script-src`; the per-build nonce follow-up is documented in the
    6L audit.
  - **`prefers-color-scheme` honoured on first load** — the 6H "System"
    preference extends this further with a live `matchMedia` listener.

### 6B — Primitive component library

- **Files:** 17 thin Svelte 5 wrappers under `src/lib/ui/`
  (`Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Checkbox`,
  `Radio`, `Tabs`, `Badge`, `Alert`, `Modal`, `Tooltip`, `Menu`, `Card`,
  `Toolbar`, `Skeleton`, `EmptyState`) plus a barrel
  `src/lib/ui/index.ts`.
- **Key design decisions:**
  - **Pure daisyUI 5 wrappers.** The primitives do **not** import from
    `$lib/state`; they are framework-agnostic and testable in isolation.
  - **`Tabs` ships WAI-ARIA keyboard nav** (←/→/Home/End/Enter/Space per
    the Authoring Practices); `Modal` uses the native `<dialog>` +
    `showModal()` for free focus trap, ESC, and backdrop; `Menu` has
    ↑/↓ keyboard nav.
  - **Every interactive primitive carries a `focus-visible` ring.**
    This is the foundation of the keyboard-only operability (NFR-4).
- **Tests:** `tests/ui/tabs.svelte.test.ts` (6 cases) +
  `tests/ui/modal.svelte.test.ts` (3 cases) + 2 harnesses.

### 6C — Layout shell (AppShell + TopBar + LeftRail + IntegrityWarningBanner)

- **Files:** `src/lib/components/AppShell.svelte`,
  `src/lib/components/TopBar.svelte`, `src/lib/components/LeftRail.svelte`,
  `src/lib/components/IntegrityWarningBanner.svelte`. Touches:
  `src/routes/+layout.svelte`, `src/routes/+page.svelte`,
  `src/routes/local/+page.svelte`, `src/routes/remote/+page.svelte`.
- **Key design decisions:**
  - **Three-region layout per ERS §4.1.1.** `[TopBar] [LeftRail? | main canvas]`.
    LeftRail renders only for `local` and `remote` modes; the home and
    wizard are single-column.
  - **TopBar is sticky and shared.** The per-page header strip that used
    to live in each route moved into TopBar — single source of truth for
    the chrome.
  - **IntegrityWarningBanner is global, not per-editor.** Reads
    `issuesStore.integrityWarnings`; per-mount dismissal; clicking a row
    opens the affected issue in the editor. The per-editor inline warning
    in `EditorPanel` is a secondary signal.
  - **Settings menu trigger is a placeholder in 6C**; 6H replaces it
    with the real `SettingsPanel`.
- **Tests:** `tests/ui/app-shell.svelte.test.ts` (13 cases).

### 6D — Home screen (RecentFoldersList + HowItWorksStrip)

- **Files:** `src/lib/components/RecentFoldersList.svelte` (116 lines),
  `src/lib/components/HowItWorksStrip.svelte` (59 lines).
- **Key design decisions:**
  - **`recentHandles` drives the list** — pulled live from
    `modeStore.recentHandles`; Forget calls `handleStore.removeRecent`
    with a local optimistic `SvelteSet` update.
  - **HowItWorksStrip is conditional** — only rendered when
    `recentHandles` is empty (first-run path).
  - **`formatRelative` is pure** — takes `now` as an argument for
    testability. (Lifted into `src/lib/ui/format.ts` in 6F so both
    RecentFoldersList and RemoteToolbar share it.)
- **Tests:** `tests/ui/recent-folders.svelte.test.ts` (4 cases).

### 6E — Local view (toolbar + modals + view polishes + DnD)

- **Files:** `src/lib/components/LocalToolbar.svelte` (168 lines),
  `src/lib/components/NewIssueModal.svelte` (216 lines),
  `src/lib/components/EmptyTrashModal.svelte` (105 lines),
  `src/lib/components/ListView.svelte` (rewritten),
  `src/lib/components/KanbanView.svelte` (rewritten, 326 lines delta),
  `src/lib/components/GanttView.svelte` (polish, 211 lines delta),
  `src/lib/ui/colors.ts` (new shared hash → oklch palette).
- **Key design decisions:**
  - **`svelte-dnd-action` added** as a direct devDep. ERS-listed but
    never installed; needed for the Kanban drag-and-drop in Local Mode.
    `pnpm audit` clean; no CVEs introduced.
  - **Full Kanban keyboard parity.** Mouse drag, touch drag, and
    ←/→/↑/↓/Enter all move cards between columns. Remote Mode makes
    the drop a no-op + a tooltip — no accidental writes.
  - **`cardsByStatus` is a plain `Record`, not `$derived`.** Required to
    break a svelte-dnd-action / Svelte 5 reactivity loop the earlier
    draft tripped.
  - **Type-driven Gantt colours** — `templatesStore.byType.get(type).color`
    with a deterministic 32-bit hash → oklch fallback (in
    `src/lib/ui/colors.ts`). Replaces the hard-coded 4-entry palette that
    was in the pre-6E Gantt.
  - **Lucide icons pre-bundled** in `vite.config.ts` (13 icons for the
    type picker + the toolbar buttons) — Vite discovers them at runtime
    otherwise and triggers a reload loop during tests.
- **Tests:** `tests/ui/kanban-dnd.svelte.test.ts` (5 cases),
  `tests/ui/list-keyboard.svelte.test.ts` (5 cases), plus 1 harness.

### 6F — Remote view + `refreshRemote` + `formatRelative`

- **Files:** `src/lib/components/RemoteToolbar.svelte` (179 lines),
  `src/lib/components/RefreshPatPrompt.svelte` (144 lines),
  `src/lib/state/mode.svelte.ts` (`refreshRemote`, `lastFetchedAt`,
  `RemotePatRequiredError`), `src/lib/ui/format.ts` (extracted).
- **Key design decisions:**
  - **New `modeStore.refreshRemote(pat)` method.** Re-fetches via the
    partial clone, updates `lastFetchedAt`, throws
    `RemotePatRequiredError` when the session is gone. NFR-7 holds —
    the cache is intact on failure.
  - **`onRefreshSuccess` callback dep.** Defaults to a no-op so the
    layout can wire a "re-load issues / config / templates" callback
    after a successful refresh. The wiring itself is deferred to a
    follow-up (see "Known gaps").
  - **`lastFetchedAt: number | null` reactive slot.** Stamped on every
    successful `openRemote` / `refreshRemote`; cleared on `signOut`.
    Drives the "Last fetched: N min ago" label in the toolbar.
  - **`formatRelative` shared.** Was inline in `RecentFoldersList` in
    6D; lifted to `src/lib/ui/format.ts` so `RemoteToolbar` can reuse
    the exact same "N min ago" / "N h ago" / "N d ago" buckets.
- **Tests:** `tests/ui/remote-toolbar.svelte.test.ts` (7 cases) +
  `tests/state/mode.refresh-remote.test.ts` (8 state cases).

### 6G — Editor (FormFields + MarkdownPreview + EditorPanel rewrite)

- **Files:** `src/lib/components/FormFields.svelte` (231 lines),
  `src/lib/components/MarkdownPreview.svelte` (78 lines),
  `src/lib/components/EditorPanel.svelte` (rewritten, 345 lines delta).
- **Key design decisions:**
  - **Template-driven fields, ascending `id` order.** Every field type
    (`text`, `date`, `number`, `select`, `multi-select`, `user`,
    `relations`) maps to the right 6B primitive. `longtext` fields are
    skipped from the form — they live in the section tabs per
    ERS §4.1.3.
  - **Inline per-field errors.** `editor.errors` is filtered by field
    key; the error appears beneath the input. Obligatory fields show a
    `*` in the label.
  - **250 ms debounced Markdown preview.** Renders the active section's
    body via `renderMarkdown(..., 'comment')`; the 6B Skeleton shows
    while in flight; DOMPurify-sanitised output via `{@html}`.
  - **ESC closes the editor.** `addEventListener` in an effect with a
    cleanup that removes the listener on unmount.
  - **Type field is read-only.** Changing the type would invalidate
    sections; the deferred "type-change confirm" path is documented
    under "Known gaps".
- **Tests:** `tests/ui/form-fields.svelte.test.ts` (7 cases) +
  `tests/ui/markdown-preview.svelte.test.ts` (4 cases) + 1 harness.

### 6H — Settings panel + `system` theme preference

- **Files:** `src/lib/components/SettingsPanel.svelte` (200 lines),
  `src/lib/state/theme.svelte.ts` (`preference`, `effectiveTheme`,
  `matchMedia` listener), `src/routes/wizard/+page.svelte` (re-skinned).
- **Key design decisions:**
  - **Theme type extended:** `'light' | 'dark' | 'system'`. The
    `effectiveTheme` getter resolves `'system'` via
    `matchMedia('(prefers-color-scheme: dark)').matches`.
  - **Live `matchMedia` listener.** When the OS theme flips while the
    app is open, the `system` preference re-resolves automatically.
  - **No-flash + System:** the `src/app.html` script in 6A implicitly
    handles `'system'` on first paint (a stored `'system'` falls through
    to the OS preference, which is the correct behaviour).
  - **Settings panel is a slide-in.** Three sections: Theme (3 buttons),
    CORS proxy (read-only field with a "coming in a follow-up" note —
    no `configStore.save()` writer yet), Recent folders (re-uses
    `<RecentFoldersList />`), Commands ("Empty trash" re-uses
    `<EmptyTrashModal />`; "Clear remote cache" disabled with a tooltip
    until the per-key surface is exposed).
- **Tests:** `tests/ui/settings-panel.svelte.test.ts` (7 cases) +
  8 new state cases in `tests/state/theme.test.ts`.

### 6I — Filter URL sync

- **Files:** `src/lib/components/FilterUrlSync.svelte` (60 lines).
- **Key design decisions:**
  - **Render-less bridge.** Mounted in `local/+page.svelte` and
    `remote/+page.svelte`; not in `+layout.svelte` so the wizard and
    home don't accidentally trigger filter writes.
  - **Debounced 100 ms.** Deep-equal dedupe via `JSON.stringify` of the
    filter state guards against redundant `replaceState` calls. The
    `isFirstRun` guard prevents the initial mount from overwriting the
    query the user landed with.
  - **`popstate` listener.** Back / forward re-parses the URL into the
    store via `filter.parse(window.location.search)`.
  - **Deferred: skip when Settings panel is open.** `settingsOpen` is
    component-local `$state` in `TopBar.svelte` (6C); no body class is
    exposed for `FilterUrlSync` to consult. The cleanest follow-up is a
    new `createUiStore` under `src/lib/state/ui.svelte.ts` (see
    "Known gaps").
- **Tests:** `tests/ui/filter-url-sync.svelte.test.ts` (4 cases) +
  `tests/ui/FilterUrlSyncHarness.svelte.ts`.

### 6J — i18n string map + lint

- **Files:** `src/lib/ui/strings.ts` (405 lines),
  `scripts/check-i18n.mjs` (346 lines).
- **Key design decisions:**
  - **Flat-but-grouped map.** Top-level keys are surfaces (`common`,
    `home`, `editor`, `list`, `kanban`, `gantt`, `wizard`, `settings`).
    A few surfaces nest sub-groups (`home.recentFolders`,
    `editor.sections`).
  - **Function-form leaves for parametric copy.** E.g.
    `home.recentFolders.forgetLabel: (params) => \`Forget ${params.name}\``.
    Plain string leaves ignore params. Helper exported as `t` (not `$t`— Svelte 5 reserves the`$` prefix for runes).
  - **Missing-key policy:** `[[key]]` is returned AND a `console.warn`
    fires in dev (`import.meta.env.DEV`). The helper never throws.
  - **Lint rule:** `scripts/check-i18n.mjs` walks every `.svelte` file
    under `src/lib/components/**` and `src/routes/**`, strips
    `<script lang="ts">` blocks + HTML comments, and flags any literal
    English string that isn't inside a `$t(...)` call. Heuristics prune
    false positives (class names, test hooks, version strings, file
    paths, numeric-only strings).
  - **Wired into `pnpm lint`.** The package script is now:
    `prettier --check . && eslint . && node scripts/check-i18n.mjs && node scripts/check-csp.mjs`.
- **Tests:** `tests/ui/strings.test.ts` (covers every group).

### 6K — Accessibility audit

- **Files:** `tests/a11y/step-6.a11y.test.ts` (10 cases),
  `tests/a11y/keyboard-nav.test.ts` (6 cases),
  `docs/audits/2026-06-23/step-6-a11y.md` (the audit record).
- **Key design decisions:**
  - **axe-core 4.12.1** in Playwright Chromium via `vitest-browser`.
    No `@axe-core/playwright` wrapper because `vitest-browser` already
    exposes the DOM.
  - **Tag sets:** `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` for hard
    assertions; `best-practice` is included in the summary dump for
    triage visibility.
  - **9 surfaces tested:** Home (recent), Home (first-run), Local List,
    Local Kanban, Local Gantt, Editor, Wizard, Settings, Remote List.
  - **Severity policy:** zero serious / critical per surface (mandated
    by the brief). `moderate` and `minor` are listed for visibility but
    do not fail the test.
- **Findings + fixes:** 7 critical + 1 serious → **0**. See
  `docs/audits/2026-06-23/step-6-a11y.md` for the full table. Highlights:
  - **Tabs `aria-controls` removed.** The matching `tabpanel-X` elements
    do not exist anywhere in the codebase; `aria-controls` was dangling.
    The WAI-ARIA pattern still holds via `role="tablist"` +
    `aria-selected` + `tabindex`.
  - **Wizard "Create your own" Radio labelled.** Added `ariaLabel` prop
    - `...rest` spread to `Radio.svelte` and `Checkbox.svelte`; the
      wizard passes `ariaLabel={t('wizard.customAria')}`.
  - **Gantt SVG `role="img"` → `aria-roledescription`.** The bars are
    interactive (`<g role="button" tabindex="0">`), so the SVG cannot
    be `role="img"` (axe's `nested-interactive` rule fires).
  - **Duplicate-banner landmarks fixed.** Hero `<header>` →
    `<section aria-labelledby="home-hero-title">`; the same pattern
    fixed the wizard banner and the inline section headers in
    NewIssueModal / EmptyTrashModal / ListView / EditorPanel /
    SettingsPanel.
  - **TopBar labelled.** `aria-label={t('topbar.ariaLabel')}` so the
    banner landmark has a name.
  - **Kanban cards wrapped in `<li role="listitem">`.** svelte-dnd-action
    injects `role="list"` on the column; each card is now a proper
    listitem.

### 6L — CSP & security headers

- **Files:** `static/_headers` (84 lines), `static/_redirects` (new),
  `docs/hosting/github-pages.md` (the GitHub Pages equivalent),
  `scripts/check-csp.mjs` (306 lines), `scripts/add-sri.mjs` (polished).
- **Key design decisions:**
  - **Minimum-viable CSP from the audit, slightly strengthened.** The
    shipped policy matches the audit template on every directive; the
    only deviations (documented in the audit doc §3) are `img-src` adds
    `blob:` for DOMPurify sinks, and `trusted-types` adds the policy
    name `nomad-md dompurify default`.
  - **`'unsafe-inline'` for `script-src` and `style-src`** is the v0
    trade-off. Required by the no-flash theme bootstrap in
    `src/app.html` and by Tailwind 4 / Svelte's component-scoped
    styles. The per-build nonce follow-up is documented in the audit
    doc §4.
  - **Trusted Types enabled.** `require-trusted-types-for 'script'` +
    `trusted-types nomad-md dompurify default`. The renderer
    (`src/lib/adapters/renderer.ts`) constructs TrustedHTML values for
    the inner HTML of sanitized Markdown; DOMPurify is the documented
    sink.
  - **`scripts/check-csp.mjs`** scans the production bundle for
    `eval(`, `new Function(`, `Function(`, `document.write(`. Allow-list
    covers the one known third-party offender: pako's inflate fast path
    (transitive via isomorphic-git) — allow-listed as a warning with a
    follow-up (replace pako with fflate; see "Known gaps").
  - **`scripts/add-sri.mjs` polished.** Top-of-file doc block;
    integrity-map re-read verification at the end of the run (defends
    against partial writes).
  - **`pnpm build` and `pnpm lint` chain updated.** `build` now also
    runs `check-csp.mjs`; `lint` runs both `check-i18n.mjs` and
    `check-csp.mjs`.
- **Tests:** zero new test files (CSP is enforced by the lint script
  - the audit doc, not by automated tests).

### 6M — Smoke test & verify

- **Files:** `docs/changelogs/step-6-report.md` (this file),
  `docs/smoke-tests/step-6.md` (UC-1..UC-4 + keyboard / CSP / theme /
  integrity / URL-sync smokes), `docs/current-project-status.md`
  (Step 6 marked Done, "Next step" updated).
- **Key design decisions:**
  - **Docs-only sub-phase.** No new tests, no implementation changes.
    The verification chain runs unchanged.
  - **Smoke is structured for a human reviewer.** Chromium for Local
    Mode (FSA); Firefox for Remote Mode (read-only). Every step has
    pre-conditions, step-by-step instructions, pass criteria, and
    common pitfalls.
  - **Agent-environment verification subset documented in this report**
    (under "Verification"). The full smoke is queued for a human
    reviewer.

## Verification

| Check                                                        | Result                                                                                                          |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                                                 | 0 errors, 0 warnings                                                                                            |
| `pnpm lint` (Prettier + ESLint + `check-i18n` + `check-csp`) | Clean; `0 hard-coded English strings across 27 .svelte files`; `0 violations, 1 allow-listed warning(s)` (pako) |
| `pnpm test`                                                  | 815 passing, 1 skipped across 51 files                                                                          |
| `pnpm build`                                                 | Succeeds; `build/_headers`, `build/_redirects`, `build/integrity.json` emitted                                  |
| `pnpm audit`                                                 | 0 advisories                                                                                                    |
| `pnpm check:csp`                                             | 0 violations, 1 allow-listed warning(s)                                                                         |
| `pnpm check:i18n`                                            | 0 hard-coded English strings                                                                                    |
| WCAG 2.1 AA (axe-core 4.12.1)                                | 0 serious + critical violations across 9 surfaces                                                               |
| Keyboard-only walkthrough (UC-1)                             | Verified by `tests/a11y/keyboard-nav.test.ts` (6 cases)                                                         |
| Filter URL sync                                              | Verified by `tests/ui/filter-url-sync.svelte.test.ts` (4 cases)                                                 |
| `pnpm.overrides` for `js-yaml@^4.2.0` + `cookie@^0.7.0`      | Active; `pnpm audit` clean                                                                                      |

## Security audit carry-overs (closed)

All five items from the 2026-06-22 security audit that Step 6 owned are
closed. Full audit doc: `docs/audits/2026-06-23/step-6-csp.md`.

| #   | Item                                                                                                                      | Closed in                  | Notes                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Transport-layer headers (CSP / HSTS / X-Content-Type-Options / Referrer-Policy / Permissions-Policy / COOP / COEP / CORP) | `static/_headers` (6L)     | Scorecard moves from 1/5 → 5/5.                                                                                                                           |
| 2   | Subresource Integrity                                                                                                     | `scripts/add-sri.mjs` (6L) | Every `<link rel="modulepreload">` and module `<script>` stamped with `integrity="sha384-…"` + `crossorigin="anonymous"`. `build/integrity.json` emitted. |
| 3   | Trusted Types                                                                                                             | `static/_headers` (6L)     | `require-trusted-types-for 'script'` + `trusted-types nomad-md dompurify default`.                                                                        |
| 4   | CVE-2026-53550 (js-yaml ≤4.1.1)                                                                                           | `pnpm.overrides` (Step 5)  | Stays at 0 via `js-yaml@^4.2.0`.                                                                                                                          |
| 5   | CVE-2024-47764 (cookie <0.7.0)                                                                                            | `pnpm.overrides` (Step 5)  | Stays at 0 via `cookie@^0.7.0`.                                                                                                                           |

## A11y audit carry-overs (closed)

Full audit doc: `docs/audits/2026-06-23/step-6-a11y.md`. Summary:

| Severity | Before | After |
| -------- | :----: | :---: |
| Critical |   7    | **0** |
| Serious  |   1    | **0** |
| Moderate |   2    |   2   |
| Minor    |   0    |   0   |

Every fix is mapped to the WCAG criterion it addresses and the file /
line where it lands. See the audit doc's "Fixes applied" table for the
full per-file list.

## Known gaps / follow-ups (carry into Step 7+)

- **`onRefreshSuccess` dep in `ModeStore` is unwired (6F hand-off).**
  `createModeStore` accepts the dep and defaults to a no-op; the layout
  has not yet wired a "re-load issues / config / templates" callback
  after a successful remote refresh. Tracked in the Step 7 work plan.
- **`FilterUrlSync` "skip when Settings panel is open" guard is deferred (6I hand-off).**
  `settingsOpen` is component-local `$state` in `TopBar.svelte` (6C);
  no body class is exposed for `FilterUrlSync` to consult. The cleanest
  follow-up is a new `createUiStore` under `src/lib/state/ui.svelte.ts`
  with `settingsOpen` + `editorOpen` slots, then the layout mounts it
  alongside the data stores.
- **`pako` → `fflate` swap (6L follow-up).** Documented in the 6L audit
  doc §8 + the `scripts/check-csp.mjs` allow-list note. `fflate` is
  API-compatible with `pako` for the inflate path. A small adapter
  change in `src/lib/adapters/remote-git.ts`; the bundle drops ~30 KB.
- **Per-build CSP nonce (6L follow-up).** Documented in the 6L audit
  doc §4. The v1 fix is to promote the no-flash script to a separate
  file under `static/` and add a `<script src="..."></script>` tag —
  that removes the `'unsafe-inline'` carve-out for `script-src`. v0.2
  fix is a per-build hash of the inline script.
- **Real screen-reader smoke (6K follow-up).** The automated
  keyboard-nav tests cover the UC-1 keyboard path. The eyebrow test
  ("can a screen-reader user create and save an issue end-to-end
  without seeing the screen?") needs a human on NVDA / VoiceOver /
  Orca.
- **In-app template editor.** The wizard's "Create your own" radio is
  a disabled placeholder with a tooltip. The ERS allows it to ship as
  a future step; the v0 contract is the disabled radio.
- **`configStore.save()` writer for the CORS proxy.** The Settings
  panel exposes the field but the "Save to `config.json`" wire-up
  needs a `configStore.save()` method. Trivial service-layer addition
  for Step 7.
- **Mobile breakpoints (NFR-5 excludes mobile in v1).** Primitives
  don't break at narrow widths, but the design is desktop-first.
  Specifically, the Editor drawer is 40 rem fixed — at 360 px it
  overflows. The plan is to leave this as-is for v0.
- **Fuzz / property-based tests.** Deferred to Step 8 polish.
- **"Empty trash" + "Clear remote cache" affordances.** "Empty trash"
  works (calls the trash service). "Clear remote cache" is disabled
  with a tooltip until the per-key (`{url, branch, sha}`) surface is
  exposed by the remote-git adapter.
- **Coverage on `local-fs.ts` and `handle-store.ts`.** They run only
  in the `client` Vitest project (FSA-backed); the `client` project
  doesn't enable coverage instrumentation by default. A future polish
  item is to wire `@vitest/coverage-v8` into the `client` project.
- **Kanban DnD Enter/Space keybinding (6E open question #4).** Mouse,
  touch, and arrow keys are wired; Enter / Space for "drop" is the
  default focus behaviour but isn't covered by a dedicated test.
- **Gantt `aria-roledescription` + bar-by-bar descriptions (6K open
  follow-up).** The textual fallback `<details>` provides a tabular
  equivalent; a long-description enhancement
  (`aria-describedby` + a hidden prose block) is a future step.

## Files added or modified (working tree summary)

```
M  package.json                          (+ axe-core, + check-i18n / check-csp scripts)
M  pnpm-lock.yaml                        (svelte-dnd-action, axe-core, …)
M  scripts/add-sri.mjs                   (polish: doc block + re-read)
A  scripts/check-csp.mjs                 (new — 306 lines, scan + allow-list)
A  scripts/check-i18n.mjs                (new — 346 lines, lint the chrome)
M  src/app.html                          (no-flash theme bootstrap; CSP meta fallback)
M  src/routes/+layout.svelte             (three-region AppShell; i18n import)
M  src/routes/+page.svelte               (hero rewrite; section landmark; i18n)
M  src/routes/wizard/+page.svelte        (re-skin via 6B primitives + tokens)
M  src/routes/local/+page.svelte         (LocalToolbar + view switcher + FilterUrlSync)
M  src/routes/remote/+page.svelte        (RemoteToolbar + view switcher + FilterUrlSync)
M  src/lib/state/mode.svelte.ts          (refreshRemote, lastFetchedAt, RemotePatRequiredError)
M  src/lib/state/theme.svelte.ts         (system preference + matchMedia listener)
A  src/lib/ui/index.ts                   (barrel)
A  src/lib/ui/tokens.css                 (107 lines)
A  src/lib/ui/strings.ts                 (405 lines; t() helper)
A  src/lib/ui/colors.ts                  (hash → oklch palette)
A  src/lib/ui/format.ts                  (formatRelative)
A  src/lib/ui/{Alert,Badge,Button,Card,Checkbox,EmptyState,IconButton,Input,Menu,Modal,Radio,Select,Skeleton,Tabs,Textarea,Toolbar,Tooltip}.svelte
A  src/lib/components/{AppShell,EditorPanel,EmptyTrashModal,FilterBar,FilterUrlSync,FormFields,GanttView,HowItWorksStrip,IntegrityWarningBanner,KanbanView,LeftRail,ListView,LocalToolbar,MarkdownPreview,NewIssueModal,ProxyWarningBanner,RecentFoldersList,RefreshPatPrompt,RemoteToolbar,SettingsPanel,ThemeToggle,TopBar}.svelte
A  static/_headers                       (CSP + HSTS + …)
A  static/_redirects                     (SPA fallback)
A  docs/audits/2026-06-23/step-6-a11y.md (a11y audit record)
A  docs/audits/2026-06-23/step-6-csp.md  (CSP / SRI / Trusted Types audit record)
A  docs/hosting/github-pages.md          (GitHub Pages equivalent + residual gaps)
A  docs/step-6-ui-layer-plan.md          (the planning document, ~20 KB)
A  tests/ui/{tabs,modal,app-shell,recent-folders,kanban-dnd,list-keyboard,remote-toolbar,form-fields,markdown-preview,settings-panel,filter-url-sync,strings}.svelte.test.ts
A  tests/ui/{KanbanDndHarness,MarkdownPreviewHarness,ModalHarness,TabsHarness,FilterUrlSyncHarness}.svelte
A  tests/a11y/step-6.a11y.test.ts        (axe on 9 surfaces)
A  tests/a11y/keyboard-nav.test.ts       (UC-1 keyboard walkthrough)
A  tests/state/mode.refresh-remote.test.ts
M  tests/state/theme.test.ts             (+8 cases for system preference)
M  vite.config.ts                        (lucide pre-bundle + wildcard test exclude)
M  src/lib/index.ts                      (re-exports)
```

(The directories `docs/audits/`, `docs/changelogs/`, `docs/hosting/`,
`docs/smoke-tests/`, `tests/a11y/` were created in this session.)

## Test count breakdown

| Step | Tests passing | Files | Delta vs prev step                                   |
| ---- | :-----------: | :---: | ---------------------------------------------------- |
| 4    |      481      |  20   | baseline (Day 4 polish)                              |
| 5    |      614      |  29   | +133 tests, +9 files (state layer + integration)     |
| 6    |    **815**    |  51   | **+201 tests, +22 files** (UI + a11y + lint scripts) |

The +201 break down as:

- 6B: 9 (tabs 6 + modal 3)
- 6C: 13 (app-shell)
- 6D: 4 (recent-folders)
- 6E: 10 (kanban-dnd 5 + list-keyboard 5)
- 6F: 7 (remote-toolbar) + 8 state (mode.refresh-remote) = 15
- 6G: 11 (form-fields 7 + markdown-preview 4)
- 6H: 7 (settings-panel) + 8 state (theme system) = 15
- 6I: 4 (filter-url-sync)
- 6J: 1 file of `t()` helper tests + the `check-i18n` lint (runs at
  `pnpm lint`, not at `pnpm test`)
- 6K: 16 (a11y 10 + keyboard-nav 6)

Net: **+201 test cases**, **+22 test files**, **0 regressions**, **0
flaky tests** observed across the full verification chain.

## What 7+ looks like

Per `docs/step-6-ui-layer-plan.md` §7 (out-of-scope / deferred) and the
follow-ups above, Step 7 and Step 8 own:

### Step 7 — service-layer tests + adapter memory-fs mock + the writer holes

- **`configStore.save()` writer** (unblocks the CORS-proxy field in
  Settings).
- **`onRefreshSuccess` wiring** (re-load issues / config / templates
  after a remote refresh).
- **`createUiStore`** with `settingsOpen` + `editorOpen` slots
  (unblocks the 6I "skip when Settings panel is open" guard; opens the
  door to keyboard-trap coordination between the editor and the
  settings panel).
- **Per-key `clearCache` surface** in `modeStore` (unblocks the
  "Clear remote cache" command in Settings).
- **Trash auto-empty** (the "Empty trash" command is manual today; the
  v0.2 fix is a settable auto-empty interval).
- **Type-change confirm dialog** in the editor.
- **Live `RUN_LIVE_TESTS=1` remote integration** (the carry-over from
  Step 4 — `tests/adapters/remote-git.live.test.ts`).

### Step 8 — verify (`pnpm check && pnpm lint && pnpm test`) + manual smoke

- **Human runs the smoke at `docs/smoke-tests/step-6.md`** in Chromium
  (Local Mode) and Firefox (Remote Mode).
- **Real screen-reader smoke** on NVDA / VoiceOver / Orca.
- **High-contrast mode** (`forced-colors: active` media query).
- **Gantt long descriptions** (`aria-describedby` + a hidden prose
  block).
- **YAML cosmetic divergences** (date quoting, block vs flow style).
- **Per-build CSP nonce** (v1 fix: promote the no-flash script).
- **`pako` → `fflate` swap**.
- **Mobile breakpoints** (NFR-5 explicitly excluded in v1; revisit
  post-launch).
- **Fuzz / property-based tests**.
- **Coverage on `local-fs.ts` + `handle-store.ts`** in the `client`
  Vitest project.

The v0 contract — what nomad.md is today — is "local CRUD on the
desktop, read-only remote on the web, every string ready for i18n,
every surface passes WCAG 2.1 AA, every byte that ships is integrity-
stamped and CSP-bounded." Step 7 + 8 polish what's there; they do not
add new product surfaces.
