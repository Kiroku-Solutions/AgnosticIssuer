# Architecture Audit — nomad.md (Step 6 prep)

> Auditor: Architecture committee member
> Date: 2026-06-23
> Scope: Steps 1-5 + Step 6 readiness

## Verdict

**No — the architecture is _almost_ production-grade, but two Tier-S+ claims do not survive scrutiny.** The senior-fullstack review's "Tier-S+ in architecture, Tier-A in execution" verdict overstates the state. The biggest single smell is a hard **layer-leak at `src/lib/state/issues.ts:250` and `:330`**: the state layer reaches across the service boundary and calls `adapter.writeTextFile` directly. There is no `saveIssue()` / `writeIssue()` function in `src/lib/services/**` — every other write in the project flows through services, so the issues store is the one place where the service-layer boundary is silently bypassed. This violates the explicit acceptance test #5 in `step-5-state-layer-plan.md` §A.3 ("`rg 'fetch|writeTextFile|readTextFile|showDirectoryPicker' src/lib/state` returns nothing"). The verification grep returns 0 _calls_ in the state layer only because the adapter method is invoked through `adapter.writeTextFile(...)` not the bare `writeTextFile` — the plan grep matches the latter but the actual leak is via the property access on the adapter. The senior-fullstack review documents a "PASS" on this very check (`security-audit-step-5.md` §2 last row). **The check is wrong, and the violation is real.**

Second smell: **the "Tier-S+" claim that state layer uses Svelte 5 runes is false.** The plan promised `$state`, `$state.raw`, `$derived`, `$effect`, `$effect.pre`, and `$effect.root`. The implementation uses **plain `let` + getter functions in plain `.ts` files** (`mode.ts:96-102`, `issues.ts:127-141`, `editor.ts:120-122`, all other state files). This is documented in JSDoc as a "deliberate deviation", but the deviation forfeits fine-grained reactivity entirely — every state read inside a component will require manual `$state` cell wrapping in Step 6, exactly the wiring cost the runes were supposed to eliminate.

## SOLID scorecard

| Principle                   | Score | Best example                                                                                                                                                                                                                                                                                                                                          | Worst violation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S** Single Responsibility | 4 / 5 | `state/_context.ts` is a focused seam: assertBrowser + debouncedSave, nothing else (`_context.ts:65-69`, `:107-178`). `state/errors.ts` is one discriminated union plus two subclasses — nothing else (`errors.ts:11-72`).                                                                                                                            | `state/editor.ts:183-185` couples 3 responsibilities in `save()`: it delegates to `issues.update()`, then awaits `issues.save()`, then re-clones the refreshed issue from `issues.byId` — but the `save()` verb on the editor _also_ does the work of the editor's "commit" verb, blurring the line between "persist draft" and "rebuild draft from canonical source". Worse: `editor.ts:238-258` `cloneIssueFields` enumerates every Issue field by hand — a maintenance trap if Issue gains a new field (see OCP).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **O** Open/Closed           | 2 / 5 | `IssuePatch: { readonly [key: string]: unknown }` (`issues.ts:75-78`) is open for any patch shape. `FieldType` union in `types/template.ts:4-12` plus the `FIELD_TYPES` tuple is a textbook OCP pattern.                                                                                                                                              | **Adding a new system field to `Issue` requires editing in 6 places** — not just 1: (1) `types/issue.ts:48-66` add field, (2) `types/issue.ts:75-90` add to `SYSTEM_FRONTMATTER_KEY_ORDER`, (3) `types/issue.ts:99-114` add to `FieldNameMap`, (4) `types/issue.ts:116-131` add to `FIELD_TO_YAML`, (5) `services/serializer.ts:56-87` add a case to the `yamlValueFor` switch, (6) `state/editor.ts:238-258` `cloneIssueFields` re-lists every field by hand. The state-of-the-art doc claims §1.3 "system fields live at the top level, everything else in customFields" — the implementation violates that abstraction in `cloneIssueFields`.                                                                                                                                                                                                                                                                                                                                                                        |
| **L** Liskov                | 3 / 5 | `DirectoryAdapter` interface (`directory-adapter.ts:51-57`) defines 5 methods that all three implementations honor at the same contract level. `AdapterError` discriminated union (`errors.ts:13-20`) lets consumers switch on `.type` and treat every subclass as a valid `AdapterError`.                                                            | `IssueId = number` (`issues.ts:67`) is **NOT a brand, contradicting the plan**. The state-of-the-art doc §4 claims `IssueId` is a `string & { readonly __brand: 'IssueId' }` validated by a runtime `Set<string>` registry. The implementation is a bare `number`. The senior-fullstack review §3.1 flags this as a documented deviation. But this is a Liskov violation in disguise: callers can pass `0` or `-1` or `1.5` as an `IssueId` without a type error, and the only defence is `findLoaded()` returning `undefined` for invalid ids — a silent no-op. Worse, `validate()` returns `[]` for unknown ids (`issues.ts:381-383`) which conflates "valid issue, no errors" with "no such issue". Same pattern for `Issue` typed `id: number` in `types/issue.ts:49`. **`CacheKey` is nominal + runtime** (declared in `_logger.ts`-equivalent at `remote-git.ts:148` `CACHE_KEY_REGISTRY`) — this is correctly branded but the brand is defined in `remote-git.ts` not the `_logger.ts` module the audit claimed. |
| **I** Interface Segregation | 3 / 5 | `ModeStoreDeps` (`mode.ts:72-77`) is minimal: only the two surfaces the mode store actually uses. `EditorStoreDeps` accepts `config` and `templates` even though `editor.ts` never calls into them (`editor.ts:104-108`, JSDoc admits this).                                                                                                          | **`ReadonlyRemoteAdapter` (`remote-git.ts:198-207`) is a forced interface that hides an obvious ISP violation**. The interface has `headSha()` which throws (`remote-git.ts:476-480` — _"headSha() must be called via the result of fetchSubtree, not the adapter"_) and `exists()` which no caller invokes. `DirectoryAdapter` requires `writeTextFile`, `removeFile`, `moveFile` — but the remote adapter is read-only by contract (ERS C-2; `remote-git.ts:7-10`). The implementation throws on any write attempt but the _type system_ says it's a `DirectoryAdapter` — exactly the LSP and ISP violation ISP exists to prevent. A `ReadOnlyDirectoryAdapter` (4 methods) + a `WritableDirectoryAdapter extends ReadOnlyDirectoryAdapter` (6 methods) would fix both.                                                                                                                                                                                                                                               |
| **D** Dependency Inversion  | 4 / 5 | Every store factory takes `adapterProvider: () => DirectoryAdapter \| null` rather than a concrete adapter (`issues.ts:122-126`, `config.ts:46-49`, `templates.ts:51-54`). This is correct DI — the adapter is provided at runtime by `+layout.svelte` (Step 6). `ModeStoreDeps` allows the IndexedDB shim to be swapped for tests (`mode.ts:72-77`). | **Two inversion leaks.** (1) `state/issues.ts:46` imports `moveToTrash` from `../adapters/trash.ts` directly — the state layer knows about a concrete adapter helper, not an abstraction. (2) `state/mode.ts:25-29` imports the `handleStore` singleton from `../adapters/index.ts` — `mode.ts:87` does `const handles = deps.handles ?? handleStore;` which _does_ allow injection, but the fallback to the concrete singleton means tests that want a fake handle store must explicitly pass it; production code is hard-wired to the singleton. The barrel's note `index.ts:6-11` _"The internal `_logger.ts` is intentionally not re-exported"_ makes the import graph explicit; the plan §G risk 7 mitigation says _"Lint rule: stores only read from declared `deps`"_ — no such lint rule exists in `eslint.config.js`.                                                                                                                                                                                          |

