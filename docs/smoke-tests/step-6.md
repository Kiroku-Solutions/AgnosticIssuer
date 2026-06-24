# Step 6 — Manual smoke tests

> **Audience:** Human reviewer running the canonical UC-1..UC-4 from
> `docs/ers.md` §7 against the Step 6 chrome.
>
> **Browsers:**
>
> - **Local Mode:** Chromium-based (Chrome / Edge / Brave / Arc /
>   Opera / Vivaldi). Required for the File System Access API.
> - **Remote Mode:** Firefox 132+ or Chromium. Read-only; any modern
>   browser works.
>
> **Reference:** `docs/changelogs/step-6-report.md`,
> `docs/step-6-ui-layer-plan.md` §6 (verification matrix).
>
> **Automation subset:** `tests/a11y/step-6.a11y.test.ts` and
> `tests/a11y/keyboard-nav.test.ts` cover parts of UC-1, UC-2, UC-3,
> UC-4, and the keyboard-only walkthrough in headless Playwright
> Chromium. The smokes below are the **manual** counterpart for a
> human reviewer with the production build.

---

## Pre-flight checklist

Before running any smoke:

1. `pnpm install` (no CVEs expected; `pnpm audit` is clean).
2. `pnpm build` (produces `build/`).
3. `pnpm preview` (serves `build/` on `http://localhost:4173` by
   default). Alternatively `npx serve build` and apply
   `static/_headers` via a custom middleware (the Netlify / Cloudflare
   format is what `_headers` is written for).
4. Open `http://localhost:4173` in the right browser:
   - Local Mode (UC-1, UC-3, UC-4) → Chromium-based.
   - Remote Mode (UC-2) → Firefox or Chromium.
5. Open DevTools → Console. Filter for "Content Security Policy" —
   no violations expected at this point.
6. Have a sample `.nomad.md/` directory ready. Easiest: the ERS
   Appendix B.6 example (see `docs/ers.md` §8). Otherwise, the
   `tests/fixtures/` directory has a small hand-curated folder with
   two issues (one Bug, one Task) and a couple of integrity-warning
   scenarios baked in.

---

## UC-1 — Open folder → create issue → save → reload

**Goal:** Validate Local Mode end-to-end (FR-1, FR-2, FR-3, FR-15).

### Pre-conditions

- Chromium-based browser (Chrome / Edge / Brave / Arc / Opera /
  Vivaldi). Firefox does not implement the File System Access API;
  the "Open local folder" button will be replaced by an Alert saying
  the browser is unsupported.
- A folder on disk that already contains a `.nomad.md/` directory
  with at least:
  - `.nomad.md/config.json` (3 statuses, 2 users, valid shape).
  - `.nomad.md/templates/bug.json` and `.nomad.md/templates/task.json`.
  - `.nomad.md/issues/0001-…md`, `.nomad.md/issues/0002-…md`.

### Steps

1. Click **Open local folder** on the home screen.
2. Pick the folder. (Chromium shows the system folder picker.)
3. The app transitions to `/local`. The TopBar shows the folder name
   and a "Local" badge; the LeftRail shows the List / Kanban / Gantt
   tabs.
4. Verify the issue list (List view), the Kanban columns (Kanban
   view), and the Gantt bars (Gantt view).
5. Click **+ New issue** in the LocalToolbar.
6. The type-picker modal opens. Search for a type (e.g. "bug");
   click a type card.
7. Fill in the Title field (e.g. "Smoke test issue").
8. Tab to the next field. Verify the label is visible and the input
   has `aria-labelledby` (DevTools → Accessibility).
9. Click **Save** in the editor footer.
10. Verify the editor closes, the issue appears in the list / kanban
    / gantt, and the URL is unchanged.
11. Reload the page (F5). Verify the issue persists — it was written
    to disk via the FSA.

### Pass criteria

- The folder picker opens on Chrome / Edge / Brave / Arc / Opera /
  Vivaldi. (Firefox shows the Alert.)
- The issue appears in all three views within 500 ms of the save.
- The issue persists across a reload.
- The editor's integrity-warning banner does **not** appear (the
  file was saved through the app, so the hash matches).
- The PAT field on the remote form is `autocomplete="off"`.

### Common pitfalls

- **Firefox:** The home screen's "Open local folder" button is
  disabled with an Alert — this is expected, not a regression.
- **Permissions revoked:** If the user previously denied access,
  Chromium will re-prompt. Verify by clicking the folder icon in the
  TopBar and selecting the folder again.
