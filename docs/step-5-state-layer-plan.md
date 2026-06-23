# Step 5 — State Layer Implementation Plan

> **Tier:** S+
> **Methodology:** SPARC-GOAP (Specification → Pseudocode → Architecture → Refinement → Completion)
> **Scope source:** `docs/current-project-status.md` §Step 5 (lines 254–307) + ERS §5 (lines 410–489)
> **Goal state:** a runes-based state layer that is the single source of truth for the UI, with ≥80% coverage, zero filesystem leaks, PAT never reactive, and `pnpm check && pnpm lint && pnpm test` green.

---

## A. SPARC Specification — Goal State

### A.1 Current state (post-Step 4)

- `src/lib/adapters/**` complete (DirectoryAdapter, FSA, memory-fs, handle-store, renderer, remote-git, errors, feature-detect, trash, \_logger).
- `src/lib/services/**` complete (slugs, integrity, parser, serializer, validator, config-loader, template-loader, issue-loader).
- `tests/services/` has 56 unit + 10 integration tests, all green.
- Adapter coverage 72.7%, services 84.94%.
- `parser.ts` still uses `gray-matter` default YAML schema (audit carry-over).
- `js-yaml` is pinned at `^4.2.0` already (line 59 of `package.json`); `cookie` upgrade pending.

### A.2 Goal state (Step 5 Done)

| Dimension                      | Target                                                  |
| ------------------------------ | ------------------------------------------------------- |
| Files created                  | 9 under `src/lib/state/`, 9 under `tests/state/`        |
| Lines per store (avg)          | 80–220 (small focused modules)                          |
| Test cases                     | ≥3 per store, ≥8 for `issues`; total ≥40 new tests      |
| Coverage on `src/lib/state/**` | ≥80% lines, ≥75% branches                               |
| `pnpm check`                   | 0 errors, 0 warnings                                    |
| `pnpm lint`                    | clean                                                   |
| `pnpm test`                    | green, no skipped tests                                 |
| `pnpm audit`                   | 0 advisories after `pnpm.overrides` for `cookie@^0.7.0` |
| `pnpm build`                   | succeeds, no bundle-size regression                     |
| `console.*` calls in state     | **0**                                                   |
| `as unknown as` casts in state | **0**                                                   |
| Direct filesystem access       | **0** — all I/O via services                            |
| PAT exposure                   | **0** — only `{ hasRemoteCredentials: boolean }`        |
| `yaml.JSON_SCHEMA` on parser   | **enforced**                                            |

### A.3 Acceptance tests (must pass before PR merge)

1. `pnpm audit` exits 0 after overrides applied.
2. `pnpm coverage` shows `src/lib/state/**` at ≥80%.
3. `rg "console\.(log|warn|error|info|debug)" src/lib/state` returns nothing.
4. `rg "as unknown as" src/lib/state` returns nothing.
5. `rg "fetch|writeTextFile|readTextFile|showDirectoryPicker" src/lib/state` returns nothing (only services may call adapter I/O).
6. `rg "pat|PAT|token" src/lib/state` returns only the `hasRemoteCredentials` getter.
7. Every store factory has a matching `tests/state/<name>.test.ts`.
8. `issuesStore.save()` round-trip via `MemoryFsAdapter` regenerates integrity hash on every save; no stale hash on reload.
9. `filterStore` round-trips through `URLSearchParams` losslessly (FR-7).
10. `themeStore` and `viewStore` survive a full reload via `localStorage`.

---

## B. SPARC Pseudocode — Action Sequence