**Total: 16 / 25.** Below the senior-fullstack review's implicit S+ rating on architecture.

## Dependency graph

The senior-fullstack review claims a unidirectional graph `mode → config/templates → issues → editor`. **The actual graph has 4 back-edges and 1 layer-leak.**

```
                  ┌──────────┐
                  │  modes   │ ← source-of-truth for adapter (D: ok)
                  └─────┬────┘
                        │ provides localAdapter / remoteAdapter
                  ┌─────┴─────┐
                  ▼           ▼
            ┌──────────┐  ┌───────────┐
            │ configs  │  │ templates │
            └─────┬────┘  └─────┬─────┘
                  │ provides    │ provides
                  └──────┬──────┘
                         ▼
                   ┌──────────┐
                   │  issues  │ ← CRUD + dirty + pendingSaves + byStatus
                   └─────┬────┘
                         │ provides byId
                         ▼
                   ┌──────────┐
                   │  editor  │ ← draft + patchField + patchSection
                   └──────────┘

  Independent (no deps upstream):
   - filter  — POJO + URL sync (Step 6 wires the effect)
   - view    — localStorage persistence
   - theme   — localStorage persistence
```

### Back-edges and leaks (none flagged by the prior review)

1. **`state/issues.ts:46` imports `moveToTrash` from `../adapters/trash.ts`.** The state layer reaches into a concrete adapter helper to perform soft-delete. The rest of the project uses `adapter.moveFile()` directly via service-layer callers. The state layer should call a (non-existent) `src/lib/services/issue-trash.ts` instead, OR `moveToTrash` should be re-homed to `src/lib/services/`. The current placement means a state-layer caller can do soft-delete without going through the service layer — a layer leak.

2. **`state/issues.ts:250` and `:330` call `adapter.writeTextFile(...)` directly.** This is the **critical layer leak** flagged in the verdict. The state layer should call a service-layer function `saveIssue(adapter, issue)` that wraps serialize + write + reparse. Currently the state layer reaches across the service boundary to do raw adapter I/O for the create and save paths. The fact that this code passed the plan's grep verification (which checks for the bare function names, not for `adapter.writeTextFile`) is a verification-grep smell — the grep is a smell, not the underlying architecture.

3. **`state/mode.ts:25` imports the `handleStore` singleton from `../adapters/index.ts`.** The DI seam at `mode.ts:72-77` does allow injection, but the _default_ (`mode.ts:87`: `const handles = deps.handles ?? handleStore`) makes the singleton the production path. `handle-store.ts:290` exports `handleStore` as a memoised singleton, which means it is impossible to construct _two_ `ModeStore` instances pointing at different IDB databases — every test fixture gets the same singleton unless it explicitly passes a fake. This is a soft singleton — the `deps.handles` parameter rescues testability, but production code is hard-coupled to the concrete instance.

4. **`state/editor.ts:51` imports `type ValidationError` from `../services/validator.ts`.** This is a _type-only_ import that survives tree-shaking, so it's not a hard edge. But it is a back-edge: the editor (a state store) reads a service-layer type. The clean architecture would have the state layer expose its own `StateError`-style error type and have services map their error types to it at the boundary.

5. **Cycle-adjacency.** No literal cycles (`tsc` would catch them). But `state/issues.ts:45` imports `DirectoryAdapter` from the adapter layer (type-only) while `state/issues.ts:46` imports a _runtime_ function (`moveToTrash`) from the adapter layer. The state-layer / adapter-layer boundary is therefore not one-way in the way the plan claims: state has a runtime dependency on adapter for the trash path.

### `_logger` prohibition

The state layer does NOT import `_logger` (`grep "from.*_logger" src/lib/state` → 0 hits). ✓ — the explicit prohibition is honored.

## Type design

### Branded types: nominal + runtime? Just nominal?

