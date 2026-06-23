# Cybersecurity Audit — nomad.md (Step 6 prep)

> Auditor: Cybersecurity committee member
> Date: 2026-06-23
> Scope: Steps 1-5 + Step 6 readiness
> Branch: `step-6-ui-audit` @ `cba091f`
> Live verification: `pnpm audit` → 0 advisories; `pnpm vitest run` → 616/616; `pnpm check` → 0 errors / 0 warnings; `pnpm lint` → 2 unrelated `docs/audits/*.md` Prettier warnings.

---

## Verdict

**No — the codebase is not production-ready from a security perspective, and the prior audits materially overstate the deployable's maturity.** The aggregate **4.6 / 5** for the core layers (adapters + services + state) is broadly defensible for _internal_ use, but the **2.6 / 5** for the deployable is generous: the build artifact (`build/index.html`) ships without a single transport hardening control — **no CSP, no HSTS, no SRI, no `X-Content-Type-Options`, no `Referrer-Policy`, no `Permissions-Policy`, no `frame-ancestors`**, and no `.well-known/security.txt`. A single compromised CDN edge would land attacker-controlled JavaScript on every user's browser, with no browser-enforced second line of defense. Beyond the deployable, **two security-relevant spec violations** survived review: (a) `remote-git.ts` claims to fetch only the `.nomad.md/` subtree but does not pass any filter — the entire branch tip lands in IndexedDB; (b) the state layer performs raw `adapter.writeTextFile` calls in `issues.ts:250` and `:330`, breaching the service-layer boundary that every other write path honors. The single biggest blocker for Step 6 is **shipping the static-host hardening (CSP + SRI + `_headers`) before the UI consumes the markers**. Without it, Step 6 cannot be merged to `main`.

---

## Findings

### [CRITICAL] No transport-layer hardening on the static bundle

- **File:line** — `build/index.html:7-15` (modulepreload links) and the entire `build/` directory; `static/` contains only `robots.txt`; no `static/_headers` or `static/.well-known/security.txt`.
- **Issue** — The deployable ships zero security headers. Confirmed via `Get-ChildItem T:\Kiroku\AgnosticIssuer\build` + `Select-String -Path build\index.html -Pattern "integrity|crossorigin|nonce"` → no output; `Test-Path static\_headers`, `static\.well-known`, `.well-known\security.txt` → all `False`. SECURITY.md §"Content Security Policy (Planned)" and `docs/current-project-status.md:284-303` document a minimum-viable CSP that has not been written to disk. `pnpm audit` returns clean, but the application has no defense in depth at the transport layer.
- **Repro / evidence** —
  ```text
  > rg "integrity=" T:\Kiroku\AgnosticIssuer\build\index.html
  (no output)
  > rg "crossorigin=" T:\Kiroku\AgnosticIssuer\build\index.html
  (no output)
  > Test-Path T:\Kiroku\AgnosticIssuer\static\_headers
  False
  > Test-Path T:\Kiroku\AgnosticIssuer\.well-known\security.txt
  False
  ```
  Every `<link rel="modulepreload">` in `build/index.html` is unverified.
- **Fix** — Add `static/_headers` (Netlify / Cloudflare Pages syntax) **and** `static/_redirects` for SPA fallback, plus `static/.well-known/security.txt`. The CSP in `docs/current-project-status.md:286-303` is the minimum; tighten `style-src` to drop `'unsafe-inline'` (Tailwind 4 + Svelte 5 ship hashed CSS so this is achievable) and add `script-src 'self' 'strict-dynamic'` with the inline boot block allowed by `'sha256-…'`. Example skeleton:
  ```text
  /*
    Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
    X-Content-Type-Options: nosniff
    Referrer-Policy: no-referrer
    Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
    Cross-Origin-Opener-Policy: same-origin
    Cross-Origin-Embedder-Policy: require-corp
    Cross-Origin-Resource-Policy: same-origin
    Content-Security-Policy: default-src 'self'; script-src 'self' 'strict-dynamic' 'sha256-…'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://cors.isomorphic-git.org; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; require-trusted-types-for 'script'; trusted-types nomad-md dompurify default
  /_app/*
    Cache-Control: public, max-age=31536000, immutable
  ```
  Reference: `docs/current-project-status.md:286-303`; `docs/security-qa-audit.md:142-162`; `SECURITY.md:55-67`.
- **Estimated effort** — S (one file write + one round-trip test on the staging host).

### [CRITICAL] No Subresource Integrity (SRI) on modulepreload / script tags

- **File:line** — `build/index.html:7-14` (seven `<link rel="modulepreload">` tags without `integrity=` or `crossorigin=`); `build/index.html:28-29` (the two `import(...)` URLs in the inline boot block).
- **Issue** — Subresource Integrity is the canonical mitigation against CDN compromise. Without `integrity=` on every external module, a single upstream edge breach (Netlify compromise, CDN MITM, malicious update to a transitive dep) substitutes attacker-controlled JavaScript that runs in the application origin and can read FSA handles, IndexedDB, and (for Remote Mode) the PAT.
- **Repro / evidence** —
  ```text
  $ Get-Content T:\Kiroku\AgnosticIssuer\build\index.html | Select-String "integrity"
  (no output)
  $ Get-Content T:\Kiroku\AgnosticIssuer\build\index.html | Select-String "crossorigin"
  (no output; "crossOrigin" only appears in the bundled vite preload helper chunk)
  ```
  The build output is the canonical place the browser sees; the headers must be applied to it.
- **Fix** — Add `scripts/add-sri.mjs` (post-build) that:
  1. Hashes every `build/_app/immutable/**/*.{js,css}` with SHA-384 and re-emits each `<link>` with `integrity="sha384-…"` and `crossorigin=""` (or `crossorigin="anonymous"`).
  2. Rewrites the boot block in `build/index.html` to either inject `integrity` on a `<script>` tag (requires moving the inline `<script>` to an external file with the same hash) or document a hash-pinned `'sha384-…'` in CSP `script-src`.
  3. Emits a sibling `build/integrity.json` mapping URL → expected hash, for the deploy script to compare against.
     Reference: `docs/security-audit-step-5.md:215-221`, `docs/security-audit-step-5.md:229`.
- **Estimated effort** — M (script + a Vitest covering the hashing + rewriter logic).

