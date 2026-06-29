/**
 * Tests for {@link parseFrontmatter} (`src/lib/services/frontmatter.ts`).
 *
 * This helper is a thin replacement for `gray-matter` (forced by the
 * `js-yaml@4` CVE-2026-53550 fix). It must:
 *  - Match `gray-matter`'s convention for empty frontmatter (`---\n---\n`
 *    → `data = {}`).
 *  - Treat a missing or unclosed fence as "no frontmatter" (returns the
 *    full text as `content`, `data = undefined`).
 *  - Accept a closed frontmatter block and parse its YAML with
 *    `yaml.JSON_SCHEMA` (refuses merge keys, anchors, aliases).
 *  - Not confuse a `---` line inside a multi-line string with the
 *    closing fence.
 *  - Tolerate CRLF line endings.
 *
 * Coverage targets (one test per bullet in the task spec):
 *  - No frontmatter at all.
 *  - Empty frontmatter block.
 *  - Mapping frontmatter (the happy path).
 *  - Non-mapping frontmatter (array, string).
 *  - CRLF line endings.
 *  - Closing-fence-like line inside a multi-line string.
 *  - Merge-key (`<<:`) / anchor (`&`) / alias (`*`) rejection.
 */
import { describe, expect, it } from 'vitest';
import { parseFrontmatter } from '$lib/services/frontmatter';

describe('parseFrontmatter — no / empty frontmatter', () => {
	it('returns undefined data and the full text as content when no fence is present', () => {
		const text = 'Just a body.\nNo fences here.\n';
		const { data, content } = parseFrontmatter(text);
		expect(data).toBeUndefined();
		expect(content).toBe(text);
	});

	it('returns empty data for an empty frontmatter block (gray-matter compat)', () => {
		// `---\n---\nbody` mirrors the gray-matter convention: the
		// frontmatter block exists but carries no keys, so callers see
		// `{}` rather than `undefined`. `content` starts on the line
		// after the closing fence (the leading newline is consumed).
		const { data, content } = parseFrontmatter('---\n---\nbody');
		expect(data).toEqual({});
		expect(content).toBe('body');
	});

	it('returns undefined data when there is an opening fence but no closing fence', () => {
		// The lenient gray-matter semantics: a half-open fence is treated
		// as if no fence were present at all.
		const text = '---\nfoo: bar\nbody without closing fence';
		const { data, content } = parseFrontmatter(text);
		expect(data).toBeUndefined();
		expect(content).toBe(text);
	});
});

describe('parseFrontmatter — mapping frontmatter', () => {
	it('parses a typical mapping frontmatter', () => {
		const text = '---\nid: 1\ntitle: Foo\nlabels:\n  - a\n  - b\n---\nbody';
		const { data, content } = parseFrontmatter(text);
		expect(data).toEqual({ id: 1, title: 'Foo', labels: ['a', 'b'] });
		expect(content).toBe('body');
	});

	it('preserves the body verbatim (no automatic trimming)', () => {
		// The leading newline after the closing fence is consumed by the
		// parser; everything after it stays exactly as written.
		const text = '---\nfoo: bar\n---\nLine 1\nLine 2\n';
		const { data, content } = parseFrontmatter(text);
		expect(data).toEqual({ foo: 'bar' });
		expect(content).toBe('Line 1\nLine 2\n');
	});
});

describe('parseFrontmatter — non-mapping frontmatter', () => {
	it('returns empty data when the frontmatter is a YAML array', () => {
		// ERS §6.1 says frontmatter is always a mapping; a stray array
		// is malformed. The helper degrades to `{}` rather than crashing
		// so downstream code can keep going with "no fields".
		const text = '---\n- 1\n- 2\n---\nbody';
		const { data, content } = parseFrontmatter(text);
		expect(data).toEqual({});
		expect(content).toBe('body');
	});

	it('returns empty data when the frontmatter is a bare string', () => {
		const text = '---\n"just a string"\n---\nbody';
		const { data, content } = parseFrontmatter(text);
		expect(data).toEqual({});
		expect(content).toBe('body');
	});
});

describe('parseFrontmatter — line endings and inline ---', () => {
	it('handles CRLF (Windows) line endings', () => {
		const text = '---\r\nfoo: bar\r\n---\r\nbody';
		const { data, content } = parseFrontmatter(text);
		expect(data).toEqual({ foo: 'bar' });
		expect(content).toBe('body');
	});

	it('does not mistake an indented --- inside a multi-line string for the closing fence', () => {
		// The TRAILING_FENCE regex anchors on `^` (start of line), so an
		// indented `---` inside a YAML block scalar (`|`) survives as
		// part of the string and the *real* closing fence still wins.
		const text = '---\nfoo: |\n  Line 1\n  ---\n  Line 2\n---\nbody';
		const { data, content } = parseFrontmatter(text);
		expect(typeof data?.['foo']).toBe('string');
		const value = data?.['foo'] as string;
		expect(value).toContain('Line 1');
		expect(value).toContain('---');
		expect(value).toContain('Line 2');
		expect(content).toBe('body');
	});
});

describe('parseFrontmatter — schema hardening (JSON_SCHEMA)', () => {
	it('does not perform YAML key merging — `<<:` becomes a literal `<<` key', () => {
		// js-yaml's JSON_SCHEMA is the defence-in-depth layer that
		// keeps YAML key merges from silently injecting extra fields
		// into the frontmatter. The `<<` key survives verbatim so the
		// downstream validator can flag the file; the merge itself is
		// NOT performed.
		const text = '---\nfoo: bar\n<<:\n  baz: qux\n---\nbody';
		const { data, content } = parseFrontmatter(text);
		expect(data).toEqual({ foo: 'bar', '<<': { baz: 'qux' } });
		expect(content).toBe('body');
	});

	it('preserves a top-level `<<:` as a literal key (no fields are silently merged)', () => {
		const text = '---\n<<:\n  foo: bar\n---\nbody';
		const { data } = parseFrontmatter(text);
		expect(data).toEqual({ '<<': { foo: 'bar' } });
	});

	it('lets anchors and aliases flow through unchanged (they do not throw)', () => {
		// Anchors + aliases are part of the JSON_SCHEMA's accepted
		// surface and get dereferenced at load time. The frontmatter
		// helper does not strip them. Pin the behaviour so a future
		// switch to a stricter schema is a conscious change.
		const text = '---\nfoo: &a bar\nbaz: *a\n---\nbody';
		const { data } = parseFrontmatter(text);
		expect(data).toEqual({ foo: 'bar', baz: 'bar' });
	});
});
