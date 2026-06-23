# Step 5 — State of the Art for Svelte 5 Runes-Based State

> **Tier:** S+
> **Audience:** senior engineer shipping Step 5 of the nomad\.md plan.
> **Goal:** ground every store decision in current (mid-2026) Svelte 5 best practice, with explicit rationale and citations to library/docs/PRs where useful. No legacy `svelte/store` patterns.

---

## 1. Why Svelte 5 runes are the right primitive here

### 1.1 What runes give us that `svelte/store` cannot

- **Compile-time reactivity.** A `$state(...)` call lowers to fine-grained signal writes — only the components / derivations that read the changed field re-run. `writable` (legacy) re-runs every subscriber on every `set`, even if they read a slice the writer didn't touch.
- **First-class deep reactivity.** `$state` proxies nested objects/arrays; mutations like `issues[0].sections[2].markdown = '...'` are tracked. `writable` of a plain object does not.
- **Native TypeScript inference.** `$state<T>(...)` and `$derived<T>(() => ...)` give you the inferred type for free; no separate `Readable<T>` boilerplate.
- **Cleanup-aware effects.** `$effect` automatically tracks dependencies and runs cleanup before re-execution; `onDestroy` inside a component is the closest legacy analog, but it does not run for plain modules.
- **No `get()` ceremony.** In a `.svelte` file you read `$state` directly: `issues.length`. With `writable`, every read outside a `.svelte` file requires `get(store)`. Stores-as-modules become painful.

### 1.2 When legacy `svelte/store` is still acceptable

- Interop with libraries that consume `Readable` (e.g. `svelte-dnd-action`). Step 6 may need a thin `$state → Readable` adapter for Kanban DnD — call out in the Step 6 plan; do not preempt here.

### 1.3 The "factory per app mount" pattern is canonical

> Reference: Svelte 5 docs, "Runes" → "Module-level reactive state" cautions against it; the recommended pattern is a factory called once per app, results passed via `setContext`/`getContext` or component props.

This is exactly the pattern Step 5 adopts. Every store exports `createXxxStore(ctx, deps?)`. The `+layout.svelte` (Step 6) will instantiate once and propagate. **No module-level singletons.** This makes:

- HMR work without state bleed between mounts.
- Tests trivial: `createIssuesStore(ctx, deps)` per `it(...)` block.
- SSR-safe (the static adapter makes this moot for our build, but defensive coding keeps the option open for preview-mode tests later).

---

## 2. Granularity choices per rune

### 2.1 `$state` vs `$state.raw`

- Use `$state` for `editorStore.draft` — a single issue is small (~few KB), deep proxying pays off, and individual section edits should trigger minimal reactivity.
- Use `$state.raw` for `issuesStore.issues` — a 200-issue repo × 5–10 sections each, deeply proxied, becomes a noticeable per-mutation cost. We replace the array reference on each mutation and read derived maps by identity.

Reference: the official Svelte 5 `$state.raw` docs explicitly call out this trade-off ("state is deeply reactive by default; pass `raw: true` if you want a non-reactive object that you manage yourself via reassignment").

### 2.2 `$derived` chains and granularity

- Keep `$derived` chains **short and referentially stable.** `byId`, `byStatus`, `integrityWarnings` are all `$derived(() => Map/Array built from issues)`. Svelte 5 caches by reference identity; rebuilding the Map on every issue edit is fine for v0 (max a few hundred issues) but document the bound.
- Use **`$derived.by(() => { ... })`** when the derivation has multiple statements (e.g. grouping + sorting).
- For computed values that depend on multiple stores, do **not** create circular `$derived` — wire them through `deps` in the factory. The architecture in `step-5-state-layer-plan.md` §C is intentionally one-directional: `mode → config/templates → issues → editor`.

### 2.3 `$effect` placement and cleanup

- **Only in stores that need runtime side effects:** `filterStore` (URL sync), `viewStore`/`themeStore` (localStorage persistence), `modeStore` (IDB handle resolution on cold start), `issuesStore` (debounced auto-save).
- **Always** wrap IDB / localStorage / `window` access in `assertBrowser()` (see `_context.ts`). The static adapter means we never _actually_ SSR, but defensive coding prevents future surprise breakage in preview mode or in `@vitest/browser-playwright` jsdom-injected tests.
- **`$effect.root(...)`** for effects that should outlive the calling component — used in `modeStore.bootstrap()` so the cold-start flow keeps listening after layout unmounts in dev.
- **`untrack(...)`** for reads inside effects that must not subscribe to (e.g. writing the current filter to `history.replaceState` should not re-trigger when the URL changes externally).

### 2.4 `$effect.pre` vs `$effect`

- `$effect.pre` runs before DOM updates; useful for `themeStore` setting `document.documentElement.dataset.theme` before paint (prevents FOUC on initial theme application). All other state effects use plain `$effect`.

---

## 3. Async coordination patterns

### 3.1 AbortController as a first-class signal

Every async action that may be superseded (`configStore.load`, `issuesStore.load`) creates a fresh `AbortController`. The previous one is aborted on supersede. Services throw a typed `AbortError` (or our own `StateError('aborted')`) that the store catches silently. This avoids a class of bugs where stale config overwrites newer config after a quick folder switch.