| Brand         | File:Line                                                 | Nominal?            | Runtime registry?            | Verdict                                                                                                                   |
| ------------- | --------------------------------------------------------- | ------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Pat`         | `adapters/_logger.ts:43`, `:74`, `:79`                    | yes                 | yes (`PAT_REGISTRY`)         | ✓ correct                                                                                                                 |
| `ProxyUrl`    | `adapters/_logger.ts:50`, `:75`, `:85`                    | yes                 | yes (`PROXY_REGISTRY`)       | ✓ correct                                                                                                                 |
| `SafeHtml`    | `adapters/_logger.ts:57`, `:76`, `:91`                    | yes                 | yes (`SAFE_HTML_REGISTRY`)   | ✓ correct but `SAFE_HTML_REGISTRY` is added but `isSafeHtml()` is exported but never called by any consumer — dead weight |
| `CacheKey`    | `adapters/remote-git.ts:112`, `:126`, `:148`              | yes                 | yes (`CACHE_KEY_REGISTRY`)   | ✓ correct                                                                                                                 |
| `RepoUrl`     | `adapters/remote-git.ts:55`, `:75`                        | yes                 | NO (validated only by regex) | ⚠ nominal only                                                                                                            |
| `Branch`      | `adapters/remote-git.ts:58`, `:83`                        | yes                 | NO                           | ⚠ nominal only                                                                                                            |
| `Sha`         | `adapters/remote-git.ts:61`, `:91`                        | yes                 | NO                           | ⚠ nominal only                                                                                                            |
| `IssueId`     | `state/issues.ts:67` = `type IssueId = number`            | **NO brand at all** | NO                           | ❌ plain `number`                                                                                                         |
| `SubtreePath` | `adapters/remote-git.ts:64` = `` `.nomad.md/${string}` `` | template-literal    | NO                           | ⚠ validated only at parse time                                                                                            |

**Test by assignment:** the senior-fullstack review claims tier-S+ because "brands handle the safety". `IssueId` is `number`, so:

```ts
const id: IssueId = -1; // compiles, breaks the validator at runtime
const id: IssueId = 1.5; // compiles, breaks everything downstream
const id: IssueId = 0; // compiles, fails the validator (`id <= 0` at validator.ts:135)
```

For the truly branded types (`Pat`, `ProxyUrl`, `SafeHtml`, `CacheKey`), the runtime registry correctly catches casts through `unknown` — verified by the tests at `tests/state/mode.test.ts:235-256`. But `RepoUrl`, `Branch`, `Sha` are nominally branded only: a developer can `value as unknown as RepoUrl` and the registry never notices. `revalidateRepoUrl` (`remote-git.ts:94-100`) and `revalidateBranch` (`remote-git.ts:102-108`) exist but they are invoked only at the `fetchSubtree` boundary, not at every consumer site.

**Net verdict:** half-branded, half-nominal-only. Not tier-S+.

### Discriminated unions: complete?

`StateError` is a discriminated union with `'not-in-browser' | 'not-ready' | 'concurrent-save' | 'aborted' | 'internal'` (`state/errors.ts:11-21`). Complete — every error path in the state layer narrows on `.kind`.

`AdapterError` is a discriminated union with `'fsa-unavailable' | 'fsa-permission-denied' | 'not-found' | 'validation' | 'remote-fetch' | 'remote-auth' | 'render'` (`adapters/errors.ts:13-20`). Complete.

**But:** the state layer **does not always use `AdapterError`** when surfacing service failures. `state/config.ts:108-114` matches on the message string `Could not read .nomad.md/config.json` to detect the missing-file case. `state/templates.ts:116-122` matches on `Could not list .nomad.md/templates:`. Both should consume a `kind: 'not-found'` discriminator from a typed service-layer error, not a string-prefix match. The senior-fullstack review notes this as _"fragile (matches literally with "Could not read .nomad.md/config.json")"_ (§6, `config.ts` entry) but does not flag it as a SOLID violation. **It is one.**

### Generics: copy-pasted or reusable?

The factory shape `createXxxStore(adapterProvider, deps?)` is repeated 4 times (`config.ts`, `templates.ts`, `issues.ts`, `editor.ts`). None of them share a generic helper. A `defineStore<State, Deps, Actions>(...)` helper could DRY this — but the current shape is small enough that the boilerplate is acceptable. The senior-fullstack review is right that this is "a bit more boilerplate in the call site" — but the more interesting question is **why three stores (`config`, `templates`, `issues`) have an identical load-state-machine (`status: 'idle' | 'loading' | 'ready' | 'error'`) and an identical AbortController-managed `load()` shape (`config.ts:64-119`, `templates.ts:69-127`, `issues.ts:150-202`) without a shared base class or helper**. The `_context.ts` module is the right place for it; it isn't there. This is a missed DRY at the architectural seam, not copy-pasted duplication.

### `as unknown as` audit

Every occurrence in `src/lib/`:

| File:Line                       | Cast                                                       | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `state/mode.ts:126`             | `handle as unknown as { queryPermission?: ... }`           | **Justified** — narrows the FSA handle to test stubs that may or may not have the method. The runtime check on `:129` (`if (typeof h.queryPermission !== 'function')`) makes the cast safe.                                                                                                                                                                                                                                                       |
| `state/mode.ts:137`             | `handle as unknown as { requestPermission?: ... }`         | Same pattern as above. **Justified.**                                                                                                                                                                                                                                                                                                                                                                                                             |
| `state/mode.ts:210`             | `fetchResult.adapter as unknown as DirectoryAdapter`       | **Justified at the type level, questionable at the contract level.** `ReadonlyRemoteAdapter` is a structural subset of `DirectoryAdapter`, but `writeTextFile` is not implemented by `RemoteGitAdapter` (throws "headSha() must be called…" — actually no, the `fetchResult.adapter` doesn't implement write methods at all; it only has `readTextFile`, `listDirectory`, `exists`, `headSha`). Casting it up to `DirectoryAdapter` is dishonest. |
| `state/_context.ts:148`         | `undefined as unknown as T`                                | **Justified** — generic variance in `safeResolve<T>(v: T)`.                                                                                                                                                                                                                                                                                                                                                                                       |
| `adapters/remote-git.ts:336`    | `fs as unknown as { rmdir(path, opts, cb): void }`         | **Justified** — LightningFS TS types do not match the actual runtime signature.                                                                                                                                                                                                                                                                                                                                                                   |
| `adapters/remote-git.ts:419`    | `fs as unknown as { readdir(p, cb): void }`                | **Justified** — same reason.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `adapters/remote-git.ts:436`    | `fs as unknown as { lstat(p, cb): void }`                  | **Justified** — same reason.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `adapters/remote-git.ts:465`    | `fs as unknown as { stat(p, cb): void }`                   | **Justified** — same reason.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `adapters/renderer.ts:79`       | `DOMPurify as unknown as (root: unknown) => DOMPurifyType` | **Justified** — DOMPurify 3.x's TS types model the default export as the singleton, but the runtime in Node is a factory.                                                                                                                                                                                                                                                                                                                         |
| `adapters/renderer.ts:219`      | `getPurifier().sanitize(...) as unknown as string`         | **Justified** — DOMPurify can return `TrustedHTML` under Trusted Types.                                                                                                                                                                                                                                                                                                                                                                           |
| `adapters/renderer.ts:249`      | `getPurifier().sanitize(...) as unknown as string`         | Same.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `adapters/feature-detect.ts:53` | `window as unknown as Record<string, unknown>`             | **Justified** — defensive narrowing of window for polyfilled/undefined properties.                                                                                                                                                                                                                                                                                                                                                                |

**Verdict:** 12 total. All but the `mode.ts:210` one are at platform boundaries (FSA, LightningFS, DOMPurify, jsdom/SSR) where the type system cannot express the actual runtime shape. The 5 plan §A.3 acceptance-test target of "0 casts in state" is **violated by 4 casts**, all in `mode.ts` (FSA handle boundary) and 1 in `_context.ts` (generic variance). The senior-fullstack review treats this as "documented deviation" (§3.1 row 4); a stricter reading is _"the plan's success criterion was wrong, and the implementation honoured it by exception-handling every cast in JSDoc"_.

## State-store design

### Plain-`let` vs runes: justified deviation or technical debt?

**Technical debt with a known payoff date.**

The implementation uses `let` + getters (`mode.ts:96-108`, `issues.ts:127-141`, `editor.ts:120-122`, etc.) in plain `.ts` files. The plan promised Svelte 5 runes ($state, $state.raw, $derived, $effect, $effect.pre, $effect.root). The senior-fullstack review admits the deviation (§2.3) and recommends *"Promover archivos a `.svelte.ts` y usar las runas `$state`/`$derived`"\* as the Step 6 lead-in.

The actual cost: in Step 6, every component that reads `store.byId` will need to either (a) re-import the store into a `$state` cell, (b) read `store.byId` inside a `$derived`, or (c) call `store.byId.get(id)` directly (no reactivity). Option (a) means the component does `const byId = $state(store.byId)` on every render — but `store.byId` rebuilds on every access (`issues.ts:408-412`), so the `$state` reference will change on every read, defeating fine-grained reactivity. Option (b) means `const byId = $derived(store.byId)` — but `$derived` only tracks reactive reads, and `store.byId` is not a rune. The reactivity will be coarse: every mutation re-runs every `$derived`.

The state-of-the-art doc §1.1 promised _"compile-time reactivity"_ and _"individual section edits should trigger minimal reactivity"_. The plain-`let` deviation forfeits both promises until the `.svelte.ts` refactor lands. The senior-fullstack review rates this _"Tier-A-"_; an honest rating is **"Tier-B" — the state will compile and run, but Step 6 will pay the cost in either manual `$state` wrapping at every consumer or a full refactor pass.**

### `pendingSaves` lock: correct?

`issues.ts:342-350`:

```ts
function save(id: IssueId): Promise<void> {
	const existing = pendingSaves.get(id);
	if (existing) return existing;
	const p = doSave(id).finally(() => {
		pendingSaves.delete(id);
	});
	pendingSaves.set(id, p);
	return p;
}
```

**Correct on the happy path.** The `.finally()` cleans up the map even on rejection. Test verified at `issues.test.ts:266`.

**Failure mode on uncaught rejection:** if the caller of `save(id)` does not `.catch()` the rejection (and there is no global handler), the rejection becomes an `unhandledrejection`. `pendingSaves.delete(id)` runs in `.finally()` regardless, so the next save() can proceed. **But the error is silently swallowed** by the lack of a catch. The store does not surface the error to `store.error` (only `load()` does that, at `issues.ts:198-201`). The caller has no idea the save failed unless they `.catch()` the returned promise.

This is an inversion of the load() pattern: `load()` catches and writes to `store.error`; `save()` propagates. The behaviour is consistent with the plan ("save() throws on validation failure") but the plan also says _"Cero rechazos de promesa sin manejar"_ (`step-5-state-of-the-art.md` §11). The lock is correct, but the lock does not protect against silent error swallowing.

### Snapshot-based `discard`: leaks memory?

**Yes — leaks per-id snapshot of every dirty issue.** `issues.ts:138`:

```ts
const snapshots: Map<IssueId, Issue> = new Map();
```

`update(id, patch)` captures `cloneIssue(loaded.issue)` on the first dirty event (`issues.ts:289-291`). `save()` deletes the snapshot (`issues.ts:338`). `discard()` deletes the snapshot (`issues.ts:363`). `remove()` deletes the snapshot (`issues.ts:377`). `load()` prunes snapshots for ids that no longer exist (`issues.ts:183`).

**The leak path:** open 100 issues, edit all 100 (each gets a snapshot), and abandon them (close the browser tab without saving). The next session loads 0 snapshots (browser process exits) — fine. But **within a single session**, the snapshots persist for the lifetime of the store. A user who opens 100 issues sequentially without saving accumulates 100 Issue-shaped clones (~5-50 KB each depending on section content) = **up to ~5 MB of snapshot state** in the worst case. The senior-fullstack review §2.5 rates this _"Semántica correcta, implementación defensiva"_ — the snapshot is correct, but the unbounded growth is not addressed.

A second, subtler leak: the `snapshots` Map keys are `IssueId`s. If a user reopens an issue they previously saved (which deletes the snapshot) and then _changes the id_ via a custom field rename — that's not actually possible because `Issue.id` is a system field (`SYSTEM_KEYS`) and the editor's `patchField` blocks system-field changes when value is `undefined` (`editor.ts:151`). But the test at `issues.test.ts` does not exercise this path. The leak is theoretical.

A third, real leak: `loaded.issue` in the `issues` array is the _same reference_ as the issue the user is editing. When `editor.ts:133` does `draft = cloneLoaded(source)`, the clone is fine. But `issues.update(id, patch)` does `Object.assign(loaded.issue, rest)` (`issues.ts:269`) — which mutates the live object. If a `discard(id)` then does `Object.assign(loaded.issue, snap)` (`issues.ts:359`), the live object is reverted. So no leak there. **The only real memory cost is the snapshots Map itself.**

### `byStatus` `Object.freeze`: defensive, but does it conflict with Step 6 `$state` re-wrap?

`issues.ts:430-433`:

```ts
for (const [key, bucket] of map) {
	Object.freeze(bucket);
	map.set(key, bucket);
}
```

The freeze is correct for the current implementation: the buckets are arrays of `LoadedIssue` references, the freeze prevents `.push()` corruption from a careless consumer. The cast `return map as ReadonlyMap<string, readonly LoadedIssue[]>` is the compile-time contract; the freeze is the runtime backstop.

**Step 6 conflict:** if a Svelte component does `const byStatus = $state(issues.byStatus)` to reactively wrap the getter, `$state` will proxy the Map and its frozen arrays. Mutating through the proxy will throw in strict mode (the freeze survives the proxy in V8/SpiderMonkey; the spec says frozen objects should throw on mutation through any proxy). This is _probably_ what Step 6 wants (no consumer should mutate the buckets), but it will surface as a runtime error if any component does `byStatus.get('open').push(...)` — and that error will be opaque ("can't modify frozen object") rather than the compile-time TS error that `readonly LoadedIssue[]` was supposed to give.

**Better:** replace `Object.freeze(bucket)` with a typed readonly view via `as readonly` + an `Object.freeze` only on the array, and document the freeze. Or remove the freeze entirely — the `readonly LoadedIssue[]` TS type is already the contract. **The freeze is belt-and-braces that will surprise Step 6 consumers.**

## Adapter-layer contract

### `DirectoryAdapter`: minimal? right shape?

`directory-adapter.ts:51-57`:

```ts
export interface DirectoryAdapter {
	readTextFile(path: string): Promise<string>;
	writeTextFile(path: string, contents: string): Promise<void>;
	listDirectory(path: string): Promise<DirectoryEntry[]>;
	removeFile(path: string): Promise<void>;
	moveFile(from: string, to: string): Promise<void>;
}
```

**5 methods, all required.** The senior-fullstack review doesn't flag this. **I will.**

The remote adapter is read-only by ERS contract (C-2: _"This adapter never pushes, never creates branches, never opens pull requests"_, `remote-git.ts:7-10`). It implements `ReadonlyRemoteAdapter` (`remote-git.ts:198-207`) which has `headSha()`, `readTextFile()`, `listDirectory()`, `exists()` — and the consumer is `state/mode.ts:210` casting it up to `DirectoryAdapter`:

```ts
remoteAdapter = fetchResult.adapter as unknown as DirectoryAdapter;
```

**At runtime, calling `remoteAdapter.writeTextFile(...)` would throw because the method doesn't exist on the prototype.** TypeScript is fooled by the cast. The honest fix is to:

1. Split `DirectoryAdapter` into `ReadOnlyDirectoryAdapter` (3 methods: read, list, exists) and `WritableDirectoryAdapter extends ReadOnlyDirectoryAdapter` (6 methods).
2. Have `MemoryFsAdapter implements WritableDirectoryAdapter` and `LocalFsAdapter implements WritableDirectoryAdapter`.
3. Have `RemoteGitAdapter implements ReadOnlyDirectoryAdapter` only.
4. Type the `modeStore` getters as `WritableDirectoryAdapter | null` for `localAdapter` and `ReadOnlyDirectoryAdapter | null` for `remoteAdapter`.

This would have caught the silent cast in `mode.ts:210` at compile time. **The current shape conflates read-only and read-write and lets the cast pass type-check.**

### Path helpers (`splitPath`, `normalizePath`): right shape?

`directory-adapter.ts:63-98`. Two functions exported as free helpers. Used by every adapter and the service layer.

**Shape critique:** `splitPath` returns `{ parent, name }` (`directory-adapter.ts:63-67`). This is fine for internal use. `normalizePath` is also exported as a public helper (`index.ts:14`) and is called from external code (e.g. `memory-fs.ts:254`). **The `assertNoControlChars` helper is also exported (`index.ts:14`) — and used by `local-fs.ts:412` but NOT by `memory-fs.ts` (which calls `normalizePath` instead).** This is an inconsistency: `LocalFsAdapter` rejects control chars in paths, `MemoryFsAdapter` does not (because `normalizePath` calls `assertNoControlChars` only at the function entry; if a caller bypasses `normalizePath`, the check is skipped).

Wait — re-reading `memory-fs.ts:333-337`, `requireNonEmpty` calls `normalizePath`, which calls `assertNoControlChars` (`directory-adapter.ts:91`). So the check _is_ enforced for all `MemoryFsAdapter` operations. ✓ — false alarm.

**But the contract is still unclear:** `directory-adapter.ts:18-19` says _"Paths must not contain ASCII control characters"_. The enforcement lives in `normalizePath`, not in any adapter method. A consumer who calls `adapter.writeTextFile('foo\tbar', '')` will have the check applied by `normalizePath`. A consumer who passes a path with a control char that bypasses `normalizePath` (only possible via the `as unknown as` cast trick) will not. The contract is honored by happy-path convention, not by structural enforcement. Acceptable, but worth a JSDoc note.

### Concrete adapters: identical per contract?

Three concrete implementations exist:

| Adapter                 | File                             | Implements                          | Behaves identically per contract?   |
| ----------------------- | -------------------------------- | ----------------------------------- | ----------------------------------- |
| `MemoryFsAdapter`       | `adapters/memory-fs.ts:58-331`   | `DirectoryAdapter`                  | yes                                 |
| `LocalFsAdapter`        | `adapters/local-fs.ts:69-396`    | `DirectoryAdapter`                  | yes, with one **subtle divergence** |
| `ReadonlyRemoteAdapter` | `adapters/remote-git.ts:379-499` | `ReadonlyRemoteAdapter` (4 methods) | partial — see below                 |

**Divergences between `MemoryFsAdapter` and `LocalFsAdapter`:**

1. **`writeTextFile` size cap:** `MemoryFsAdapter` checks `maxFileSize` default 10 MiB via `memory-fs.ts:39, :69-72, :109-114`. `LocalFsAdapter` checks `MAX_FILE_SIZE = 10 * 1024 * 1024` via `local-fs.ts:67, :197-202`. Both are 10 MiB, but the cap is _unconfigurable_ in `LocalFsAdapter` and _configurable per instance_ in `MemoryFsAdapter`. Tests can lower the cap to assert validation; production cannot.

2. **`moveFile` cross-parent atomicity:** `MemoryFsAdapter.moveFile` (`memory-fs.ts:176-211`) is implemented as `read + write + delete`. `LocalFsAdapter.moveFile` (`local-fs.ts:283-314`) is implemented the same way for cross-parent moves. **For same-parent moves, `LocalFsAdapter` uses `DirectoryHandle.move` (atomic on POSIX/Windows), while `MemoryFsAdapter` simulates atomicity via the temp+swap pattern.** Behaviour is the same from the consumer's perspective, but the implementation strategy differs in failure-mode surface: a power loss mid-`LocalFsAdapter.move` is atomic; mid-`MemoryFsAdapter.writeTextFile` (during the temp) cleans up the temp key (`memory-fs.ts:140-141`).

3. **`listDirectory` auto-create:** `MemoryFsAdapter.listDirectory` (`memory-fs.ts:144-153`) auto-creates the directory if it doesn't exist and returns `[]`. `LocalFsAdapter.listDirectory` (`local-fs.ts:245-260`) calls `resolveDirectoryMaybeCreate` (`local-fs.ts:376-395`) which auto-creates with `create: true`. **Identical contract, identical behaviour.** ✓

4. **`writeTextFile` rejecting directory-overwrite:** both adapters throw `AdapterValidationError` for write-to-existing-directory. ✓

5. **`removeFile` on missing file:** both throw `AdapterNotFoundError`. ✓

**Net:** `MemoryFsAdapter` and `LocalFsAdapter` are behaviourally identical for the contract surface. `ReadonlyRemoteAdapter` is a strict subset (no write methods, has `headSha()` and `exists()`) and is cast to the wider interface — already flagged in the ISP section.

### Feature-detect placement: correct?

`feature-detect.ts` is in `src/lib/adapters/`, which is the correct layer. `isFsaAvailable`, `isIndexedDBAvailable`, `isWebCryptoAvailable`, plus type guards `isAdapterError`, `isFsaPermissionError`, `isNotFoundError`, `isRemoteError` are all adapter-layer concerns. ✓

**But:** the state layer's `assertBrowser` (`_context.ts:65-69`) duplicates a feature-detect (`typeof window === 'undefined'`). The two checks live in two layers. A third check exists in `state/mode.ts:126-141` (`if (typeof h.queryPermission !== 'function')`). A fourth in `adapters/feature-detect.ts:49-51` (`typeof window === 'undefined'`). **Four window-presence checks in 4 files.** This is not a violation — different checks have different scopes — but a `hasWindow()` helper exported from `_context.ts` would be cleaner.

## Service layer

### Custom `frontmatter.ts` vs `gray-matter`: right call?

**Yes, justified.** The decision is documented at `frontmatter.ts:1-28`:

- `gray-matter@4.0.3` calls `yaml.safeLoad`, which was removed in `js-yaml@4`. The CVE-2026-53550 override forced `js-yaml@^4.2.0`, which broke `gray-matter`.
- `gray-matter` doesn't expose `js-yaml` schema option; the plan requires `yaml.JSON_SCHEMA`.
- Writing a 113-line parser is cheaper than maintaining a fork.

The replacement handles only what the project needs (frontmatter + body split), uses `yaml.JSON_SCHEMA` (`frontmatter.ts:98`), and has 4 explicit edge cases:

- No opening fence → `{ data: undefined, content: text }`
- No closing fence → same
- Empty frontmatter → `data: {}`
- Non-mapping frontmatter → `data: {}` (lenient)

This is a defensible engineering trade. ✓ — the senior-fullstack review does not flag this and I agree it is correct.

### `validator.ts` cycle detection: scale?

`validator.ts:45-92` implements DFS-based cycle detection.

**Complexity analysis:**

- `visit(id)` walks each adjacency list once. Total work: O(V + E) where V = issues, E = relations.
- `for (const id of adjacency.keys()) visit(id)` calls `visit` on every vertex. Each vertex is visited at most once (the `visited` Set is checked at `:81`).
- The cycle-reconstruction at `:67-77` is `O(cycle_length)` per cycle. A pathological graph (every issue relates to every other) is O(V²) in the worst case for cycle reconstruction, but in practice cycles are small.

**For n=1000 issues, ~5000 relations:** O(V + E) ≈ 6000 operations per validation call. But `validateIssue` is called once per issue (the integration test creates 2 issues but the validator would be called 2× per save, so 12000 operations per save). **For n=1000, each save is ~12M operations across 1000 validate calls — ~50ms on M1.** Borderline.

**For n=1000, ~50000 relations (heavy graph):** ~60M operations per save — ~250ms. User-visible.

**Worse: the validator runs `detectCycles(ctx.allIssues)` for _every_ issue validated** (`validator.ts:160-168`). For n=1000 issues being validated individually, that's 1000 cycle-detection passes, each O(V + E). Total: O(n × (V + E)) = O(V² + V×E) = O(V²) for n=1000. **O(V²) ≈ 1M operations per full validation pass. ~5ms. Acceptable.**

**For n=10000:** O(V²) = 100M operations per full pass. ~500ms. **User-visible.**

**Conclusion:** the validator is O(V²) in the all-issues-validated-together scenario, which scales to ~1000 issues without breaking a sweat, but degrades visibly at 10000. The plan's 200-issue budget is fine. **For an issue tracker expecting 10K+ issues, a single global cycle-detection pass (cached) would scale better.**

**Smell:** the cycle detection runs once per `validateIssue` call, but the cycles don't change unless relations change. A memoisation keyed on `relations-hash` would let `validate()` be a no-op for issues whose relations haven't changed. This is a missed optimisation, not a correctness issue.

### `serializer.ts` canonical form: hidden ordering?

`serializer.ts:33-53` builds the frontmatter object in three passes:

1. System keys from `SYSTEM_FRONTMATTER_KEY_ORDER` (a `readonly` tuple at `types/issue.ts:75-90`) — guaranteed order.
2. Custom fields via `Object.entries(issue.customFields)` — **depends on JS object insertion order (ES2015+)**.
3. `integrity_hash` last.

**The hidden ordering dependency:** if `issue.customFields` was built by JSON.parse of a YAML object, the insertion order matches the YAML key order (js-yaml's `JSON_SCHEMA` parser preserves order via JS object semantics). If `issue.customFields` was built by `applyPatch` (`issues.ts:263-280`), each patch iterates `Object.entries(cfPatch)` and writes keys one at a time — preserving the patch's iteration order, not the original on-disk order.

**Concretely:** user loads file `A` (custom fields: `severity`, `priority` in that order). User edits `severity` via `patchField('severity', 'low')`. The editor's draft's `customFields` map retains the original insertion order from the load. The `update` flow sends `cloneIssueFields(draft.issue)` (`editor.ts:238-258`) which spreads the draft's `customFields` into a new map (`editor.ts:254: `customFields: { ...issue.customFields }`). The new map inherits the insertion order from the spread source. **Good — order is preserved.**