### [CRITICAL] "Partial clone" claim is false — entire branch tip lands in IndexedDB

- **File:line** — `src/lib/adapters/remote-git.ts:11-14` (docstring), `src/lib/adapters/remote-git.ts:218` (`SUBTREE` constant), `src/lib/adapters/remote-git.ts:277-289` (`git.fetch` invocation), `src/lib/adapters/remote-git.ts:297` (adapter rooted at `.nomad.md/`).
- **Issue** — The docstring asserts: _"Partial clone. Only the `.nomad.md/` subtree of the remote repository is fetched. The rest of the repository is never downloaded. (FR-12)"_. The ERS reinforces this in FR-12 / NFR-3 (privacy). **The implementation does not honor either.** `git.fetch({ fs, http, ref: branch, singleBranch: true, depth: 1, onAuth, corsProxy })` has no `exclude`, no `partial: true`, no `filter`, no `relative: true`, and no `since` — isomorphic-git will pull the whole branch tip tree. `SUBTREE` is only used as the prefix for the `DirectoryAdapter` returned from `fetchSubtree` (line 297), and the adapter re-checks the `..` segment in client-side `splitPath` (line 394) to keep reads inside the subtree. That is _not_ a partial clone — every byte of every file at the branch tip is fetched and materialized into the LightningFS database keyed `<url>|<branch>|…`. A malicious repo with a multi-GB binary at the tip will fill the user's IndexedDB before any "subtree" check runs; secrets that the host never intended to expose (CI artefacts, `dist/`, `node_modules/`, `.ssh/`) all land in the cache and persist there until `clearCache` is called.
- **Repro / evidence** —
  ```text
  $ rg "exclude|partial|filter|relative|since" T:\Kiroku\AgnosticIssuer\src\lib\adapters\remote-git.ts
  (no output)
  ```
  `isomorphic-git/index.d.ts:1547` exposes an `exclude?: string[]` option that takes a list of gitignore-style patterns — it is not used. The `git.fetch(...)` call at line 277-289 has none of the filter options. The README of isomorphic-git documents partial clones via the `partial: true` + `since` / `exclude` filters, none of which are passed. There is **no test that asserts the cache only contains `.nomad.md/`** (`tests/adapters/remote-git.test.ts` only exercises URL validation, PAT exclusion from cache keys, and `SUBTREE` is the string `'.nomad.md'`).
- **Fix** — Either:
  (a) Add the partial-clone filter to `fetchSubtree`:
  ```ts
  await git.fetch({
  	fs,
  	http,
  	dir: '/',
  	ref: branch,
  	singleBranch: true,
  	depth,
  	exclude: ['/*', '!/.nomad.md', '!/.nomad.md/**'],
  	relative: true,
  	onAuth,
  	corsProxy: options.corsProxy ?? DEFAULT_CORS_PROXY
  });
  ```
  plus a follow-up `git.checkout({ fs, dir: '/', ref: branch, filepaths: ['.nomad.md'] })` (or equivalent tree-walk) to materialize only that subtree; **and** add a Vitest (gated on `RUN_LIVE_TESTS=1`) that asserts the LightningFS root contains only `.nomad.md/` after a fetch.
  (b) Or update ERS FR-12 and the docstring to state the _actual_ contract (whole-branch-tip fetch with client-side subtree gating). The current contradiction is what makes this CRITICAL.
  Cite: ERS FR-12 / NFR-3; `docs/ers.md:880-885`.
- **Estimated effort** — L (live integration test + cross-tree verification of `isomorphic-git@1.38.5` exclude semantics; the test infra is the gated `RUN_LIVE_TESTS=1` path that is already a known gap at `docs/security-audit-step-5.md:174-176`).

### [HIGH] `safeResolve` and `notifySuperseded` use `undefined as unknown as T` cast

- **File:line** — `src/lib/state/_context.ts:148` (`safeResolve(undefined as unknown as T)`); justified in `docs/security-audit-step-5.md:130-136`.
- **Issue** — The cast is a TypeScript-only convenience (the public `schedule<T>(fn)` returns `Promise<T | undefined>`, but the internal `safeResolve<T>` is typed `T` for symmetry with `safeReject`). The runtime behaviour is correct. The risk is that a future contributor copying this pattern may use it to slip a sensitive value past the type system (e.g. `safeResolve(pat as unknown as Issue)`). Defence in depth: add a comment with an explicit "do not copy this pattern outside `debouncedSave`" warning, or refactor the helper to `(v: T | undefined) => …` so no cast is needed.
- **Repro / evidence** — Read `_context.ts:130-166`; the cast is the single point of type-system dishonesty in the state layer.
- **Fix** — `function safeResolve(v: T | undefined): void { if (settled) return; settled = true; resolve(v); }` — drop the `unknown` cast entirely. The function's contract is "either the fn result or undefined for superseded promises".
- **Estimated effort** — S.

### [HIGH] State layer bypasses the service layer for issue writes (`adapter.writeTextFile` direct)

- **File:line** — `src/lib/state/issues.ts:250` (`adapter.writeTextFile(sourcePath, text)`), `src/lib/state/issues.ts:330` (`adapter.writeTextFile(loaded.sourcePath, text)`).
- **Issue** — Every other write path in the codebase flows through a service function in `src/lib/services/`. The issues store reaches across the service boundary and writes directly to the adapter for create + save. The plan §A.3 acceptance test #5 (`rg 'fetch|writeTextFile|readTextFile|showDirectoryPicker' src/lib/state` returns nothing) PASSED because the grep matches the bare function name, not the property access on `adapter`. The smell was missed by `docs/security-audit-step-5.md:58` (which records this same grep as PASS) and was correctly flagged by `docs/audits/2026-06-23/architecture-audit.md:9` as a layer leak. From a _security_ perspective, this matters because:
  1. Any future cross-cutting security wrapper (e.g. an integrity re-check before write, an audit-log entry, a "soft-delete with rate limit") would need to be added in _two_ places instead of one.
  2. The state layer imports `moveToTrash` from `../adapters/trash.ts` (line 46) — yet another adapter-layer reach-around.
