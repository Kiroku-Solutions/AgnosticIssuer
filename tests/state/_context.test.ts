/**
 * Tests for the state-layer foundation: `errors.ts` and `_context.ts`.
 *
 * Coverage targets:
 *  - StateError carries the `kind` discriminator and is `instanceof Error`.
 *  - The two concrete subclasses (StoreNotReadyError, ConcurrentSaveError)
 *    set both their own `name` and the right `kind`.
 *  - assertBrowser() throws StateError('not-in-browser') in a non-browser
 *    context and does not throw when `window` is defined.
 *  - createStateContext returns the adapter; signal is optional.
 *  - debouncedSave: only the last scheduled fn runs after the delay; cancel
 *    discards the pending timer; errors propagate.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryFsAdapter } from '$lib/adapters/memory-fs';
import { assertBrowser, createStateContext, debouncedSave } from '$lib/state/_context';
import { ConcurrentSaveError, StateError, StoreNotReadyError } from '$lib/state/errors';

describe('StateError — base class', () => {
	it('is an Error subclass and carries the kind discriminator', () => {
		const e = new StateError('not-in-browser', 'boom');
		expect(e).toBeInstanceOf(Error);
		expect(e).toBeInstanceOf(StateError);
		expect(e.kind).toBe('not-in-browser');
		expect(e.name).toBe('StateError');
		expect(e.message).toBe('boom');
	});

	it('preserves the cause option', () => {
		const cause = new Error('root');
		const e = new StateError('internal', 'wrap', { cause });
		expect(e.cause).toBe(cause);
	});
});

describe('StoreNotReadyError', () => {
	it('has kind "not-ready" and a store-named message', () => {
		const e = new StoreNotReadyError('config');
		expect(e.kind).toBe('not-ready');
		expect(e.name).toBe('StoreNotReadyError');
		expect(e.message).toContain('config');
		expect(e).toBeInstanceOf(StateError);
	});
});

describe('ConcurrentSaveError', () => {
	it('has kind "concurrent-save" and includes the issue id', () => {
		const e = new ConcurrentSaveError(42);
		expect(e.kind).toBe('concurrent-save');
		expect(e.name).toBe('ConcurrentSaveError');
		expect(e.message).toContain('42');
		expect(e).toBeInstanceOf(StateError);
	});
});

describe('assertBrowser', () => {
	it('throws StateError("not-in-browser") when window is undefined', () => {
		const original = (globalThis as { window?: unknown }).window;
		delete (globalThis as { window?: unknown }).window;
		try {
			let caught: unknown;
			try {
				assertBrowser();
			} catch (e) {
				caught = e;
			}
			expect(caught).toBeInstanceOf(StateError);
			expect((caught as StateError).kind).toBe('not-in-browser');
		} finally {
			(globalThis as { window?: unknown }).window = original;
		}
	});

	it('does not throw when window is defined', () => {
		(globalThis as { window?: unknown }).window = globalThis;
		expect(() => assertBrowser()).not.toThrow();
	});
});

describe('createStateContext', () => {
	it('returns a context with the given adapter and no signal', () => {
		const adapter = new MemoryFsAdapter();
		const ctx = createStateContext(adapter);
		expect(ctx.adapter).toBe(adapter);
		expect(ctx.signal).toBeUndefined();
	});

	it('passes through the signal when provided', () => {
		const adapter = new MemoryFsAdapter();
		const controller = new AbortController();
		const ctx = createStateContext(adapter, controller.signal);
		expect(ctx.adapter).toBe(adapter);
		expect(ctx.signal).toBe(controller.signal);
	});

	it('does not include signal when omitted (no extra key)', () => {
		const adapter = new MemoryFsAdapter();
		const ctx = createStateContext(adapter);
		expect('signal' in ctx).toBe(false);
	});
});

describe('debouncedSave', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('only the last scheduled fn runs after the delay', async () => {
		const d = debouncedSave(100);
		const calls: number[] = [];
		const p1 = d.schedule(async () => {
			calls.push(1);
			return 1;
		});
		const p2 = d.schedule(async () => {
			calls.push(2);
			return 2;
		});
		const p3 = d.schedule(async () => {
			calls.push(3);
			return 3;
		});

		// Advance time so the debounced call fires.
		await vi.advanceTimersByTimeAsync(100);

		const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
		expect(calls).toEqual([3]); // only the last fn ran
		expect(r1).toBeUndefined();
		expect(r2).toBeUndefined();
		expect(r3).toBe(3);
	});

	it('cancel() discards the pending timer and the promise resolves undefined', async () => {
		const d = debouncedSave(100);
		const fn = vi.fn(async () => 7);
		const p = d.schedule(fn);

		d.cancel();
		await vi.advanceTimersByTimeAsync(100);

		expect(fn).not.toHaveBeenCalled();
		await expect(p).resolves.toBeUndefined();
		expect(d.pending()).toBe(false);
	});

	it('pending() reflects the armed state', () => {
		const d = debouncedSave(100);
		expect(d.pending()).toBe(false);
		d.schedule(async () => 1);
		expect(d.pending()).toBe(true);
	});

	it('propagates errors from the scheduled fn', async () => {
		const d = debouncedSave(50);
		const err = new Error('boom');
		// Attach the catch handler BEFORE advancing timers so the rejection
		// is observed synchronously when the timer fires (avoids the
		// `PromiseRejectionHandledWarning` that Node emits when the rejection
		// is "discovered" by `await expect(p).rejects` only after the fact).
		const caught = d
			.schedule(async () => {
				throw err;
			})
			.then(
				() => 'no-throw' as const,
				(e: unknown) => e
			);
		await vi.advanceTimersByTimeAsync(50);
		expect(await caught).toBe(err);
	});
});