- **Permission revoked on reload:** With the FSA, some browsers
  forget the handle on a hard reload. The app should redirect to
  the home screen and show the recent folders list.
- **`.nomad.md/` is missing:** The app should redirect to `/wizard`
  with a clear error message. Verify by opening a folder without
  `.nomad.md/`.

---

## UC-2 — Browse remote read-only

**Goal:** Validate Remote Mode (FR-5, FR-12, NFR-2).

### Pre-conditions

- A public repository on GitHub or GitLab with a `.nomad.md/`
  directory and at least one issue. (The fixture repo used in the
  ERS is a fine example.)
- For private repositories, a Personal Access Token with `repo` scope
  (GitHub) or `read_repository` scope (GitLab).

### Steps

1. Click **Open remote** on the home screen.
2. Enter the URL (e.g. `https://github.com/owner/repo`).
3. Enter the branch (e.g. `main`).
4. Optionally enter a PAT.
5. Click **Open remote**.
6. The app transitions to `/remote`. The TopBar shows the URL and
   a "Remote (read-only)" badge.
7. Verify the issue list, the Kanban columns, the Gantt bars.
8. Verify the **+ New issue** and **Trash** affordances are **hidden**
   (read-only guards from 6E).
9. Drag a Kanban card from "Open" to "In progress". The drop should
   be a no-op with a tooltip "Read-only — open this issue locally to
   change its status".
10. Open an issue in the editor. Verify the **Save** and **Discard**
    buttons are disabled with a tooltip "Read-only — open locally to
    save".
11. Click **↻ Refresh** in the RemoteToolbar. The PAT prompt opens.
    Enter the PAT again; click **Refresh**.
12. Verify the data reloads. The "Last fetched: N min ago" indicator
    updates.

### Pass criteria

- The remote subtree loads within 2-3 seconds on a small repository.
- Drag-and-drop is a no-op in Remote Mode.
- Save / Discard are disabled in the editor.
- "Last fetched: just now" appears after a successful refresh.
- The PAT input is `autocomplete="off"` and is **never** written to
  `localStorage` or the URL.

### Common pitfalls

- **CORS proxy 502/504:** The proxy at `cors.isomorphic-git.org` is
  best-effort. If it returns an error, the RemoteToolbar shows the
  error in an Alert; the app should not crash.
- **PAT missing for private repos:** The remote-git adapter throws
  `RemotePatRequiredError`; the RefreshPatPrompt opens automatically.
- **Branch not found:** The remote-git adapter throws a typed error;
  the toolbar shows the error in an Alert.

---

## UC-3 — Kanban drag updates status + persists

**Goal:** Validate the Kanban drag-and-drop in Local Mode (FR-6,
NFR-4).

### Pre-conditions

- Local Mode active (UC-1 setup).
- At least one issue with status `open`.
- The LocalToolbar's "New issue" / "Trash" affordances are visible
  (confirms Local Mode, not Remote).

### Steps

1. Switch to the **Kanban** view (click the Kanban tab in the
   LeftRail).
2. Verify the columns match `config.statuses` from
   `.nomad.md/config.json`.
3. Drag a card from "Open" to "In progress".
4. Verify the card appears in the new column within 200 ms.
5. Reload the page (F5).
6. Verify the issue's `status` frontmatter field on disk is now
   `in_progress`. (Open the `.md` file in another editor.)
7. Click the card. Verify the editor opens with the right issue.
8. In the editor, the integrity warning should **not** show (the file
   was saved through the app, so the hash matches).

### Pass criteria

- The drag updates the issue's status.
- The status persists across reload.
- The integrity hash matches on reload (no false-positive
  integrity-warning banner).

### Common pitfalls

- **The card snaps back to the original column.** This means the
  drop was rejected by the `issuesStore.update` validation. Check
  the browser console — `validateIssue` returns a list of errors.
- **The column header tooltip "Read-only" appears.** You're in
  Remote Mode by accident. Sign out and re-open the folder.

---

## UC-4 — Gantt renders bars + dependency arrows

**Goal:** Validate the Gantt view (FR-6, NFR-4).

### Pre-conditions

- Local Mode active.
- At least one issue with `start_date` and `end_date` (or
  `duration_days`) set in the frontmatter.

### Steps

1. Switch to the **Gantt** view.
2. Verify the bars render with the right colours per type (read from
   `templatesStore.byType.get(type).color`).
3. Verify the dependency arrows for `blocks` / `depends_on`
   relations.