- **Repro / evidence** —
  ```text
  $ rg "writeTextFile" T:\Kiroku\AgnosticIssuer\src\lib\state
  src/lib/state/issues.ts:250:		await adapter.writeTextFile(sourcePath, text);
  src/lib/state/issues.ts:330:		await adapter.writeTextFile(loaded.sourcePath, text);
  ```
  No service file under `src/lib/services/` exports a `saveIssue` / `writeIssue` helper that wraps serialize + write + reparse (which is what those two lines really do). The closest is the ad-hoc pattern in the two call sites.
- **Fix** — Add `src/lib/services/issue-saver.ts` (or extend `issue-loader.ts`):
  ```ts
  export async function saveIssue(
  	adapter: DirectoryAdapter,
  	issue: Issue,
  	sourcePath: string
  ): Promise<LoadedIssue> {
  	const text = await serializeIssue(issue);
  	await adapter.writeTextFile(sourcePath, text);
  	return parseIssueFile(text, sourcePath);
  }
  export async function createIssue(
  	adapter: DirectoryAdapter,
  	input: CreateIssueInput
  ): Promise<LoadedIssue> {
  	const issue: Issue = buildDefaultIssue(input);
  	const sourcePath = `.nomad.md/issues/${buildIssueFilename(issue.id, issue.title)}`;
  	return saveIssue(adapter, issue, sourcePath);
  }
  ```
  Then update `issues.ts:248-253` and `:329-331` to call `saveIssue` / `createIssue` instead of inlining the serialize + writeTextFile. This restores the unidirectional `state → service → adapter` graph that the plan §G.2 enforces.
- **Estimated effort** — S (refactor + a few existing tests exercise the round-trip).

### [HIGH] Renderer runs DOMPurify with `default` Trusted Types sink implicit (no `require-trusted-types-for`)

- **File:line** — `src/lib/adapters/renderer.ts:121-127` (config), `src/app.html` (no `require-trusted-types-for` meta). The audit at `docs/security-audit-step-5.md:30` already records this as a Step-6 blocker, but no progress has been made.
- **Issue** — DOMPurify returns a `TrustedHTML` when Trusted Types are enabled by the host page; otherwise a plain string. The renderer at line 219 coerces with `result as unknown as string`. Until the CSP ships with `require-trusted-types-for 'script'`, the assignment to `innerHTML` (the only consumption point in Step 6 UI, per the architecture audit finding that `@html` is not yet used anywhere in `src/`) is not protected at the type-system level — a future contributor could write `{@html dirtyString}` and bypass the DOMPurify pass. The `SafeHtml` brand is the in-app defense; the CSP directive is the browser-enforced one.
- **Repro / evidence** —
  ```text
  $ rg "@html|set:html|dangerouslySetInnerHTML" T:\Kiroku\AgnosticIssuer\src
  (no output)
  ```
  Confirmed clean today, but the absence of the CSP directive means tomorrow's contributor is not protected.
- **Fix** — Ship the CSP from the [CRITICAL] finding above with `require-trusted-types-for 'script'; trusted-types nomad-md dompurify default`. Adopt the `nomad-md` policy name and have the UI use `trustedTypes.createPolicy('nomad-md', { createHTML: s => dompurify.sanitize(s) })` in `+layout.svelte` so the assignment to `innerHTML` becomes a TrustedHTML. Update `renderer.ts:219` to surface a clear error if the returned value is a `TrustedHTML` (it is currently `as unknown as string`).
- **Estimated effort** — M (CSP in `_headers` + a small `trustedTypes` shim in `+layout.svelte` + a Vitest that asserts the policy is registered).

### [HIGH] No Clickjacking defense in app.html or vite config

- **File:line** — `src/app.html` (entire file — 12 lines, no `<meta http-equiv="Content-Security-Policy" …>`, no `<meta name="referrer" …>`).
- **Issue** — Even if the host forgets to set `X-Frame-Options: DENY` / `frame-ancestors 'none'` headers (the [CRITICAL] finding covers the recommended state), `app.html` does not include a `<meta http-equiv>` fallback. Most modern browsers prefer the HTTP header, but proxies and static hosts sometimes strip headers, leaving the meta as the only line of defense. The ERS NFR-4 mandates keyboard-only operability; clickjacking bypasses keyboard controls via overlay UI.
- **Repro / evidence** — `Get-Content T:\Kiroku\AgnosticIssuer\src\app.html` (entire 12-line file, just the SvelteKit skeleton).
- **Fix** — Either:
  (a) Add `<meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none';">` to `src/app.html` as a defence-in-depth fallback. (CSP via meta has limited browser support for some directives but `frame-ancestors` is respected by Chromium.)
  (b) Document a SvelteKit `handle` hook in `hooks.server.ts` (or `hooks.client.ts`) that injects the headers on the response.
  The most robust is (b) + (a).
- **Estimated effort** — S.

### [HIGH] `CACHE_KEY_REGISTRY` is a `Set` that holds the _full_ URL + branch indefinitely

- **File:line** — `src/lib/adapters/remote-git.ts:148` (`const CACHE_KEY_REGISTRY: Set<string> = new Set()`).
- **Issue** — `makeCacheKey(url, branch, sha)` adds `url + "|" + branch + "|" + sha` to the set. `brandCacheKey(value)` adds the value passed in. The set grows monotonically over the lifetime of the page (no eviction). URLs frequently contain the GitHub username and repo name — not strictly secret, but for self-hosted GitLab / Gitea instances the URL often encodes the org path and is mildly sensitive. More importantly, **the registry prevents the strings from being garbage-collected**. The previous audit (`docs/security-audit-step-5.md:73`) acknowledged this: _"the set holds references to the branded strings, preventing GC. For the PAT and ProxyUrl cases this is fine …"_ — but the CacheKey set has _no_ upper bound and _no_ drop-on-error path; it is a memory leak that compounds with every successful or failed fetch.
- **Repro / evidence** —
  ```text
  $ rg "CACHE_KEY_REGISTRY" T:\Kiroku\AgnosticIssuer\src\lib\adapters\remote-git.ts
  148:const CACHE_KEY_REGISTRY: Set<string> = new Set();
  144:	CACHE_KEY_REGISTRY.add(value);
  153:	CACHE_KEY_REGISTRY.add(value);
  159:	return typeof value === 'string' && CACHE_KEY_REGISTRY.has(value);
  ```
  No `.delete(...)` or eviction logic.
