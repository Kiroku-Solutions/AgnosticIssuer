/**
 * Tests for {@link slugify}, {@link padIssueId}, {@link buildIssueFilename},
 * and {@link nextIssueId} (`src/lib/services/slugs.ts`).
 *
 * The slug helpers are the entry point for on-disk filenames
 * (`<id>-<slug>.md`) per ERS §6.1.1. Anything that breaks here silently
 * breaks the issue loader (the file is no longer findable on disk), so
 * these tests pin the canonical behaviours even though the helpers are
 * small.
 *
 * Coverage targets:
 *  - `slugify`: plain ASCII, emoji-only fallback (`untitled`), NFKD
 *    decomposition, uppercase normalization, non-ASCII (e.g. accents,
 *    CJK).
 *  - `padIssueId`: 1, 9, 10, 1000, 10000 — exercises the 4-digit
 *    floor and the >9999 case where the natural width wins.
 *  - `buildIssueFilename`: two cases that exercise the combined pipeline.
 *  - `nextIssueId`: empty set, sparse set (no holes filled), max-only.
 */
import { describe, expect, it } from 'vitest';
import { buildIssueFilename, nextIssueId, padIssueId, slugify } from '$lib/services/slugs';

describe('slugify', () => {
	it('returns the kebab-cased lowercase form of a plain ASCII title', () => {
		expect(slugify('Fix login redirect')).toBe('fix-login-redirect');
	});

	it('collapses runs of non-alphanumerics into a single dash and trims edges', () => {
		expect(slugify('  ---Hello!! World???  ')).toBe('hello-world');
	});

	it('falls back to "untitled" when the title reduces to no alphanumerics', () => {
		// Emoji-only input — after NFKD + combining-mark strip + non-alnum
		// collapse, nothing survives; the helper must surface "untitled"
		// rather than an empty string so the file is still findable.
		expect(slugify('🚀🎉🔥')).toBe('untitled');
	});

	it('lowercases uppercase input', () => {
		expect(slugify('HELLO WORLD')).toBe('hello-world');
	});

	it('strips combining marks (NFKD) so accented characters fold to ASCII', () => {
		// 'Café' NFKD-decomposes to 'Cafe' + U+0301 (combining acute);
		// the combining mark is stripped, giving the ASCII form.
		expect(slugify('Café')).toBe('cafe');
	});

	it('handles CJK (non-Latin) input via the same fallback as emoji', () => {
		// Japanese characters are non-alphanumeric in our regex, so the
		// slug collapses to "untitled". This pins the behaviour so a
		// future "support CJK filenames" change has to consciously
		// extend this test.
		expect(slugify('日本語')).toBe('untitled');
	});

	it('preserves digits inside the slug', () => {
		expect(slugify('Sprint 42 retro')).toBe('sprint-42-retro');
	});
});

describe('padIssueId', () => {
	it('pads single-digit ids to 4 digits', () => {
		expect(padIssueId(1)).toBe('0001');
	});

	it('pads 9 to "0009"', () => {
		expect(padIssueId(9)).toBe('0009');
	});

	it('pads 10 to "0010" (no truncation)', () => {
		expect(padIssueId(10)).toBe('0010');
	});

	it('leaves 1000 unchanged (4 digits)', () => {
		expect(padIssueId(1000)).toBe('1000');
	});

	it('lets ids >9999 exceed the 4-digit floor without truncation', () => {
		expect(padIssueId(10000)).toBe('10000');
	});

	it('clamps non-positive ids to at least 1 (defensive)', () => {
		// `Math.max(1, id)` keeps the helper honest for bad callers.
		expect(padIssueId(0)).toBe('0001');
		expect(padIssueId(-7)).toBe('0001');
	});
});

describe('buildIssueFilename', () => {
	it('composes the canonical "<id>-<slug>.md" form', () => {
		expect(buildIssueFilename(42, 'Fix login redirect!')).toBe('0042-fix-login-redirect.md');
	});

	it('uses the "untitled" fallback when the slug is empty', () => {
		expect(buildIssueFilename(7, '🚀')).toBe('0007-untitled.md');
	});
});

describe('nextIssueId', () => {
	it('returns 1 for an empty issue set', () => {
		expect(nextIssueId([])).toBe(1);
	});

	it('returns max + 1, never reusing a deleted (sparse) lower id', () => {
		// Set = [3, 7] → next is 8 (NOT 1, NOT 4). ERS §6.1.1: holes
		// from deletes are not reused; the id counter is monotonic.
		expect(nextIssueId([{ id: 3 }, { id: 7 }])).toBe(8);
	});

	it('returns the next id after a single-issue set', () => {
		expect(nextIssueId([{ id: 42 }])).toBe(43);
	});
});