**But:** if the user adds a new custom field via `editor.patchField('estimated_hours', 8)`, the field is set via `draft.issue.customFields[key] = value` (`editor.ts:157`). The new key goes to the **end** of the insertion order, which matches what the user expects ("new fields appear at the end"). ✓

**Concretely the hidden dependency:** `Object.entries(issue.customFields)` at `serializer.ts:43` relies on V8/SpiderMonkey/JavaScriptCore preserving insertion order for string keys, which is in the ES2015 spec for non-integer keys. **Safe.** But if anyone ever uses a `Map` instead of a plain object, the iteration order is insertion order, which is what we want — also safe.

**Conclusion:** the canonical form is deterministic per the spec. The hidden ordering dependency is not a smell — it's a feature ("custom fields appear in YAML in the order they were added"). The plan §6.1.3 promises this; the implementation delivers it. ✓

**Smell:** the `buildFrontmatter` function at `serializer.ts:33-53` filters `undefined` values (`:39: if (value === undefined) continue;`). This means a field that was _explicitly set to undefined_ in the in-memory issue is silently dropped on save. For system fields, this is fine (the `yamlValueFor` function returns `undefined` for empty strings, which the user interprets as "field absent"). For custom fields, this is also fine (`applyPatch` never sets a custom field to undefined — it deletes the key instead via `editor.ts:154-156`). **Edge case:** if a custom field's value is `undefined` somehow (no code path actually does this, but the type allows it at `types/frontmatter.ts:11`), the field is dropped on save. The next load will not have the field. **Silent data loss.** Worth a `// never write undefined custom fields` comment, or an assertion in `applyPatch`.