- **Fix** — Either: (a) cap the set at, say, 50 entries with FIFO eviction; (b) drop the runtime registry entirely and rely on regex validation alone (the `CacheKey` is a `string` in a known shape — `revalidateRepoUrl` + `revalidateBranch` + a `revalidateSha` are sufficient); (c) use a `WeakRef`-based map (but strings can't be weak-keyed). Option (b) is the simplest and most secure.
- **Estimated effort** — S.

### [HIGH] `_logger.formatParts` JSON path can leak `Pat` values embedded in _object properties_

- **File:line** — `src/lib/adapters/_logger.ts:208-220` (`formatParts`).
- **Issue** — When at least one log arg is a non-primitive, `formatParts` falls through to `JSON.stringify(redacted)` (line 219). `redactValue` (line 119-139) only inspects _top-level_ string values: it checks `PAT_REGISTRY.has(value)` (membership check on the full string), and `looksLikePat(value)` for shape. **It does not recurse into nested objects.** A caller that accidentally logs `{ headers: { Authorization: 'Basic ghp_…' } }` would emit the literal PAT to the console, because `looksLikePat` is only invoked on the _outermost_ string slot in `parts.map(redactValue)` — not on the values inside the object. The comment at line 217-218 ("Throws on circular refs, which is what we want (it surfaces accidental sensitive-object logging at the call site)") is wrong: JSON.stringify does **not** throw if the inner value happens to be a `Pat`-shaped _string_ — it just emits it. Only true circular references throw.
- **Repro / evidence** — Read `_logger.ts:119-139` + `:208-220`. The `redactValue` body has no recursion. `JSON.stringify({ a: 'ghp_xxx' })` returns `'{"a":"ghp_xxx"}'` — no throw, no detection. Add a Vitest that asserts this fails closed.
- **Fix** — Replace `JSON.stringify(redacted)` with a `JSON.stringify(redacted, replacer)` where the replacer walks every value and runs `redactValue` on each:
  ```ts
  function replacer(_k: string, v: unknown): unknown {
  	return redactValue(v);
  }
  ```
  Plus a custom cycle detector that throws on circular refs (the JSON.stringify built-in cycle throw is preserved by passing a custom toJSON that throws). Add a Vitest that asserts `{ a: 'ghp_xxx' }` → `'{"a":"[REDACTED:PAT]"}'`.
- **Estimated effort** — S.

### [HIGH] `DOMException('aborted', 'AbortError')` is constructed manually in three places

- **File:line** — `src/lib/state/config.ts:84`, `src/lib/state/templates.ts:89`, `src/lib/state/issues.ts:168`.
- **Issue** — The control flow relies on `cause instanceof DOMException && cause.name === 'AbortError'` (config.ts:97, templates.ts:102, issues.ts:188) — and additionally on `cause instanceof Error && cause.name === 'AbortError'` (config.ts:100, templates.ts:105, issues.ts:191). The latter branch catches `Error` instances named `AbortError` (e.g. Node.js's `AbortError` thrown by `AbortSignal.reason`); the former catches DOM-only `AbortError`. The construct `new DOMException('aborted', 'AbortError')` works in browsers and in jsdom (vitest client project), but **throws `ReferenceError` in pure Node** (no global `DOMException`). The state-layer tests run in the `server` Vitest project (Node, no DOMException global per `vite.config.ts:101`), so the abort path in the tests is exercised via the second branch (`Error` with `name === 'AbortError'`). This is technically fine, but:
  1. In the browser, the DOMException branch is reached first. The code is correct there.
  2. In a future migration of tests to a browser environment, the DOMException branch will be hit. The second branch then becomes dead code.
  3. More relevant for security: the control flow's error-discriminator depends on `name === 'AbortError'` — a future contributor who throws an arbitrary `Error('AbortError')` will silently abort a load without surfacing the real error.
- **Repro / evidence** — Read the three state stores. All three repeat the same `throw new DOMException(...)` + dual-check pattern.
- **Fix** — Extract a `createAbortError()` helper to `state/errors.ts` that returns the platform-appropriate object (DOMException if available, else a plain `Error` with `name: 'AbortError'`). Both code paths can then drop the dual `instanceof` check. Reference: Node 18+ exposes `DOMException` as a global; on Node 22 (the version in `package.json` engines) it is available.
- **Estimated effort** — S.

### [MEDIUM] CORS proxy URL with credentials in query string could leak via `_logger.info`

- **File:line** — `src/lib/adapters/remote-git.ts:239` (`info(\`Fetching ${repoUrl} on branch ${branch} (depth ${depth}) via proxy\`, corsProxy)`).
- **Issue** — The log call passes `corsProxy` (a branded `ProxyUrl`) as a tagged arg. `_logger.ts:124-127` redacts `ProxyUrl` to `[REDACTED:PROXY:host]` — preserving only the URL host. Good. But the redactor only catches values that are _exactly_ the branded string. A future user-provided `cors_proxy` in `config.json` that includes a query string (e.g. `https://my-proxy.example/?api_key=...`) is **not** redacted before reaching the `_logger.info` path because it was _not_ put through `brandProxyUrl()` (only the _effective_ corsProxy on line 231 is branded; the `options.corsProxy` raw value is not). The `info` call does pass `corsProxy` (the branded one) — so this specific log line is safe. However, the `error()` call on line 528 (`error('git.fetch failed')`) and the `translateFetchError` path that bubbles the original error _message_ through `cause.message` to `RemoteFetchError` (line 529) does not redact. If a misconfigured proxy URL with credentials is logged by isomorphic-git inside the error cause, the unredacted URL could end up in the devtools console.
- **Repro / evidence** — Read `remote-git.ts:528-530`. `cause.message` is the isomorphic-git error string, which on a bad URL can contain the URL verbatim.
- **Fix** — In `translateFetchError` and any `error()` callsite, redact `cause.message` through `_logger.redactValue` (or a thin wrapper) before using it as an error message. The simplest patch:
  ```ts
  function translateFetchError(cause: unknown): RemoteAuthError | RemoteFetchError {
    const rawMsg = cause instanceof Error ? cause.message : '';
    const safeMsg = rawMsg.replace(/https?:\/\/[^\s]+/g, (m) => {
      try { const u = new URL(m); return `${u.protocol}//${u.host}/...`; } catch { return '[unparseable-url]'; }
    });
    if (cause instanceof Error) {
      const lower = safeMsg.toLowerCase();
      ...
    }
  }
  ```
- **Estimated effort** — S.

### [MEDIUM] `memory-fs.ts` accepts unbounded user seed at construction

- **File:line** — `src/lib/adapters/memory-fs.ts:64-74` (`constructor(seed?: MemoryFsSeed, limits?: MemoryFsLimits)`).
- **Issue** — The constructor enforces `maxFileSize` and `maxEntries` on the _seed_ (line 244-269). Good. But the constructor default for `maxEntries` is 10 000, and `maxFileSize` is 10 MiB — both class constants. A hostile test or plugin that passes `new MemoryFsAdapter({}, { maxFileSize: 1 << 30, maxEntries: 1_000_000 })` is allowed; the seed size check still applies, but the runtime cap on new files is now huge. The same `MemoryFsAdapter` is used by `tests/adapters/memory-fs.test.ts` and may be created by the FR-11 wizard's preview. A runaway tab memory situation is plausible.
- **Repro / evidence** — Read `memory-fs.ts:38-72`. The cap is _soft_ — `limits?.maxFileSize && limits.maxFileSize > 0` (line 69) — so a value of 0 falls back to the default, but `Number.MAX_SAFE_INTEGER` does not.
- **Fix** — Clamp `maxFileSize` to a hard upper bound (e.g. 100 MiB) and `maxEntries` to a hard upper bound (e.g. 100 000) regardless of what the caller passes. This is the same pattern as the input validation in `local-fs.ts:67` but for the in-memory adapter.
- **Estimated effort** — S.

### [MEDIUM] `editor.ts:151-158` writes arbitrary `value: unknown` into the draft

- **File:line** — `src/lib/state/editor.ts:143-160` (`patchField`).
- **Issue** — `patchField(key, value)` accepts `value: unknown`. The function is fine for keys that are in `SYSTEM_KEYS` — it skips `undefined` (line 151) and assigns. For custom fields (line 154-158) it assigns `value as FrontmatterValue`. There is no runtime check that the value conforms to the template's `type` for that field. A UI bug (or hostile library) that calls `patchField('severity', { __proto__: null, toString: () => 'high' })` would persist a non-JSON-safe value. The serializer at `services/serializer.ts:33-53` does no validation either; `js-yaml.dump` will emit arbitrary objects. The result lands in the YAML frontmatter and the integrity hash is computed over it; on the next load the YAML schema (`JSON_SCHEMA`) refuses merge keys but accepts arbitrary mappings, so the round-trip succeeds with the same shape.
- **Repro / evidence** — `editor.ts:143-160` + `serializer.ts:33-53`. No runtime narrowing against `FIELD_TYPES`.
- **Fix** — In `patchField`, when the field is in `SYSTEM_KEYS`, narrow `value` to the actual system-field type (`string | number | string[] | null` depending on the key). For custom fields, look up the template via `deps.templates.byType.get(issueType)?.fields.find(f => f.key === key)?.type` and narrow accordingly (`text`/`longtext` → string, `number` → number, `date` → ISO string, `select` → one of `options`, etc.). On mismatch, throw a `StateError('validation', ...)` so the editor catches it.
- **Estimated effort** — M (depends on whether `EditorStoreDeps.templates` is already wired in `+layout.svelte`; the architecture audit notes it is consumed in the deps but not yet called).

### [MEDIUM] `validator.ts` cycle detector can over-report on the same cycle

- **File:line** — `src/lib/services/validator.ts:65-91` (`detectCycles` + `visit`).
- **Issue** — Line 76: `errors.set(node, [...(errors.get(node) ?? []), ...uniqueCycle])`. Each node that participates in a cycle gets the _whole cycle path_ pushed into its error map. A 10-node cycle → each of the 10 nodes gets a `ValidationError` whose `field: 'relations'` carries the full 10-node path string. The aggregate error message ("Relation cycle detected involving issues 1 → 2 → … → 1") is then displayed for every participating node — visual noise, not a security issue per se, but: (a) the `validate()` return value is exposed via the editor store's `errors` getter; (b) `console.error` (if any of the UI components log it) will show duplicate-looking entries. From an integrity perspective this is a minor risk: a user editing an issue that is _also_ in a cycle sees a confusing message and may corrupt the issue further trying to "fix" the wrong thing.
- **Repro / evidence** — Read `validator.ts:65-91`. The integration test exercises only single-node self-relation (`rel.id === issue.id` at line 152), not multi-node cycles.
- **Fix** — Cap the cycle path to `[currentNode, immediateTarget]` (or just the edge back to `currentNode`), or dedupe per `(node, edge)` rather than per `(node, cycle)`.
- **Estimated effort** — S.

### [MEDIUM] `IndexedDB` error path swallows the underlying error in `dbGet`/`dbGetAll`

- **File:line** — `src/lib/adapters/handle-store.ts:73-91` (`openDb`).
- **Issue** — `req.addEventListener('error', () => reject(req.error))`. If the IDB open fails because of quota, version mismatch, or a `SecurityError`, the `Error` propagates to the caller (`handleStore.setActive`, etc.) which doesn't catch it. The error message is the native browser one ("A mutation operation was attempted on a database that did not allow mutations.", etc.) — not actionable for the user. There is no equivalent of "your browser is in private mode" detection. The handle store is gated on `isIndexedDBAvailable()` (line 68-70), so the worst case is the browser returns `true` for the feature check but `false` for the actual `indexedDB.open()` call (private mode in Firefox historically does this).
- **Repro / evidence** — Read `handle-store.ts:73-91`. No try/catch wraps `indexedDB.open`.
- **Fix** — Add an explicit `try/catch` around the open call, throw a typed `HandleStoreUnavailableError` that the UI can translate to "Browser storage is unavailable — Local Edit Mode cannot function". Include the original DOMException name in the message so dev-tools diagnostics work.
- **Estimated effort** — S.

### [MEDIUM] `proxyWarning` is included in the `FetchResult` but never explicitly shown to the user

- **File:line** — `src/lib/adapters/remote-git.ts:194` (interface), `:299-301` (construction), `:305` (return).
- **Issue** — `proxyWarning` is plumbed through the public API but no caller uses it (`rg "proxyWarning" src` returns only the three lines in `remote-git.ts` itself). The user is never told that the configured CORS proxy sees their `Authorization` header. NFR-3 ("Privacy — no third-party script that transmits user data off-device") is partially compromised by this: the PAT does travel off-device (to the proxy), but the user is never informed. The architecture audit does not flag this because the test surface doesn't include the UI.
- **Repro / evidence** — `rg "proxyWarning" T:\Kiroku\AgnosticIssuer\src` → only the 3 lines in `remote-git.ts`.
- **Fix** — Step 6 must render `proxyWarning` as a banner above the remote-mode editor. Add a Vitest (or a Playwright smoke test) that asserts the banner is present in the rendered DOM after `openRemote` succeeds.
- **Estimated effort** — S (UI work; not a backend fix).

### [MEDIUM] `safeHost` fallback leaks the proxy URL verbatim if it is unparseable

- **File:line** — `src/lib/adapters/remote-git.ts:532-538` (`safeHost`).
- **Issue** — `safeHost(corsProxy)` returns `[unparseable-proxy]` when `new URL(proxy)` throws. The redactor at `_logger.ts:124-131` returns `[REDACTED:PROXY:invalid]` for malformed proxy URLs — consistent with the redactor — so the log line is fine. But the `proxyWarning` _string_ (line 299-301) uses `safeHost(corsProxy)`. If the user-supplied `cors_proxy` in `config.json` is not a valid URL, the banner reads "The configured CORS proxy ([unparseable-proxy]) can see every request…" — informative for a developer but potentially confusing for a non-technical user. More importantly: if the URL contains a username:password (`https://user:pass@proxy.example/`) the host is preserved correctly, but the redactor strips the userinfo at the cost of the `proxyWarning` reading `proxy.example`. Fine.
- **Repro / evidence** — Read `safeHost` + `_logger.ts:124-131`. Mostly OK; minor cosmetic.
- **Fix** — No code change needed for security. Document the user-visible "unparseable proxy" string as expected.