4. Click on a bar. Verify the editor opens with the right issue.
5. Tab to a bar. Press Enter. Verify the editor opens (NFR-4).
6. Open the textual fallback (the `<details>` element at the bottom
   of the page). Verify the table renders with id / title / type /
   status / group / start / end-or-duration columns.
7. With a non-dated issue (clear the `start_date` and `end_date`),
   verify the "No issues are scheduled yet" empty state.

### Pass criteria

- Bars are coloured by type.
- Dependency arrows render with the right source / target.
- The textual fallback `<details>` is keyboard-reachable (Tab → Enter
  → table).
- The empty state appears when no issues are dated.

### Common pitfalls

- **Bars overlap.** This is intentional in v0 (no layout polish for
  overlapping bars). Document but don't fail the smoke.
- **Long titles truncate.** The Gantt's title text has a truncation
  fallback; hover the bar for the full title in the tooltip.

---

## Keyboard-only smoke (NFR-4)

**Goal:** Validate that the app is operable without a mouse.

### Pre-conditions

- Local Mode active. Chromium-based browser.

### Steps

1. From the home page, Tab through every interactive element.
   Verify focus rings are visible on every focusable element.
2. Tab to **Open local folder**. Press **Enter**. Verify the FSA
   picker opens.
3. Pick a folder. Verify the app navigates to `/local`.
4. In the local view, Tab to a row in the list. Press **Enter**.
   Verify the editor opens.
5. In the editor, Tab through the form fields. Verify each has a
   visible label.
6. Press **Esc**. Verify the editor closes.
7. Switch to the Kanban view (Tab → LeftRail → Kanban tab → Enter).
8. Tab to a card. Press **→** (right arrow). Verify the card moves
   to the next column.
9. Switch to the Gantt view. Tab to a bar. Press **Enter**. Verify
   the editor opens.

### Pass criteria

- Every interactive element is reachable via Tab.
- Focus rings are visible (`:focus-visible` is honoured, not
  overridden).
- The editor's ESC shortcut closes the drawer.
- The Kanban arrow-key navigation moves cards between columns.
- The Gantt's Enter shortcut opens the editor.

### Common pitfalls

- **Tab order skips the search input.** This means the FilterBar's
  inputs aren't in the document order. Document the bug; don't fail
  the smoke.
- **Focus ring is invisible.** This means `focus-visible` is
  overridden by a more specific selector. Open an issue; document
  the surface.

---

## CSP smoke (per the 6L audit)

**Goal:** Validate that the production bundle is CSP-clean.

### Pre-conditions

- `pnpm build` (the `build/` directory exists).
- A static host that honours `static/_headers` (Netlify / Cloudflare
  Pages). For local testing, `npx netlify-cli dev` applies the
  headers from `_headers` automatically.

### Steps

1. Serve the production build: `pnpm preview` (Vite's preview server
   honours `_headers` via the `vite-plugin-sveltekit-guard` plugin in
   dev; for production parity, use `npx serve build` with a custom
   middleware that applies `_headers`).
2. Open the served URL in Chromium.
3. Open DevTools → Console. Filter for "Content Security Policy".
4. Verify **no CSP violations** are reported.
5. Open DevTools → Network. Click on one of the `.js` files
   downloaded by the page.
6. Verify the `<script>` tag in `index.html` has `integrity="sha384-…"`
   and `crossorigin="anonymous"`.
7. Edit the file (add a `//` comment at the top). Reload. Verify the
   browser blocks the script with an SRI mismatch error.
8. Try `eval('1')` in the console. Verify the browser blocks it with
   a CSP violation.
9. Try `fetch('https://example.com/')` in the console. Verify the
   browser blocks the request (not in `connect-src`).
10. Try `fetch('https://api.github.com/')`. Verify the browser
    allows the request.

### Pass criteria

- Zero CSP violations on a cold load.
- The SRI mismatch test triggers a browser block.
- `eval`, `Function`, `document.write` are blocked by CSP.
- `connect-src` allows `*.github.com` / `*.gitlab.com` only.

### Common pitfalls

- **The static host strips `_headers`.** GitHub Pages does not
  honour `_headers`. The CSP meta fallback in `src/app.html` only
  covers `frame-ancestors 'none'`; the other directives need the
  header. Document the gap; this is expected per the 6L audit.

---

## Theme smoke (FR-14)

**Goal:** Validate the three-way theme picker.

### Pre-conditions

- Local Mode active. Chromium-based browser.