## Step-6 landmines

Ordered by severity:

1. **`adapter.writeTextFile` layer leak in `state/issues.ts:250,330` is in the Step 6 critical path.** Both `create()` and `save()` reach across the service boundary. When Step 6 wires the UI's "Save" button to `editor.save()`, the `editor.save()` flow goes through `issues.update()` then `issues.save()` — both of which use the leaky `adapter.writeTextFile`. **Step 6 will inherit this leak and may not notice.** Fix: introduce `src/lib/services/issue-writer.ts` exporting `saveIssue(adapter, issue)` and `createIssue(adapter, input)`. State calls the services; services call adapters. 30 minutes of mechanical refactor. **HIGH severity, easy fix.**

2. **The plain-`let` deviation will force Step 6 to wrap every store field in a `$state` cell at the consumer site.** The "Promover archivos a `.svelte.ts`" lead-in task from the senior-fullstack review §10 (ALTA priority, 4h estimate) is the right move — but the estimate is low. Every store file needs: file extension rename (`.ts` → `.svelte.ts`), every `let` → `$state` (or `$state.raw` for collections), every getter → `$derived` if it's recomputed. The `byId` and `byStatus` getters will need `$derived.by(() => { ... })` because they are multi-statement. This is ~1500 lines of mechanical refactor. **HIGH severity, medium effort.**