### [MEDIUM] `localStorage.nomad.md.{theme,view}` keys persist user choices forever (no expiry)

- **File:line** — `src/lib/state/theme.ts:29` (`STORAGE_KEY = 'nomad.md.theme'`), `src/lib/state/view.ts:29` (`STORAGE_KEY = 'nomad.md.view'`).
- **Issue** — Neither key is sensitive (theme = 'light' | 'dark', view = 'list' | 'kanban' | 'gantt'). No PAT, no repo URL, no issue title. The risk is purely the "no expiry / no clearing" hygiene: if a user expects "private browsing" semantics in a non-incognito context, the theme preference leaks that they have visited this app. GDPR-style considerations apply at scale but not at v0.
- **Repro / evidence** — Read the two store files.
- **Fix** — No immediate action; add a `clearAll()` verb in Step 6's settings UI ("Reset to defaults") that calls `ls.removeItem('nomad.md.theme'); ls.removeItem('nomad.md.view')`. Acceptable.

### [LOW] Five `as unknown as` casts in `state/` (FSA boundary) — acceptable but documented

- **File:line** — `src/lib/state/mode.ts:126`, `:137`, `:210`; `src/lib/state/_context.ts:148`.
- **Issue** — Already documented in `docs/security-audit-step-5.md:128-136`. The `mode.ts:126` and `:137` casts narrow `FileSystemDirectoryHandle` to a shape that exposes optional `queryPermission`/`requestPermission` — this is a testability seam, not a security smell. The `mode.ts:210` cast (`fetchResult.adapter as unknown as DirectoryAdapter`) is the documented LSP/ISP violation flagged by `docs/audits/2026-06-23/architecture-audit.md:20` (the remote adapter is read-only but is typed as the full `DirectoryAdapter`). Not a security risk per se, but a future contributor who adds a write path to the remote adapter would silently write to IndexedDB on the wrong assumptions.
- **Repro / evidence** — Read `mode.ts:126-141`, `:208-215`.
- **Fix** — (Already documented.) The `mode.ts:210` cast should be split into a `ReadOnlyDirectoryAdapter` interface (`readTextFile`, `listDirectory`, `exists`) that `RemoteReadonlyAdapter` natively satisfies, and `DirectoryAdapter extends ReadOnlyDirectoryAdapter` (`writeTextFile`, `removeFile`, `moveFile`). The state layer should hold `ReadOnlyDirectoryAdapter | DirectoryAdapter` instead. Reference: `docs/audits/2026-06-23/architecture-audit.md:20`.

