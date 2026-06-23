/**
 * Typed errors for the state layer.
 *
 * Every state-layer code path throws or rejects with one of these (or with an
 * adapter/service error that bubbles up unchanged). The `kind` discriminator
 * is the public surface — UI code should switch on it instead of `instanceof`,
 * which lets us reorganise the class hierarchy later without touching callers.
 */

/** Discriminated kinds. Add new kinds here as new error paths appear. */
export type StateErrorKind =
	/** A browser-only API was called outside the browser. */
	| 'not-in-browser'
	/** A store action was called before its `load()` settled. */
	| 'not-ready'
	/** A second save was attempted for an issue id with one already in-flight. */
	| 'concurrent-save'
	/** A supersede aborted an in-flight load. */
	| 'aborted'
	/** Catch-all for unexpected state-layer failures. */
	| 'internal';

/**
 * Base class for state-layer errors.
 *
 * Carries a `kind` discriminator for UI branching. UI should:
 * ```ts
 * try {
 *   await store.save(id);
 * } catch (e) {
 *   if (e instanceof StateError && e.kind === 'concurrent-save') { ... }
 * }
 * ```
 */
export class StateError extends Error {
	readonly kind: StateErrorKind;

	constructor(kind: StateErrorKind, message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = 'StateError';
		this.kind = kind;
	}
}

/**
 * Thrown when an action requires a loaded value (e.g. `getConfig()`) but the
 * store has not yet completed its initial `load()`.
 *
 * Surface in the UI as "still loading" rather than "broken".
 */
export class StoreNotReadyError extends StateError {
	constructor(store: string, options?: { cause?: unknown }) {
		super('not-ready', `Store "${store}" is not ready yet — call load() first.`, options);
		this.name = 'StoreNotReadyError';
	}
}

/**
 * Thrown when `issuesStore.save(id)` is called while a previous `save(id)`
 * is still in-flight.
 *
 * In practice the store's `pendingSaves` map serialises per-id writes, so
 * this error should not escape through normal usage. It exists as a typed
 * guard for the rare case where the lock is bypassed (e.g. by a future
 * refactor).
 */
export class ConcurrentSaveError extends StateError {
	constructor(id: number, options?: { cause?: unknown }) {
		super('concurrent-save', `A save for issue ${id} is already in flight.`, options);
		this.name = 'ConcurrentSaveError';
	}
}