### 3.2 Per-id save serialization via a `pendingSaves` map

```ts
const pendingSaves = $state(new Map<IssueId, Promise<void>>());

async function save(id: IssueId): Promise<void> {
	const existing = pendingSaves.get(id);
	if (existing) return existing; // join in-flight
	const p = doSave(id).finally(() => {
		pendingSaves.delete(id); // cleanup
	});
	pendingSaves.set(id, p);
	return p;
}
```

This pattern is the de facto standard for serializing async writes per key without a global mutex. It composes with the rest of the store because the Map itself is reactive — UI can show a spinner keyed off `pendingSaves.has(id)`.

### 3.3 Debounced auto-save with cancellation

`editorStore.save()` (and a future "auto-save 1.5s after last edit" effect) use a small `debouncedSave(fn, delay)` helper:

- `schedule()` returns the in-flight promise (or creates a new one after `delayMs` of quiet).
- `cancel()` aborts the timer and the promise rejects with `StateError('aborted')`.
- The `$effect` cleanup calls `cancel()` so leaving the editor flushes nothing pending.

This is the minimum needed to satisfy "draft survives revoke/reload" (NFR-7) without ballooning into a full operational-transform engine.

---

## 4. Branded types & runtime validation at the state boundary

Step 4 already established `RepoUrl`, `Branch`, `Sha`, `CacheKey` as nominal + runtime-registered brands. Step 5 extends the pattern:

- `IssueId` is a `string & { readonly __brand: 'IssueId' }`. Every store that accepts an id validates via `isIssueId` (cheap `Set<string>` registry) at the public action boundary, mirroring `_logger.ts`.
- This is a tier-S+ tell: zero `as unknown as` casts in the state layer. The few places we _must_ bridge (e.g. `URLSearchParams.get('id')`) parse and brand in one step.

---

## 5. Security patterns specific to state

### 5.1 PAT hygiene (NFR-2)

- `pat: string` only appears as a parameter of `openRemote(creds, pat)` and is consumed inside `fetchSubtree({ ..., onAuth: () => ({ username: pat }) })`. The closure drops the binding on return.
- No `pat` field on any store. `hasRemoteCredentials: boolean` is the only public surface.
- Defense-in-depth: `_logger.redact()` would also strip a PAT-shape string from any future `console.*` call.

### 5.2 Schema hardening (audit carry-over)

- `parser.ts` switch to `yaml.JSON_SCHEMA` prevents arbitrary-type revival (timestamps, binary, etc.). The integration test for this lives next to the parser change (commit B.1.4 of the plan).
- The state layer's `issuesStore.load()` catches the new error path (`AdapterValidationError`) and surfaces a per-file error, not a global crash.

### 5.3 URL filter hardening

- `filterStore` validates each query value against a known set (status ∈ allowed enum, type ∈ templates, label ∈ catalog). Unknown keys are dropped, not echoed. This prevents a class of XSS / open-redirect-style bugs where a hostile `?url=…` could be smuggled into a downstream render. (Even though we already DOMPurify-sanitize markdown, defense-in-depth.)

---

## 6. Performance budgets

| Operation                                       | Budget                               | How we hit it                                                                                               |
| ----------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `issuesStore.load()` on 200 issues              | p95 < 250 ms on M1 / mid-tier laptop | Parallel `loadIssues` via `Promise.all(adapter.readTextFile(...))` (already in service); single parse pass. |
| `editorStore.patchField(key, value)` reactivity | p95 < 1 ms                           | Single-issue deep proxy; `$derived` for `errors` only re-runs validator, not the whole store.               |
| `filterStore` URL sync                          | < 5 ms per keystroke                 | `replaceState` only; no `JSON.parse` of the whole filter object on every change.                            |
| `themeStore.toggle()` initial paint             | No FOUC                              | `$effect.pre` sets `data-theme` on `<html>` before children mount.                                          |
| Memory: 200 issues resident                     | < 25 MB                              | `$state.raw` on `issues`; sections stored as strings, not parsed ASTs (renderer is on-demand).              |

These budgets are testable in `tests/perf/` (out of scope for Step 5 but the architecture leaves room).

---

## 7. Test architecture that matches the design

### 7.1 Per-store factories → trivial tests

Because every store is a factory taking `ctx` and `deps`, each test:

1. Creates a `MemoryFsAdapter` seeded with the minimum fixtures.
2. Constructs the store.
3. Asserts on the returned public surface.

No browser, no JSDOM, no Playwright. Tests are fast (<10 ms per case) and run in the **server** Vitest project alongside `tests/services/`.

### 7.2 Property tests for filter round-trip

`filterStore` deserves a fast-check / property test: for any `FilterState`, `parse(serialize(state)) === state`. This is the single best tier-S+ signal that URL sync won't silently drop a parameter.

### 7.3 Integration test wired across stores

`tests/state/integration.test.ts` (1 file, ~150 LOC):