### [LOW] `console.*` only in `_logger.ts:228-237`

- **File:line** — `src/lib/adapters/_logger.ts:228, :231, :234, :237`.
- **Issue** — All four `console.*` calls are inside the redaction layer. Safe. No `console.*` in `src/lib/state/**`. Confirmed via `rg "console\\." src/lib/state` → 0 hits (matches the prior audit). Not a finding; recorded for completeness.
- **Fix** — None.

### [LOW] No `localStorage` usage with sensitive data

- **File:line** — `src/lib/state/theme.ts:58`, `src/lib/state/view.ts:56`.
- **Issue** — Only `theme` (light/dark) and `view` (list/kanban/gantt) are persisted. No PAT, no URL, no issue content. Safe.
- **Fix** — None.

### [LOW] `document.write` / `eval` / `new Function` — zero hits in source or build

- **File:line** — `rg "document\\.write|eval\\(|new Function" src` → 0 hits (the only `innerHTML` match is a JSDoc comment at `_logger.ts:54`).
- **Issue** — Clean. The build output (`build/_app/immutable/chunks/DOcxU2xe.js`) contains the Svelte runtime, which contains the string `"innerHTML"` only as part of an error message URL — no runtime `element.innerHTML = …` assignments.
- **Fix** — None.

### [LOW] `indexedDB` operations are wrapped in promise helpers (no callback leakage)

- **File:line** — `src/lib/adapters/handle-store.ts:73-145`.
- **Issue** — All IDB callbacks resolve/reject a local `Promise`. No callback reference leaks to module-level state. The pattern is correct.
- **Fix** — None.

---

## What the previous audit got right

