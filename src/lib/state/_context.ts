/**
 * Shared foundation for every store under `src/lib/state/**`.
 *
 * Every store factory takes a {@link StateContext}. The context is the only
 * thing that ties a store to the outside world (the {@link DirectoryAdapter})
 * and to the runtime (the optional {@link AbortSignal}).
 *
 * ## Why a context object instead of module-level state?
 *
 * Module-level state makes a Svelte 5 store impossible to test per-case (HMR
 * bleed, singleton contamination, no way to run two scenarios side by side).
 * A factory pattern with explicit context is the canonical Svelte 5 idiom
 * and matches the rest of the project's architecture (adapters + services are
 * pure, testable, dependency-injected).
 *
 * ## AbortSignal contract
 *
 * The optional `signal` is the abort handle for any async operation started
 * by a store. Stores are expected to:
 *
 * 1. Create a fresh `AbortController` per action that may be superseded
 *    (e.g. `load()` after a folder switch).
 * 2. Pass the controller's `signal` to services that accept one (where
 *    available — the existing service signatures do not, but the seam is in
 *    place for Step 6 to wire them).
 * 3. Abort the previous controller when a new action supersedes it.
 *
 * The `assertBrowser` and `debouncedSave` helpers below are deliberately
 * generic — they are useful across multiple stores.
 */

import type { DirectoryAdapter } from '../adapters/directory-adapter.ts';
import { StateError } from './errors.ts';

/**
 * The bundle of dependencies a state-layer factory needs.
 *
 * `adapter` is required: every store eventually reads or writes through it.
 * `signal` is optional and only meaningful in tests that want to verify
 * abort behaviour; production callers typically omit it.
 */
export interface StateContext {
	readonly adapter: DirectoryAdapter;
	/** Abort handle the store should respect on supersede. Optional. */
	readonly signal?: AbortSignal;
}

/**
 * Build a {@link StateContext}. Pure factory — no module-level state.
 */
export function createStateContext(adapter: DirectoryAdapter, signal?: AbortSignal): StateContext {
	if (signal !== undefined) return { adapter, signal };
	return { adapter };
}

/**
 * Throw {@link StateError} with kind `'not-in-browser'` if invoked in a
 * non-browser context.
 *
 * Use inside `$effect` bodies that touch `window`, `localStorage`, or
 * IndexedDB. The static adapter means we never actually SSR, but defensive
 * coding prevents surprise breakage in `@vitest/browser-playwright` jsdom
 * injection or any future preview-mode setup.
 */
export function assertBrowser(): void {
	if (typeof window === 'undefined') {
		throw new StateError('not-in-browser', 'Browser-only API called outside the browser');
	}
}

/**
 * A small debouncer with cancellation semantics.
 *
 * Used by `editorStore` (auto-save) and any other store that wants to coalesce
 * bursts of writes. The returned `schedule` returns the promise that will
 * resolve when the most recently scheduled `fn` settles; `cancel` discards
 * the pending timer and the returned promise resolves with `undefined`.
 *
 * Superseded `schedule` calls (a new call arrives before the previous timer
 * fires) resolve with `undefined` immediately. Errors from the most recent
 * `fn` propagate to that schedule call's returned promise.
 */
export interface DebouncedSave {
	/**
	 * Arm the debouncer. If `schedule` is called again before `delayMs`
	 * elapses, the previous timer is discarded, the previous returned
	 * promise resolves to `undefined`, and the new `fn` replaces the old one.
	 */
	readonly schedule: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
	/** Cancel any pending timer. The in-flight promise resolves to `undefined`. */
	readonly cancel: () => void;
	/** True if a timer is currently armed. Useful for UI indicators. */
	readonly pending: () => boolean;
}

/**
 * Build a {@link DebouncedSave}.
 *
 * Implementation notes:
 *  - The timer is cleared on every new `schedule` call (debouncing, not
 *    throttling — the most recent call wins).
 *  - There is no `flush()` action; auto-save in `editorStore` uses an
 *    explicit `save()` action for that.
 *  - Superseded promises are settled (resolved undefined) immediately so
 *    `await` callers do not leak handles.
 */
export function debouncedSave(delayMs: number): DebouncedSave {
	let timer: ReturnType<typeof setTimeout> | null = null;
	/**
	 * Pending resolvers to settle when a previous `schedule` is superseded.
	 * One entry per live superseded promise. We keep them as `undefined`
	 * resolvers only — superseded promises never reject.
	 */
	let supersededResolvers: Array<() => void> = [];

	function clearTimer(): void {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
	}

	/** Resolve all currently-superseded promises to `undefined`. */
	function settleSuperseded(): void {
		const toSettle = supersededResolvers;
		supersededResolvers = [];
		for (const r of toSettle) r();
	}

	function schedule<T>(fn: () => Promise<T>): Promise<T | undefined> {
		clearTimer();
		settleSuperseded();

		return new Promise<T | undefined>((resolve, reject) => {
			let settled = false;
			const safeResolve = (v: T): void => {
				if (settled) return;
				settled = true;
				resolve(v);
			};
			const safeReject = (err: unknown): void => {
				if (settled) return;
				settled = true;
				reject(err);
			};

			function notifySuperseded(): void {
				safeResolve(undefined as unknown as T);
			}

			supersededResolvers.push(notifySuperseded);

			timer = setTimeout(() => {
				timer = null;
				// Remove ourselves from supersededResolvers so the next
				// schedule() doesn't re-resolve us to undefined after we win.
				const idx = supersededResolvers.indexOf(notifySuperseded);
				if (idx >= 0) supersededResolvers.splice(idx, 1);

				fn().then(
					(v) => safeResolve(v),
					(err: unknown) => safeReject(err)
				);
			}, delayMs);
		});
	}

	function cancel(): void {
		clearTimer();
		settleSuperseded();
	}

	function isPending(): boolean {
		return timer !== null;
	}

	return { schedule, cancel, pending: isPending };
}