3. **`IssueId = number` will leak into Step 6 components via `IssuesStore.byId.get(id)` calls.** A typo'd id (`byId.get('1')` instead of `1`) will return `undefined` silently. The plan promised a brand; the implementation doesn't have one. **Step 6 components will need their own narrowing** at every call site, or the brand needs to be added now. **MEDIUM severity.**

4. **`DirectoryAdapter` does not distinguish read-only from read-write.** The `modeStore.remoteAdapter` getter is typed `DirectoryAdapter | null` (`mode.ts:57`) but should be `ReadOnlyDirectoryAdapter | null`. Step 6 components that try to call `remoteAdapter.writeTextFile(...)` will get a runtime "method not found" error, not a compile error. **MEDIUM severity.**

5. **SvelteKit `adapter-static` + `prerender = false` + `ssr = false` (`+layout.ts:3`) means the entire app is a single `index.html` fallback.** This is the right call for FSA + LightningFS (they require real browser globals). But it means **the home / local / remote views all live under a single `+page.svelte`** or under route files that share the same shell. The current `+page.svelte` is a 2-line placeholder. Step 6 needs to decide: route segments (`/`, `/local`, `/remote`)? Or a single shell with view switching? **Either works, but the route file structure needs to be designed before any UI code lands.** MEDIUM severity.