1. **`pnpm audit` exit 0** (`docs/security-audit-step-5.md:182-208`) — verified by `pnpm audit` run on 2026-06-23 returning "No known vulnerabilities found". The `js-yaml@^4.2.0` and `cookie@^0.7.0` overrides are correctly applied (`package.json:23-27`); `gray-matter` was removed in favour of the in-tree `frontmatter.ts`.
2. **PAT hygiene brand + redactor + literal-shape detector** (`docs/security-audit-step-5.md:78-87, :115-118`) — verified. The `_logger.ts:119-154` pipeline catches branded PATs and PAT-shaped strings (GitHub classic 40-hex, GitHub fine-grained `ghp_*`, GitLab `glpat-*`). The Mode store exposes only `hasRemoteCredentials: boolean` and never stores the PAT value.
3. **DOMPurify config audit** (`docs/security-audit-step-5.md:113-118`) — verified. `renderer.ts:121-133` defines the strict config with `FORBID_TAGS` (script, iframe, style, object, embed, form, input, button) and `FORBID_ATTR` (style, onerror, onload, onclick, onmouseover, onfocus, onblur), plus `ALLOW_DATA_ATTR: false` and `KEEP_CONTENT: true`. The README config from the previous audit matches the live code.
4. **Atomic-write pattern** (`docs/security-audit-step-5.md:27`) — verified. `local-fs.ts:177-243` does temp + move with cleanup; `memory-fs.ts:127-141` simulates the same. NFR-7 satisfied.
5. **`yaml.JSON_SCHEMA` applied in `frontmatter.ts:98`** — verified. Merge keys (`<<:`), anchors (`&`), and aliases (`*`) are refused at parse time. The previous Step-4 audit's CVE-2026-53550 DoS is closed.
6. **Zero `console.*` in the state layer** (`docs/security-audit-step-5.md:138-144`) — verified by `rg "console\\." src/lib/state` → 0 hits.
7. **No PAT in `localStorage` / `sessionStorage`** — verified. `rg "localStorage|sessionStorage" src/lib/state` returns only `theme.ts` / `view.ts`, neither of which stores anything sensitive.
8. **Snapshot-based `discard()`** (`docs/security-audit-step-5.md:97-103`) — verified. `state/issues.ts:282-298` captures `cloneIssue(loaded.issue)` on the first `update()` after a save; subsequent updates reuse the same snapshot.
9. **Per-id `pendingSaves` lock** (`docs/security-audit-step-5.md:88-95`) — verified. `state/issues.ts:131-148` keeps a `Map<IssueId, Promise<void>>`; second `save(id)` call awaits the in-flight promise.
10. **`test:unit` 616 passing across 29 files** — verified. `pnpm vitest run` returned `616 passed (616)`.

---

## What the previous audit missed

1. **No verification of the build artifact's headers.** `docs/security-audit-step-5.md:212-221` describes the SRI gap as a known carry-over but does not inspect `build/index.html` directly. The present audit opened `build/index.html` (37 lines) and confirmed there is no `integrity=`, no `crossorigin=`, no nonce, and no `<meta>` CSP fallback. The "SRI is the biggest production gap" claim is correct but understated — the _entire transport hardening_ is missing, not just SRI.
2. **The "partial clone" claim was not challenged.** The Step-4 / Step-5 audits accepted `remote-git.ts:11-14` at face value. The present audit cross-referenced `isomorphic-git/index.d.ts:1528-1549` to confirm that `git.fetch` accepts `exclude`, `partial`, `relative`, `since`, `filter` — none of which are passed. The whole-branch-tip fetch is a contradiction of ERS FR-12 / NFR-3 that survived two review cycles.
3. **The "0 `fetch|writeTextFile|readTextFile` in state layer" grep was misleading.** `docs/security-audit-step-5.md:58` records this grep as PASS. It is PASS in literal terms but PASS only because the grep pattern matches the _bare_ identifier, not the property access `adapter.writeTextFile(...)`. The architecture audit's finding on this layer leak is correct and aligns with the present audit's [HIGH] finding.
4. **`_logger.formatParts` JSON path was not probed for nested PAT leaks.** The previous audit (`docs/security-audit-step-5.md:113-118`) verified that _top-level_ PAT-shaped strings are redacted, but did not examine what happens when an object containing a PAT-shaped string is logged. The present audit's [HIGH] finding documents that `JSON.stringify` is called on a `redacted` array where `redactValue` only inspects the outer slots — a `{ a: 'ghp_…' }` object would be emitted verbatim.
5. **`CACHE_KEY_REGISTRY` was acknowledged as a memory leak but not as a privacy surface.** `docs/security-audit-step-5.md:69-73` accepts the set as a trade-off for the PAT/ProxyUrl brands; the CacheKey set is also unbounded and holds the full repo URL + branch + SHA indefinitely. The present audit flags it as a memory-leak-with-privacy-flavor.
6. **`revalidateRepoUrl` / `revalidateBranch` are correctly applied but `revalidateSha` is not** (in `brandCacheKey` at `remote-git.ts:139-145`). The comment at line 141-144 explicitly _opts out_ of sha validation on the third segment: _"the third segment may include path-like components if a caller ever extends the format"_. This means a malformed `CacheKey` like `https://github.com/foo/bar|main|<script>alert(1)</script>` would survive `brandCacheKey` and be inserted into IndexedDB. The present audit notes this as part of the [HIGH] `CACHE_KEY_REGISTRY` finding; the previous audit did not flag it.
7. **`indexedDB` error path in `handle-store.ts:73-91`** was not reviewed for typed-error handling. The previous audit's table at `docs/security-audit-step-5.md:166` shows `91.96 / 78.57 / 81.08 / 97.95` coverage but does not enumerate which branches are uncovered. The present audit identifies the error-path branches (74, 77, 103, 117, 130, 143, 202-204) as untested.
8. **`proxyWarning` is plumbed but never rendered.** `docs/security-audit-step-5.md` does not mention the banner at all. The present audit's [MEDIUM] finding flags it as a privacy-disclosure gap.
9. **`safeResolve<T>(undefined as unknown as T)` cast** was acknowledged as a deviation in `docs/security-audit-step-5.md:130-136` ("the cast is the only way to satisfy T without an any"). The present audit shows the simpler fix (`T | undefined`) is possible without changing the public `schedule<T>` signature — the cast is unnecessary.
10. **The "0 hits for `innerHTML|outerHTML|document.write|eval|new Function` in `src`" claim is verified**, but the previous audit did not check `build/`. The present audit confirmed the build output is also clean (the only matches are Svelte error URL strings).