```
B.1 OVERRIDES & SECURITY PRIMITIVES   (commit 1: "chore(deps): override cookie>=0.7.0")
   B.1.1  add pnpm.overrides { cookie: ^0.7.0 }
   B.1.2  run pnpm install && pnpm audit  → expect 0 advisories
   B.1.3  parser.ts → matter(text, { engines: { yaml: { schema: JSON_SCHEMA } } })
   B.1.4  add test "parser refuses YAML merge keys" (merge-key payload)

B.2 FOUNDATION: src/lib/state/_context.ts   (commit 2: "feat(state): adapter context + guard helpers")
   B.2.1  define StateContext { adapter: DirectoryAdapter; signal: AbortSignal }
   B.2.2  createStateContext(adapter, signal?)  factory
   B.2.3  assertBrowser(): asserts `window` is defined (called from effects only)
   B.2.4  debouncedSave(): returns a cancellation-aware debouncer

B.3 MODE STORE   (commit 3)
   B.3.1  enum Mode = 'home' | 'local' | 'remote'
   B.3.2  reactive: mode, activeHandle (FSAFileSystemDirectoryHandle, NOT a rune of PAT), recentHandles
   B.3.3  derived: hasRemoteCredentials (boolean ONLY)
   B.3.4  actions: bootstrap(), openLocalFolder(handle), openRemote({url, branch, pat}), switchFolder, signOut
   B.3.5  effect: on cold start, queryPermission → if denied, mode='home' + non-blocking toast
   B.3.6  PAT consumed inside action closure, dropped on return (NFR-2)

B.4 CONFIG STORE   (commit 4)
   B.4.1  reactive: config (LoadedConfig | null), status ('idle' | 'loading' | 'error')
   B.4.2  actions: load(), refresh()
   B.4.3  effect: refetch when modeStore.mode changes
   B.4.4  guard: abort previous load via AbortController on mode change

B.5 TEMPLATES STORE   (commit 5)
   B.5.1  reactive: templates (Template[]), byType (Map<type, Template>) via $derived
   B.5.2  actions: load(), reload()
   B.5.3  derived: requiredFieldsByType, sectionNamesByType

B.6 ISSUES STORE   (commit 6 — heaviest)
   B.6.1  reactive: issues (LoadedIssue[]), dirty (Set<id>), pendingSaves (Map<id, Promise>), errors (Map<id, ValidationError[]>)
   B.6.2  $state.raw for issues (avoid deep proxy thrash on 100s of files)
   B.6.3  actions:
          - load(): parallel via Promise.all, per-issue try/catch, partial-failure surface
          - create(input): nextIssueId via service, write via writeTextFile, push to issues
          - update(id, patch): mark dirty, recompute integrity in-memory (NOT yet written)
          - save(id): validate → serialize → writeTextFile → refresh LoadedIssue in list
          - delete(id): moveToTrash + remove from list
          - discard(id): revert dirty state to last saved
   B.6.4  derived: issuesByStatus (grouped), issuesByAssignee, issuesWithIntegrityWarnings, indexById
   B.6.5  guards: pendingSaves map serializes per-id writes (no concurrent writes to same file)
   B.6.6  $effect (browser only): debounced auto-save 1500ms after last edit, abortable

B.7 FILTER + VIEW + THEME   (commit 7)
   B.7.1  filterStore: URL <-> $state via $effect (popstate + replaceState), serializable POJO only
   B.7.2  viewStore: 'list' | 'kanban' | 'gantt', persisted to localStorage (NFR-14 family)
   B.7.3  themeStore: 'light' | 'dark', persisted to localStorage.nomad.md.theme

B.8 EDITOR STORE   (commit 8)
   B.8.1  reactive: activeId, draft (deep clone of LoadedIssue), isDirty, integrityWarning
   B.8.2  actions: open(id), close(), patchField(key, value), patchSection(name, md), save(), discard()
   B.8.3  derived: validationErrors (from issuesStore.validate(activeId))
   B.8.4  $effect when activeId changes: deep-clone the LoadedIssue into draft

B.9 BARREL + SMOKE   (commit 9)
   B.9.1  src/lib/state/index.ts: re-export factories + types ONLY (no module singletons)
   B.9.2  one integration test wiring all stores against MemoryFsAdapter

B.10 VERIFY   (commit 10)
   B.10.1 pnpm check && pnpm lint && pnpm test && pnpm coverage && pnpm audit
   B.10.2 update docs/current-project-status.md — Step 5 marked Done
   B.10.3 update AGENTS.md if any new convention emerges
```

---

## C. SPARC Architecture — File-by-File Plan

> Convention: every store exports a `createXxxStore(ctx: StateContext)` factory plus a type. **No module-level singletons.** This keeps stores testable, SSR-safe (defensive), and prevents accidental cross-test contamination.

### C.0 Shared scaffolding

**`src/lib/state/_context.ts`** (~60 LOC, internal)

- `interface StateContext { adapter: DirectoryAdapter; signal?: AbortSignal }`
- `createStateContext(adapter, signal?)` factory.
- `assertBrowser()` — throws a `StateError('not-in-browser')` if `typeof window === 'undefined'`. Used by `$effect` bodies that touch IndexedDB / localStorage.
- `debouncedSave(fn, delayMs)` — returns `{ schedule(), cancel() }`. The `schedule()` call is idempotent and tracks an internal `AbortController` for the in-flight `fn`.