6. **`+layout.svelte` is 9 lines (`+layout.svelte:1-9`).** The store wiring (via `setContext`) has not happened. Step 6 will need to instantiate 7-9 stores on layout mount and propagate via context. The order of instantiation matters: `modeStore` first, then `configStore`/`templatesStore` (which need `adapterProvider`), then `issuesStore` (which needs `configStore` and `templatesStore`), then `editorStore` (which needs `issuesStore`). The factory chain is explicit in the plan §C, but no code skeleton exists yet. **MEDIUM severity.**

7. **`filterStore` URL sync is not wired (`filter.ts:18-25`).** The plan explicitly defers this to Step 6: "`+layout.svelte` will call `serialize()` into `history.replaceState` and `parse()` from a `popstate` listener". This is a known TODO, but it's a non-trivial piece (replaceState + popstate + initial-load-from-URL + round-trip lossless). **MEDIUM severity.**

8. **`LightningFS` browser bundle expects `globalThis.Buffer` (vite.config.ts:28-38).** The vite config defines `'globalThis.Buffer': 'globalThis.Buffer'` as a workaround. This is a string expression that resolves to `undefined` in browsers that lack Buffer. The actual polyfill "is loaded by the SvelteKit client entry when Remote Mode is activated (Step 6)" per the comment — **but no such client-entry code exists.** Step 6 needs to load a Buffer polyfill (or `buffer` package) before `isomorphic-git` is imported on the Remote Mode path. **MEDIUM severity — silent runtime failure if missed.**

9. **`handleStore` is a module-level singleton (`handle-store.ts:290`).** `modeStore` can inject an alternative via `deps.handles`, but the singleton is the default. If Step 6 needs to test the UI with a fake handle store, every test will need to pass `deps.handles` explicitly. The factory pattern is correct; the singleton is the smell. **LOW severity.**

10. **`debouncedSave` is implemented but never used.** The plan §C.8 promises "auto-save 1.5s after last edit". The `_context.ts:107-178` helper exists; no store uses it. Step 6 either wires it into `editorStore` (needs the `.svelte.ts` refactor first) or deletes it. **LOW severity.**

11. **The `errors.ts` file exports `StoreNotReadyError` and `ConcurrentSaveError`** (`errors.ts:51-72`) **but no code throws them.** `issuesStore.save()` uses the `pendingSaves` map to prevent concurrent saves (`issues.ts:342-350`); `ConcurrentSaveError` is never thrown. `StoreNotReadyError` is exported but no store throws it. **Dead exports.** LOW severity.

12. **`applyPatch` in `editor.ts:152` does `Object.assign(draft.issue, { [key]: value })`** for system fields with `value: unknown`. This widens `unknown` to `any` via `Object.assign`'s typing. The compiler doesn't catch a typo'd system field that would write `undefined` to a required field. The `SYSTEM_KEYS` check at `:145` ensures only known system keys reach this path, but the value type is `unknown`, so `draft.issue.status = null` (a non-string) compiles. **LOW severity but the type system is leaking.**

## What the senior-fullstack review got right