- Construct `modeStore`, `configStore`, `templatesStore`, `issuesStore`, `editorStore` with cross-deps.
- Seed `MemoryFsAdapter` with ERS Appendix B.6 fixture.
- Walk: bootstrap → open → load → create → patch → save → reload → assert integrityWarning is `false`.

This is the "does it actually compose" smoke test.

---

## 8. Composition with the rest of the app

### 8.1 What Step 6 will consume

The UI layer (Step 6) reads stores via `getContext` in `+layout.svelte` and `getContext` again in nested components. Components are pure functions of state — they dispatch actions and render derivations. No `$effect` in components for state-mutation logic; effects live in stores.

### 8.2 What Step 7 will test

Step 7 (already planned in `current-project-status.md`) is mostly the service-layer test gap plus adapter memory-fs mock hardening. The state layer tests land inside Step 5 itself; Step 7 adds any e2e Playwright flows that need a real browser (FSA, IDB) — those belong to the **client** project.

### 8.3 What the audit will re-score

The audit scorecard in `current-project-status.md` lines 183–197 will tick up several boxes after Step 5:

- "PAT handling" stays at 5 (pattern is enforced, not just redacted).
- "Service validation" climbs to 5 (cycles + dangles + types all funneled through `issuesStore.validate`).
- "Trusted Types" can move from 2 to 3 once Step 6 ships the CSP template; Step 5 enables it by keeping DOM writes out of the state layer.

---

## 9. Anti-patterns we explicitly reject

| Anti-pattern                                                     | Why we reject                                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Module-level `let issues = $state([])`                           | Singleton; breaks HMR; untestable per-test.                                                    |
| `writable()` from `svelte/store` for new code                    | Legacy; coarser reactivity; verbose interop.                                                   |
| `as any` / `as unknown as IssueId`                               | Tier-S+ means zero untyped casts in state. Brands handle the safety.                           |
| `console.log` "for now, will remove later"                       | Audit item 3 forbids it; build fails the verification grep.                                    |
| Direct `localStorage.setItem` inside a component                 | Belongs in a store; one write site, one persistence format.                                    |
| Mutating `loadedConfig` from a `$derived`                        | `$derived` values are read-only by convention; the type system enforces it in Svelte 5.        |
| Putting a PAT on `window.__nomadPat = pat` "for the Git adapter" | Bypasses NFR-2 outright; the audit redactor would only catch it on console, not on the global. |
| `JSON.parse(localStorage.getItem('filter'))` at component mount  | Belongs in `filterStore.load()`; component just reads the rune.                                |
| Multiple stores reading each other directly (no `deps`)          | Breaks the dependency graph; makes mock ordering fragile. Factories take `deps` explicitly.    |

---

## 10. References (mid-2026)

- **Svelte 5 runes** — official docs, `$state`, `$state.raw`, `$derived`, `$derived.by`, `$effect`, `$effect.pre`, `$effect.root`, `untrack`. (svelte.dev/docs/svelte/$state etc.)
- **`AbortController` as a signal** — DOM Living Standard, WHATWG. Adopted wholesale across the web platform; no library needed.
- **Branded types in TypeScript** — pattern popularized by [`brand.ts`](https://github.com/piotrwitek/utility-types#brand) and `@total-typescript`. Our usage matches the `nominal + runtime registry` pattern from Step 4.
- **Operational transform / CRDT** — explicitly out of scope per ERS §9 ("single-user; concurrent edits out of scope"). We do not need Y.js / Automerge.
- **TanStack Query / SWR** — not applicable. We have no network read caching at the UI layer; `remote-git.fetchSubtree` is the only network surface and is owned by the adapter.
- **Zustand / Jotai signals** — referenced for cross-pollination only. Svelte 5 runes are the equivalent primitive in this codebase; pulling in another signal lib would be redundancy.

---

## 11. Tier-S+ checklist (the verification gates)

- [ ] Every store factory: `createXxxStore(ctx, deps?)` — no module singletons.
- [ ] `$state.raw` for collections ≥ ~50 items; `$state` for small deep objects.
- [ ] `$effect` only for runtime side effects; never for state mutation logic.
- [ ] `$effect.pre` for theme application to prevent FOUC.
- [ ] `untrack()` inside effects that read but must not subscribe.
- [ ] AbortController on every supersedable async action.
- [ ] Per-id `pendingSaves` lock map; never a global mutex.
- [ ] Branded types validated at the public action boundary.
- [ ] Zero `as any` / `as unknown as` in `src/lib/state/**`.
- [ ] Zero `console.*` in `src/lib/state/**`.
- [ ] Zero direct adapter I/O outside services.
- [ ] PAT appears only as an action parameter; never as a store property.
- [ ] `yaml.JSON_SCHEMA` enforced in `parser.ts`.
- [ ] `pnpm.overrides` for `cookie@^0.7.0` applied; `pnpm audit` clean.
- [ ] Coverage ≥80% on `src/lib/state/**`.
- [ ] All tests in `tests/state/` belong to the `server` Vitest project.
- [ ] One integration test wires all stores end-to-end against `MemoryFsAdapter`.

When this checklist is green, Step 5 is genuinely tier-S+ — and Step 6 becomes the calm, mechanical presentation work it should be.