**`src/lib/state/errors.ts`** (~40 LOC)

- `class StateError extends Error`
- `class StoreNotReadyError extends StateError` — thrown when `configStore.get()` is called before `load()` resolves.
- `class ConcurrentSaveError extends StateError` — surfaces a UI toast when a second save is attempted before the first settles.
- Discriminated `type StateErrorKind = 'not-in-browser' | 'not-ready' | 'concurrent-save' | 'aborted'`.

### C.1 Mode store

**`src/lib/state/mode.ts`** (~150 LOC)

```ts
export type Mode = 'home' | 'local' | 'remote';

export interface RemoteCredentials {
  readonly url: string;
  readonly branch: string;
  /** PAT lives ONLY in the closure passed to openRemote(). Never read after return. */
}

export interface ModeStore {
  readonly mode: Mode;                                     // $state
  readonly activeHandle: FileSystemDirectoryHandle | null;
  readonly recentHandles: readonly HandleRecord[];         // $state
  readonly hasRemoteCredentials: boolean;                  // $derived — PAT-safe
  readonly bootstrap: () => Promise<void>;
  readonly openLocalFolder: (handle: FileSystemDirectoryHandle) => Promise<void>;
  readonly openRemote: (creds: RemoteCredentials, pat: string) => Promise<void>;
  readonly switchFolder: () => Promise<void>;
  readonly signOut: () => Promise<void>;
}

export function createModeStore(ctx: StateContext): ModeStore { ... }
```

- **Reactive split:** `mode`, `activeHandle`, `recentHandles` are `$state` (mutated by actions). `hasRemoteCredentials` is `$derived(() => remoteSession !== null)` where `remoteSession` is a module-private `let` inside the factory closure — never a rune.
- **Bootstrap flow** (`$effect.root`): read IndexedDB active handle → `queryPermission({ mode: 'readwrite' })` → grant ⇒ `mode = 'local'`; deny ⇒ `mode = 'home'` + toast; no record ⇒ `mode = 'home'`.
- **PAT hygiene:** the `openRemote(creds, pat)` signature receives `pat` as a parameter, uses it inside `remote-git.fetchSubtree({ ..., onAuth: () => ({ username: pat }) })`, then drops the local `pat` binding. There is no `pat: string` property anywhere on the store object. The audit's `_logger` redactor is the last line of defense.
- **Tests:** `tests/state/mode.test.ts` — bootstrap resolves to `'local'` when IndexedDB has a valid handle; to `'home'` when permission denied; PAT never reachable from store API; `recentHandles` capped at 5 with FIFO eviction.

### C.2 Config store

**`src/lib/state/config.ts`** (~110 LOC)

```ts
export interface ConfigStore {
  readonly config: LoadedConfig | null;
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
  readonly error: Error | null;
  readonly load: () => Promise<void>;
  readonly refresh: () => Promise<void>;
}

export function createConfigStore(ctx: StateContext, deps: { mode: ModeStore }): ConfigStore { ... }
```

- `$effect(() => { if (deps.mode.mode !== 'home') void store.load(); })` — auto-refetch on mode change.
- Each `load()` creates a fresh `AbortController`; the previous one is aborted on supersede.
- `load()` calls `loadConfig(ctx.adapter)`, catches `AdapterNotFoundError` → `config = null` (fresh repo, wizard path per FR-11); rethrows other errors into `status='error'`.

### C.3 Templates store

**`src/lib/state/templates.ts`** (~110 LOC)

- Mirrors config-store shape: `templates: Template[]`, `byType: $derived(Map<string, Template>)`.
- `load()` via `loadTemplates(adapter)`.
- `$derived` chains: `requiredFieldsByType`, `sectionNamesByType` — used by the editor's validation surfacing (C.8).
- `reload()` is the public action called after FR-11 wizard writes new templates.

### C.4 Issues store (heaviest)

**`src/lib/state/issues.ts`** (~280 LOC)

