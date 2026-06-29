/**
 * Phase 7E — pako allow-list hygiene tests.
 *
 * The Phase 7E investigation (see `outputs/phase-7e-bundle/deliverable.md`)
 * established that the `pnpm.overrides pako: "npm:fflate"` swap is
 * INCOMPATIBLE: fflate has no `default` export, but isomorphic-git does
 * `import pako from 'pako'`, and the two libraries differ in the streaming
 * inflate shape. As a result, pako remains in the production bundle
 * (transitive via `isomorphic-git`, NOT via
 * `@isomorphic-git/lightning-fs` as the original task description claimed).
 *
 * The `Function(\`binder\`)` substring that pako's inflate fast path
 * emits therefore also remains in the bundle. That substring is dead
 * code at runtime — pako only invokes it when the caller passes
 * `{ fast: true }` as an Inflate option, and isomorphic-git's packfile
 * reader does not. The `check-csp.mjs` script keeps the entry in its
 * `ALLOWLIST` constant.
 *
 * This test suite pins the security contract that follows from that
 * decision:
 *
 *  1. pako is NOT in the `script-src` (or any other CSP directive) of
 *     `static/_headers`. The CSP makes no concessions for pako. The
 *     allow-list in `check-csp.mjs` is the only place pako is mentioned
 *     in the CSP pipeline, and the allow-list is a build-time warning,
 *     NOT a runtime CSP exception.
 *  2. pako's `Function(\`binder\`)` substring is still being detected by
 *     `check-csp.mjs`. If a future change accidentally removes the
 *     allow-list, the check will fail the build.
 *  3. The pako allow-list entry is documented with a Phase 7E rationale
 *     that mentions the fflate override incompatibility.
 *
 * The tests run in the `server` Vitest project (Node environment, no
 * browser globals) so that `node:fs` is available.
 */
import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '..', '..');
const headersPath = resolve(repoRoot, 'static', '_headers');
const checkCspPath = resolve(repoRoot, 'scripts', 'check-csp.mjs');

async function readIfExists(path: string): Promise<string | null> {
	try {
		return await readFile(path, 'utf8');
	} catch {
		return null;
	}
}

describe('pako is not in the static CSP', () => {
	it('static/_headers exists and is readable', async () => {
		const src = await readIfExists(headersPath);
		expect(src, 'static/_headers must exist').not.toBeNull();
	});

	it('pako is NOT mentioned in any CSP directive of static/_headers', async () => {
		const src = await readIfExists(headersPath);
		expect(src).not.toBeNull();

		// The CSP directive is the line that starts with
		// `Content-Security-Policy:`. The Netlify `_headers` format
		// uses a single tab between the path and the directive, so the
		// regex anchors on `[ \t]*` rather than `^`. We only scan the
		// directive, not the comment block — comments may legitimately
		// mention pako (the Phase 7E rationale).
		const cspLine = (src ?? '').match(/^[ \t]*Content-Security-Policy:\s*(.+)$/m)?.[1] ?? '';
		expect(cspLine, 'static/_headers must contain a Content-Security-Policy directive').not.toBe(
			''
		);

		// pako must not appear as a host, scheme, or nonce value in the
		// CSP. Use a word-boundary check so "pako-internal" would still
		// fail (defence against future relaxations of the policy).
		expect(
			cspLine,
			'pako must not appear anywhere in the runtime CSP — pako is a transitive dep, not a CSP exception'
		).not.toMatch(/\bpako\b/i);
	});

	it('pako is NOT in the script-src of static/_headers (in particular)', async () => {
		const src = await readIfExists(headersPath);
		expect(src).not.toBeNull();
		const csp = (src ?? '').match(/^[ \t]*Content-Security-Policy:\s*(.+)$/m)?.[1] ?? '';
		const scriptSrc = csp.match(/script-src\s+([^;]+)/)?.[1] ?? '';
		expect(scriptSrc, 'script-src must be present in CSP').not.toBe('');

		// pako must not appear as a host, scheme, nonce, or hash source.
		expect(
			scriptSrc,
			'script-src must not reference pako — pako is not a script source we trust'
		).not.toMatch(/\bpako\b/i);
	});
});

describe('pako allow-list in check-csp.mjs', () => {
	it('scripts/check-csp.mjs is readable', async () => {
		const src = await readIfExists(checkCspPath);
		expect(src, 'scripts/check-csp.mjs must exist').not.toBeNull();
	});

	it('check-csp.mjs has an ALLOWLIST constant', async () => {
		const src = await readIfExists(checkCspPath);
		expect(src).not.toBeNull();
		// The constant declaration `const ALLOWLIST` is canonical; the
		// `const ALLOWLIST = [` form opens the array literal.
		expect(src ?? '', 'ALLOWLIST must be declared').toMatch(/const\s+ALLOWLIST\s*=/);
	});

	it('pako is documented in check-csp.mjs as a known allow-list pattern', async () => {
		const src = await readIfExists(checkCspPath);
		expect(src).not.toBeNull();
		// The Phase 7E rationale must mention both pako and the fflate
		// override attempt. This guards against the allow-list being
		// silently removed in a future refactor.
		const lower = (src ?? '').toLowerCase();
		expect(lower, 'check-csp.mjs must mention pako by name').toContain('pako');
		expect(
			lower,
			'check-csp.mjs must mention fflate in the Phase 7E rationale (so the fflate incompatibility is not silently forgotten)'
		).toContain('fflate');
	});

	it('the allow-list entry for pako gates the Function(`binder`) marker', async () => {
		const src = await readIfExists(checkCspPath);
		expect(src).not.toBeNull();
		// The matcher string is the canonical marker for pako's
		// inflate fast path. If the marker is dropped, the allow-list
		// entry no longer matches anything in the bundle and the entry
		// is dead. (A real refactor would update both at once — this
		// test pins the contract.)
		expect(
			src ?? '',
			'allow-list matcher for pako must be the canonical Function(`binder`) marker'
		).toMatch(/Function\(`binder`/);
	});
});