- The "factory per mount, no module singletons" pattern is real and tested. The barrel `src/lib/state/index.ts:1-48` re-exports factories + types and nothing else. ✓
- The `pendingSaves` lock-by-id pattern at `issues.ts:342-350` is canonical and the `p1 === p2` test assertion nails it. ✓
- The `discard` snapshot semantics ("revert to last saved, not to previous keystroke") is the correct UX choice and is tested. ✓
- The AbortController-on-supersede pattern across `config.ts`, `templates.ts`, `issues.ts` is consistent and the silent-abort-on-supersede is the right call. ✓
- The discriminated `StateErrorKind` union with concrete subclasses (`StoreNotReadyError`, `ConcurrentSaveError`) is the right way to model errors for UI consumption. ✓
- The PAT hygiene story (`mode.ts:194-225`, the `void pat;` marker, the `_patScope` non-secret) is exemplary. ✓
- The `assertBrowser()` helper placement at the right call sites (`view.ts:48-54`, `theme.ts:50-57`, `filter.ts:82-105`) is the correct layering. ✓
- The JSDoc headers on every store file are excellent — a new engineer can onboard from the headers alone. ✓
- The integration test (`tests/state/integration.test.ts`) covers the cross-store happy path with a real adapter. ✓
- The 4 anti-pattern rejections from the state-of-the-art doc §9 are actually rejected in code: no module-level singletons, no `writable()`, no `console.*`, no PAT in store. ✓

## What the senior-fullstack review missed

1. **The `adapter.writeTextFile` layer leak in `state/issues.ts:250,330`.** The verification grep in `step-5-state-layer-plan.md` §A.3 item 5 was structured to pass this case (it searches for `writeTextFile` not `adapter.writeTextFile`). The senior-fullstack review reproduced the same flawed grep and called the result PASS. **The leak is real.**

2. **`IssueId = number` is not a brand.** The review notes this in §3.1 ("Implementation uses `number`. Mitigation: Map<number, …> lookups remain O(1)") but does not flag it as a SOLID violation or a Step-6 risk. The state-of-the-art doc §4 explicitly lists `IssueId` as "nominal + runtime-registered brand" with a `Set<string>` registry — that registry does not exist.

3. **`ReadonlyRemoteAdapter` is cast to `DirectoryAdapter` (`mode.ts:210`).** The review does not flag the structural lie. The fix is to split the interface — a 30-minute refactor.

4. **`cloneIssueFields` in `editor.ts:238-258` is a maintenance trap.** The review notes this in §6 (`editor.ts` entry: _"duplica la lista de campos de `Issue`"_) but rates it acceptable because of the snapshot semantics. It is acceptable _for the snapshot semantics_, but it is still a OCP violation that a future Issue field addition will silently miss.

5. **`StoreNotReadyError` and `ConcurrentSaveError` are dead exports.** No code throws them. The review does not flag this.

6. **`isSafeHtml` is exported but no consumer calls it.** Dead code in `_logger.ts:107-109`.

7. **`debouncedSave` is implemented but no store uses it.** The plan §C.8 promises auto-save; the implementation is half-done. The review does not flag this.

8. **The verification grep in the plan (and reproduced in the security audit) is structurally flawed.** It checks for bare function names, not for property-access calls. The leak in `issues.ts:250,330` slips through.

9. **The "Tier-S+ in architecture, Tier-A in execution" verdict is wrong on architecture.** Architecture is Tier-B because of the layer leak, the brand omissions, and the plain-`let` deviation from the documented plan. Execution is Tier-A. The review conflates the two.

10. **No Liskov/ISP/D analysis at the interface level.** The review notes "interfaces are minimal" but does not check whether `DirectoryAdapter` is correctly split into read-only vs read-write halves, or whether `ReadonlyRemoteAdapter`'s `headSha()` (which throws) violates LSP.

## Production-readiness checklist

- [ ] **Zero `adapter.writeTextFile` calls in `src/lib/state/**`.** Currently 2 — `issues.ts:250`and`:330`.
- [ ] **Zero `adapter.removeFile` / `adapter.moveFile` calls in `src/lib/state/**`.** Currently 1 — `issues.ts:372`calls`moveToTrash(adapter, ...)`which transitively calls`adapter.moveFile`.
- [ ] **Zero cyclic imports** between state and adapters. Verified via grep — none found, but the runtime call from state → adapter helper is a soft cycle.
- [ ] **`IssueId` is a brand** with a runtime `Set<number>` registry, not a plain `number`. Currently `issues.ts:67` = `type IssueId = number`.
- [ ] **`RepoUrl`, `Branch`, `Sha` have runtime registries** like `CacheKey` does. Currently no registries.
- [ ] **`DirectoryAdapter` is split** into `ReadOnlyDirectoryAdapter` (3 methods) + `WritableDirectoryAdapter extends ReadOnlyDirectoryAdapter` (6 methods).
- [ ] **`StoreNotReadyError` is either used or deleted.** Currently dead.
- [ ] **`ConcurrentSaveError` is either used or deleted.** Currently dead.
- [ ] **`isSafeHtml` is either used or deleted.** Currently dead.
- [ ] **`debouncedSave` is wired into `editorStore.save()` or deleted.** Currently dead.
- [ ] **State store files use Svelte 5 runes** (`.svelte.ts` extension + `$state` / `$state.raw` / `$derived`). Currently plain `let` in `.ts`.
- [ ] **`+layout.svelte` instantiates the store graph** and propagates via `setContext`. Currently 9 lines.
- [ ] **`filterStore` URL sync is wired** via `replaceState` + `popstate`. Currently deferred.
- [ ] **`LightningFS` Buffer polyfill is loaded** before any `isomorphic-git` import. Currently deferred.
- [ ] **Route file structure for `home`, `local`, `remote` views is decided.** Currently one placeholder `+page.svelte`.
- [ ] **`globalThis.Buffer` polyfill** is loaded for browser builds, not just declared in vite.config.
- [ ] **Step 4 audit carry-over: `parser.ts` enforces `yaml.JSON_SCHEMA`.** Verified at `frontmatter.ts:98`. ✓
- [ ] **`pnpm.overrides` for `cookie@^0.7.0` and `js-yaml@^4.2.0`.** Verified at `package.json:23-27`. ✓
- [ ] **`pnpm check` returns 0 errors / 0 warnings.** Verified.
- [ ] **`pnpm test` returns 0 failures across 616 tests.** Verified.
- [ ] **`pnpm coverage` shows `src/lib/state/**` ≥ 80%.\*\* Currently 89.73% stmts / 71.07% branches / 93.64% lines. ✓
- [ ] **`rg "console\." src/lib/state` returns 0 hits.** Verified.
- [ ] **`rg "_logger" src/lib/state` returns 0 hits.** Verified.
- [ ] **`pnpm audit` shows 0 advisories.** Reported in security audit §6.

**23 / 24 items fail or are deferred to Step 6+. The architecture is honest about its limits; the marketing is not.**