```ts
export interface IssuesStore {
  readonly issues: readonly LoadedIssue[];                       // $state.raw
  readonly dirty: ReadonlySet<IssueId>;                          // $state
  readonly pendingSaves: ReadonlyMap<IssueId, Promise<void>>;   // $state
  readonly errors: ReadonlyMap<IssueId, readonly ValidationError[]>;
  readonly byId: ReadonlyMap<IssueId, LoadedIssue>;              // $derived
  readonly byStatus: ReadonlyMap<Status, readonly LoadedIssue[]>; // $derived
  readonly integrityWarnings: readonly LoadedIssue[];             // $derived

  readonly load: () => Promise<void>;
  readonly create: (input: CreateIssueInput) => Promise<IssueId>;
  readonly update: (id: IssueId, patch: IssuePatch) => void;     // in-memory only
  readonly save: (id: IssueId) => Promise<void>;
  readonly discard: (id: IssueId) => void;
  readonly remove: (id: IssueId) => Promise<void>;                // moves to trash
  readonly validate: (id: IssueId) => readonly ValidationError[];
}

export function createIssuesStore(
  ctx: StateContext,
  deps: { config: ConfigStore; templates: TemplatesStore }
): IssuesStore { ... }
```

**Why `$state.raw` for `issues`:** A 200-issue repo with `$state` would proxy every nested section array. `$state.raw` skips deep proxying; we replace the array reference on each mutation and let Svelte's reactivity propagate by identity. Section-level edits go through `editorStore` and re-enter via a fresh `LoadedIssue` object on save.

**Concurrency:** `pendingSaves` is the per-id lock map. A second `save(id)` call awaits the in-flight promise instead of issuing a parallel write. Saves to _different_ ids run concurrently. `update()` while a save is pending marks dirty and is folded into the next save — no lost writes.

**Integrity recompute:** every save goes through `serializeIssue → writeTextFile`. The serializer recomputes `integrity_hash` from the canonical form. After write, the on-disk file is re-parsed to refresh the cached `LoadedIssue` (parser recomputes and validates; if integrity matches, `integrityWarning` stays `false`).

**`load()` failure mode:** partial-load is allowed (a malformed file does not block the rest). Per-file errors are surfaced via `errors: Map<id, ValidationError[]>`. The store exposes `errors.get(id)` for the UI to render.

**Tests:** ≥8 cases covering load partial-failure, create idempotency on `nextIssueId`, update→save round-trip via `MemoryFsAdapter`, dirty/clean toggle, concurrent save serialization, integrity recompute, remove→trash.

### C.5 Filter store

**`src/lib/state/filter.ts`** (~130 LOC)

- Reactive POJO mirroring `?status=open&assignee=…&label=…&type=…&q=…` (FR-7 — search query, filters).
- `$effect.root` listens to `popstate`; on change, parses `URLSearchParams` → `filter` state. On `filter` mutation, calls `history.replaceState` to keep URL in sync without spamming history.
- Serialization is **lossless**: `URLSearchParams → FilterState → URLSearchParams` round-trip is a property test (`*.spec.ts` in the client project).
- `clear()` resets to `{}` and removes the query string.

### C.6 View store

**`src/lib/state/view.ts`** (~60 LOC)

- `view: 'list' | 'kanban' | 'gantt'`, persisted to `localStorage.nomad.md.view`.
- `$effect.root` reads existing value on bootstrap; default `'list'`.
- `$effect` writes through on every change (debounced 100ms to avoid thrash).

### C.7 Theme store

**`src/lib/state/theme.ts`** (~50 LOC)

- `theme: 'light' | 'dark'`, persisted to `localStorage.nomad.md.theme`.
- `$effect` writes through on every change.
- `toggle()` action; on bootstrap, if no value, reads `prefers-color-scheme`.

### C.8 Editor store

**`src/lib/state/editor.ts`** (~180 LOC)

```ts
export interface EditorStore {
  readonly activeId: IssueId | null;
  readonly draft: LoadedIssue | null;
  readonly isDirty: boolean;
  readonly integrityWarning: boolean;
  readonly errors: readonly ValidationError[];

  readonly open: (id: IssueId) => void;
  readonly close: () => void;
  readonly patchField: (key: keyof Issue, value: FrontmatterValue) => void;
  readonly patchSection: (name: string, markdown: string) => void;
  readonly save: () => Promise<void>;        // delegates to issuesStore.save(activeId)
  readonly discard: () => void;
}

export function createEditorStore(
  ctx: StateContext,
  deps: { issues: IssuesStore; config: ConfigStore; templates: TemplatesStore }
): EditorStore { ... }
```