### Steps

1. Click the theme toggle in the TopBar. Verify the theme flips.
2. Reload the page. Verify the theme persists
   (`localStorage['nomad.md.theme']`).
3. Open the **Settings panel** (gear icon in the TopBar).
4. Pick **System**. Verify the theme follows the OS preference.
5. Change the OS theme (Chrome DevTools → Rendering → "Emulate CSS
   prefers-color-scheme: dark" or light). Verify the app follows in
   real time.
6. Pick **Light**. Verify the app stays in light mode even when the
   OS theme is dark.
7. Pick **Dark**. Verify the app stays in dark mode even when the
   OS theme is light.

### Pass criteria

- The theme persists across reloads.
- The "System" preference follows the OS theme live.
- The "Light" / "Dark" preferences override the OS theme.

### Common pitfalls

- **No-flash theme bootstrap doesn't kick in.** This is the
  synchronous `<script>` in `src/app.html`. Verify it exists by
  viewing the page source; the `<script>` should be in `<head>`,
  before any `<link>` or `<style>`.
- **Theme doesn't persist.** Check `localStorage['nomad.md.theme']`
  in DevTools → Application.

---

## Integrity warning smoke (FR-15)

**Goal:** Validate that the integrity-warning banner appears when a
file is modified outside the app.

### Pre-conditions

- Local Mode active.
- A clean `.nomad.md/issues/0001-…md` file (saved through the app).

### Steps

1. Open the issue in the editor.
2. Save (the integrity hash is now in the frontmatter).
3. Without using the web app, open the file in another editor (e.g.
   VS Code). Modify a section body (e.g. add a paragraph to the
   "Description" section).
4. Reload the web app (F5). Verify the integrity warning banner
   appears in the main canvas (the global banner from 6C).
5. Open the issue in the editor. Verify the per-editor integrity
   warning also shows (the inline Alert in the EditorPanel header).
6. Click **Discard** in the editor. Verify the warning disappears
   (the editor reverts to the on-disk state, and the on-disk state
   now has a different hash — but the warning fires against the
   _saved_ hash, which is the disk hash, so it clears).
7. Save the issue through the web app. Verify the warning
   disappears permanently.

### Pass criteria

- The global integrity-warning banner appears on reload.
- The per-editor integrity warning appears when the issue is opened.
- Discard clears the warning.
- A save through the web app clears the warning permanently.

### Common pitfalls

- **The hash doesn't recompute.** This means the service layer's
  `computeIntegrityHash` is broken — open an issue. Document it.
- **The banner appears on every reload.** This means the
  integrity-warning detection is broken — open an issue.

---

## Filter URL sync smoke (FR-7 + 6I)

**Goal:** Validate that the filter state is serialised to the URL
query parameter and restored on page load.

### Pre-conditions

- Local Mode active. Chromium-based browser.

### Steps

1. In Local Mode, set a search filter in the FilterBar (e.g.
   "smoke").
2. Verify the URL updates to `?q=smoke` (within 150 ms — the
   debounce is 100 ms).
3. Reload the page. Verify the filter is restored.
4. Clear the filter. Verify the URL drops the `?q=…` parameter.
5. Set a status filter via the dropdown. Verify the URL updates
   to `?status=open`.
6. Combine filters: search + status + type. Verify the URL is
   `?q=…&status=…&type=…`.
7. Use the browser's back button. Verify the filter swaps back.
8. Use the forward button. Verify the filter swaps forward.

### Pass criteria

- The URL updates within 150 ms of a filter change.
- The filter is restored on reload.
- Back / forward navigation re-applies the prior filter.
- The URL never contains the `?` trailing when the filter is
  empty.

### Common pitfalls

- **The URL doesn't update.** Check the console for errors; the
  `FilterUrlSync` component relies on `history.replaceState`.
- **The URL updates too aggressively.** The 100 ms debounce should
  prevent a write per keystroke.

---

## Reporting results

When the human reviewer has run the smoke, the results live in this
file's companion: `docs/smoke-tests/step-6-results.md`. Fill in:

- Date / reviewer name.
- Browser + version for each smoke.
- Pass / Fail per smoke.
- Any deviations from the expected behaviour, with screenshots or
  copy-paste of the relevant DevTools output.

If the smoke fails, attach the DevTools console output and any
screencast / screenshots to the issue. The verification chain
(`pnpm check && pnpm lint && pnpm test && pnpm build && pnpm audit`)
is the floor; the smoke is the ceiling.