---

## Step-6-specific blockers

The following MUST be done as part of Step 6 or Step 6 cannot ship:

1. **Ship CSP via `static/_headers`** ([CRITICAL] finding). Without a CSP, every other browser-level defense is moot. The minimum template is in `docs/current-project-status.md:286-303`; tighten `style-src` (drop `'unsafe-inline'`) and add `require-trusted-types-for 'script'` per [HIGH] finding.
2. **Add SRI post-build script** ([CRITICAL] finding). Without SRI, a CDN compromise silently substitutes attacker-controlled JS. The script `scripts/add-sri.mjs` (referenced in `docs/security-audit-step-5.md:230`) is a known carry-over from Step 4.
3. **Fix the partial-clone claim** ([CRITICAL] finding). Either pass `exclude: ['/*', '!/.nomad.md/**']` (or equivalent) to `git.fetch`, or update the docstring + ERS to describe the actual contract. A contradictory spec is a security risk because compliance audits will assume the ERS wording.
4. **Move state-layer writes through a service helper** ([HIGH] finding). The `state/issues.ts:250` and `:330` direct `adapter.writeTextFile` calls bypass every other write path's invariants. Add `src/lib/services/issue-saver.ts` with `saveIssue()` / `createIssue()` and rewire.
5. **Render `proxyWarning` as a banner in the Remote Mode UI** ([MEDIUM] finding). The user must know that the CORS proxy sees their `Authorization` header — this is a privacy disclosure obligation under NFR-3.
6. **Promote `mode.ts:210` cast to a typed seam** ([LOW] finding; not strictly blocking but architecturally correct). Define `ReadOnlyDirectoryAdapter` in `adapters/directory-adapter.ts` and have the Mode store hold `DirectoryAdapter | ReadOnlyDirectoryAdapter`. Future contributors writing to the remote adapter would get a compile error.
7. **Recurse the `_logger` redactor** ([HIGH] finding). `JSON.stringify` of `{ a: 'ghp_…' }` currently emits the PAT verbatim. Add a replacer that walks every value.
8. **Clickjacking defence-in-depth in `app.html`** ([HIGH] finding). Add `<meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none';">` for the case where the host strips headers.
9. **Step-6 threat-model update**. The current `SECURITY.md` threat model (rows 35-42) describes the trust zones correctly but does not enumerate browser-level defenses. Add a row for each header that ships + SRI + Trusted Types.

---

## Production-readiness checklist

- [ ] **CSP shipped** (`static/_headers` for Netlify / Cloudflare Pages syntax; document GitHub Pages `404.html`/`<meta>` fallback).
- [ ] **HSTS shipped** (`max-age=63072000; includeSubDomains; preload`).
- [ ] **`X-Content-Type-Options: nosniff` shipped**.
- [ ] **`Referrer-Policy: no-referrer` shipped** (the current `data-sveltekit-preload-data="hover"` in `app.html:9` triggers prefetch requests that leak the URL via the default `strict-origin-when-cross-origin` referrer policy).
- [ ] **`Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()` shipped**.
- [ ] **`frame-ancestors 'none'` shipped** (CSP + `<meta>` fallback).
- [ ] **`Cross-Origin-Opener-Policy: same-origin` shipped** (COOP).
- [ ] **`Cross-Origin-Embedder-Policy: require-corp` shipped** (COEP — enables `SharedArrayBuffer` for DOMPurify jsdom test path and provides isolation).
- [ ] **SRI on modulepreloads + script tags** (`integrity="sha384-…"` + `crossorigin=""`).
- [ ] **CSP `require-trusted-types-for 'script'` shipped** + a `trustedTypes.createPolicy('nomad-md', …)` shim in `+layout.svelte`.
- [ ] **PAT lifecycle audit passed** (verified: brand + redactor + literal-shape detector + `isPat` guard + no `localStorage`/`sessionStorage`/`IndexedDB` persistence — all PASS).
- [ ] **Integrity hash uses Web Crypto** (verified: `integrity.ts:19` calls `globalThis.crypto.subtle.digest('SHA-256', bytes)`, no third-party hashing library).
- [ ] **No MD5 / SHA1 anywhere** (verified: `rg "MD5|SHA1|sha1|md5" src` → 0 hits).
- [ ] **`pnpm audit` clean** (verified: 0 advisories on 2026-06-23).
- [ ] **No `eval` / `new Function` / `document.write` / `innerHTML` direct assignment in src or build** (verified: 0 hits in source; build matches are Svelte runtime error strings only).
- [ ] **No `localStorage` with sensitive data** (verified: only `theme` and `view` keys persisted).
- [ ] **No `iframe` injection vector via Markdown** (verified: `FORBID_TAGS` includes `iframe` at `renderer.ts:123`).
- [ ] **`.well-known/security.txt` shipped** (MISSING — `Test-Path .well-known\security.txt` → `False`).
- [ ] **Clickjacking defence-in-depth in `app.html`** (`frame-ancestors 'none'` `<meta>` fallback — MISSING).
- [ ] **State layer writes through services** (MISSING — `state/issues.ts:250` and `:330` reach across to adapter).
- [ ] **Partial clone enforces `.nomad.md/` only at the network layer** (MISSING — `git.fetch` has no `exclude`/`partial`/`filter`).
- [ ] **`_logger` recurses into nested objects** (MISSING — `formatParts` calls `JSON.stringify` without a redacting replacer).
- [ ] **`CACHE_KEY_REGISTRY` is bounded** (MISSING — unbounded `Set`).
- [ ] **Proxy warning banner rendered in UI** (MISSING — `proxyWarning` field plumbed but no caller).
- [ ] **`moveToTrash` re-homed to service layer** (PARTIAL — currently imported by `state/issues.ts:46` directly).
- [ ] **`mode.ts:210` `as unknown as DirectoryAdapter` cast split into typed seam** (MISSING — `ReadOnlyDirectoryAdapter` not yet defined).