- `open(id)` clones `issues.byId.get(id)` into `draft`. `$state` on `draft` is a deep proxy (a single issue is small enough — ~few KB).
- `patchField` / `patchSection` mutate `draft` and set `isDirty = true`.
- `errors` is `$derived(() => activeId ? deps.issues.validate(activeId) : [])`. The validate call re-runs whenever `draft` changes because Svelte 5 tracks deep reads.
- NFR-7 satisfied: a `save()` failure reverts `draft` to the last saved snapshot (kept in a module-private variable) so the in-memory editor state is preserved while the user is shown the error.

### C.9 Barrel

**`src/lib/state/index.ts`** (~30 LOC)

```ts
export type { Mode, ModeStore, RemoteCredentials } from './mode.ts';
export { createModeStore } from './mode.ts';
export type { ConfigStore } from './config.ts';
export { createConfigStore } from './config.ts';
export type { TemplatesStore } from './templates.ts';
export { createTemplatesStore } from './templates.ts';
export type { IssuesStore, CreateIssueInput, IssuePatch } from './issues.ts';
export { createIssuesStore } from './issues.ts';
export type { FilterStore, FilterState } from './filter.ts';
export { createFilterStore } from './filter.ts';
export type { View, ViewStore } from './view.ts';
export { createViewStore } from './view.ts';
export type { Theme, ThemeStore } from './theme.ts';
export { createThemeStore } from './theme.ts';
export type { EditorStore } from './editor.ts';
export { createEditorStore } from './editor.ts';
export { StateError, StoreNotReadyError, ConcurrentSaveError } from './errors.ts';
export type { StateErrorKind } from './errors.ts';
```

**No module-level singletons.** The `src/routes/+layout.svelte` (Step 6) will instantiate one set of stores per app mount and pass them via context. This is the canonical Svelte 5 idiom and the only pattern that survives HMR cleanly.

---

## D. SPARC Refinement — Test Plan

All tests in `tests/state/` belong to the **server** Vitest project (Node + `MemoryFsAdapter`). No browser needed — stores are pure logic.

| Store     | File                | Cases (≥) | Highlights                                                                                                                                                                                                                    |
| --------- | ------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mode      | `mode.test.ts`      | 4         | bootstrap from IDB; permission-denied → home; PAT never reachable; recent FIFO at 5                                                                                                                                           |
| config    | `config.test.ts`    | 3         | load happy path; missing file → null + status ready; mode-change refetch                                                                                                                                                      |
| templates | `templates.test.ts` | 3         | load happy path; reload after wizard write; byType derived correctness                                                                                                                                                        |
| issues    | `issues.test.ts`    | 10        | load partial-failure; create increments id; update marks dirty; save round-trip; concurrent save serializes; integrity recompute; remove→trash; validate surfaces errors; byStatus grouping; $state.raw replacement semantics |
| filter    | `filter.test.ts`    | 4         | URL parse → state; state → URL replaceState; clear; round-trip property                                                                                                                                                       |
| view      | `view.test.ts`      | 2         | persist to localStorage; read on bootstrap                                                                                                                                                                                    |
| theme     | `theme.test.ts`     | 2         | persist to localStorage; toggle updates DOM attribute                                                                                                                                                                         |
| editor    | `editor.test.ts`    | 5         | open clones; patchField sets dirty; save delegates; discard reverts; errors derived from validate                                                                                                                             |
| errors    | `errors.test.ts`    | 2         | `assertBrowser()` throws in node; `ConcurrentSaveError` discriminated shape                                                                                                                                                   |

Coverage target: ≥80% lines, ≥75% branches across the whole `src/lib/state/**`.

**Integration test (1):** `tests/state/integration.test.ts` — wires `mode + config + templates + issues + editor` against a `MemoryFsAdapter` seeded with ERS Appendix B.6 data. End-to-end: open repo → create issue → edit → save → reload → integrityWarning false → close.

---

## E. SPARC Refinement — Security & Audit Carry-overs

| Audit item (current-project-status.md §Security) | Step 5 resolution                                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Force `yaml.JSON_SCHEMA` in `parser.ts`          | Commit B.1.3 — `matter(text, { engines: { yaml: { schema: JSON_SCHEMA } } })`. Test added in B.1.4 verifies merge keys are refused.                                     |
| No PAT in `$state(...)` rune                     | `modeStore.openRemote(creds, pat)` consumes `pat` inside closure only. Type signature forbids a `pat: string` property on `ModeStore`. Lint rule to be added (see F.1). |
| Logger redactor wraps state-layer `console.*`    | Zero `console.*` calls in state layer. If any are added in the future, they go through `_logger.safeLog`.                                                               |
| `pnpm.overrides` for `js-yaml@^4.2.0`            | Already at `^4.2.0` in `package.json` (line 59). Verify with `pnpm why js-yaml`.                                                                                        |
| `pnpm.overrides` for `cookie@^0.7.0`             | Commit B.1.1 — add override, run `pnpm install`, run `pnpm audit` to confirm 0 advisories.                                                                              |
| `console.*` and `as unknown as` absent           | Enforced via `rg` in verification (A.3 items 3-4). Could become an ESLint rule; not blocking.                                                                           |

---

## F. SPARC Refinement — Sequence & PR Breakdown

Each commit below leaves `pnpm check && pnpm lint && pnpm test` green.

1. **chore(deps): override cookie >=0.7.0** — B.1.1 + B.1.2. Audit clean.
2. **fix(security): force yaml.JSON_SCHEMA in parser** — B.1.3 + B.1.4. 1 new test.
3. **feat(state): context + error primitives** — C.0 + C.errors. 2 tests.
4. **feat(state): mode store** — C.1. 4 tests.
5. **feat(state): config store** — C.2. 3 tests.
6. **feat(state): templates store** — C.3. 3 tests.
7. **feat(state): issues store** — C.4. 10 tests.
8. **feat(state): filter/view/theme/editor stores** — C.5–C.8. 13 tests.
9. **feat(state): barrel + integration test** — C.9. 1 integration test.
10. **docs: Step 5 marked Done in current-project-status.md** — A.3 verified, all green.

PR body template includes:

- Closes #<issue> (when one exists).
- "Step 5 of v0 plan — State Layer (runes-based stores)."
- Audit carry-over checklist with each box ticked.

---

## G. Risk Register

| #   | Risk                                                                   | Likelihood | Impact | Mitigation                                                                                                                                 |
| --- | ---------------------------------------------------------------------- | :--------: | :----: | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `$state.raw` on `issues` breaks SvelteKit HMR or `$derived` reactivity |     M      |   H    | Property test for `byId`/`byStatus` derived values after a `replace` mutation. HMR-tested manually before commit 7 lands.                  |
| 2   | Auto-save `$effect` runs in non-browser (SvelteKit prerender/Node)     |     L      |   H    | Every `$effect` body that touches IDB/localStorage is gated on `assertBrowser()`. Lint rule forbids bare `localStorage` access in state.   |
| 3   | Concurrent writes race on the same id (user clicks Save twice rapidly) |     M      |   M    | `pendingSaves: Map<id, Promise>` lock + `ConcurrentSaveError` fallback. Integration test asserts second call awaits first.                 |
| 4   | PAT leaks via Svelte DevTools or store snapshot serialization          |     L      |   H    | PAT only in action closure; store API exposes `hasRemoteCredentials: boolean`. Add `__patAccessor` Symbol to detect accidental exposure.   |
| 5   | URL sync effect fights the browser back/forward (popstate loop)        |     M      |   M    | `replaceState` only (never `pushState`); effect compares against `lastSerialized` before calling. Use Svelte's `untrack()` for the read.   |
| 6   | Coverage misses subtle branches (try/catch arms in `load()`)           |     M      |   L    | Explicit error-path tests for `loadIssues` partial failure and `loadConfig` missing file. Coverage threshold enforced in CI script.        |
| 7   | Runes cross-store composition creates circular reactive updates        |     L      |   M    | Dependency graph is one-way: `mode → config/templates → issues → editor`. No back-edges. Lint rule: stores only read from declared `deps`. |
| 8   | `MemoryFsAdapter` test fixture drifts from `LocalFsAdapter` behavior   |     L      |   M    | Existing integration test (Step 4) already exercises both paths; Step 5 adds one more E2E across both adapters.                            |

---

## H. Definition of Done (Step 5)

- [ ] All 10 commits in §F merged in order with green checks.
- [ ] `pnpm audit` exits 0.
- [ ] `pnpm coverage` shows `src/lib/state/**` ≥80%.
- [ ] All 10 acceptance tests in §A.3 pass.
- [ ] `docs/current-project-status.md` updated with Step 5 marked Done.
- [ ] `AGENTS.md` updated if any new convention emerged (e.g. "stores never import from `$lib/adapters/_logger`").
- [ ] No `// FIXME` / `// TODO` left in `src/lib/state/**`.

Ready for Step 6 (UI layer) which is, per the locked-in scope, a presentation exercise on top of this state layer.
