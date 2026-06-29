/**
 * Config store — wraps `loadConfig` with reactive state and supersede-safe
 * async coordination.
 *
 * Reactivity: `config`, `status`, `error` are Svelte 5 `$state` slots.
 * Consumers reading `store.config` / `store.status` / `store.error`
 * get fine-grained reactivity. The store factory itself does not
 * contain `$effect` (effects belong in components).
 *
 * Behaviour:
 *  - `load()` reads `.quill.md/config.json` via the active adapter and
 *    populates `config`. The service throws on missing / malformed files;
 *    we surface the error in `state='error'` and `error`.
 *  - `refresh()` is a re-export of `load()` — kept as a separate verb so
 *    the UI can wire a refresh button without aliasing it to "load".
 *  - A missing config file (the user is opening a fresh repo with no
 *    `.quill.md/`) results in `config: null` and `state: 'ready'`. The
 *    FR-11 wizard handles the empty-repo case.
 *
 * Dependencies:
 *  - `mode` is read so the store can auto-refetch on mode change. This is
 *    wired by the caller (typically `+layout.svelte`) via a `$effect`
 *    outside the store; the store itself is a pure factory.
 */

import type { Config } from '../types/index.ts';
import { loadConfig, validateConfigShape } from '../services/index.ts';
import type {
	ReadOnlyDirectoryAdapter,
	WritableDirectoryAdapter
} from '../adapters/directory-adapter.ts';
import type { StateContext } from './_context.ts';

/** Status of the config store. Mirrors the small state machine. */
export type ConfigStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ConfigStore {
	readonly config: Config | null;
	readonly status: ConfigStatus;
	readonly error: Error | null;
	/**
	 * `true` when the active adapter is read-only (i.e. the user is in
	 * remote mode). The Settings panel uses this to gate the
	 * "Save config" affordance so the user does not attempt a write
	 * against a read-only backend.
	 */
	readonly isReadOnly: boolean;
	/** Load (or reload) the config. Supersedes any in-flight load. */
	readonly load: () => Promise<void>;
	/** Synonym for `load()`. */
	readonly refresh: () => Promise<void>;
	/**
	 * Persist a new `Config` to `.quill.md/config.json`. Validates the
	 * shape first; on validation failure, sets `status: 'error'` and
	 * stores the error in `error` (no write is attempted). On write
	 * failure, re-throws and leaves `config` untouched (no partial
	 * state). On success, the in-memory `config` slot is updated.
	 *
	 * In remote (read-only) mode this is a no-op and resolves
	 * immediately — the Settings panel should disable the save button
	 * via {@link isReadOnly}.
	 */
	readonly save: (cfg: Config) => Promise<void>;
}

/**
 * Build a {@link ConfigStore}.
 *
 * @param adapterProvider  returns the adapter to read from. In production this
 *                         resolves to the local or remote adapter from the
 *                         mode store; tests pass a fixed `MemoryFsAdapter`.
 */
export function createConfigStore(
	adapterProvider: () => WritableDirectoryAdapter | ReadOnlyDirectoryAdapter | null,
	ctx?: StateContext
): ConfigStore {
	let config = $state<Config | null>(null);
	let status = $state<ConfigStatus>('idle');
	let error = $state<Error | null>(null);

	// Per-load AbortController — superseded on every new load().
	let controller: AbortController | null = null;

	function abortInFlight(): void {
		if (controller) {
			controller.abort();
			controller = null;
		}
	}

	async function load(): Promise<void> {
		abortInFlight();
		controller = new AbortController();
		const sig = controller.signal;

		status = 'loading';
		error = null;

		const adapter = adapterProvider();
		if (!adapter) {
			// No adapter bound yet (still on 'home', or mode is mid-transition).
			// Stay 'idle' so the UI does not flash an error.
			status = 'idle';
			return;
		}

		// Honour supersede: if the signal aborts before the read completes,
		// bail without updating state.
		const checkAbort = (): void => {
			if (sig.aborted) {
				throw new DOMException('aborted', 'AbortError');
			}
		};

		try {
			checkAbort();
			const loaded = await loadConfig(adapter);
			checkAbort();
			config = loaded;
			status = 'ready';
			error = null;
		} catch (cause) {
			// Aborted by a supersede — leave state as-is so the next load wins.
			if (cause instanceof DOMException && cause.name === 'AbortError') {
				return;
			}
			if (cause instanceof Error && cause.name === 'AbortError') {
				return;
			}
			// Missing file: treat as empty repo (FR-11). The loader wraps
			// the original AdapterNotFoundError in a generic Error with a
			// canonical message ("Could not read .quill.md/config.json"),
			// so we match by message rather than instanceof. The cause
			// chain is preserved for diagnostics.
			const msg = cause instanceof Error ? cause.message : String(cause);
			if (msg.startsWith('Could not read .quill.md/config.json')) {
				config = null;
				status = 'ready';
				error = null;
				return;
			}
			const err = cause instanceof Error ? cause : new Error(String(cause));
			config = null;
			status = 'error';
			error = err;
		}
	}

	async function refresh(): Promise<void> {
		await load();
	}

	/**
	 * Persist a candidate `Config` to `.quill.md/config.json`. The
	 * active adapter is re-evaluated on every call so the latest
	 * `localAdapter` / `remoteAdapter` binding wins.
	 *
	 * Contract (sub-phase 7C):
	 *  - Validates the shape with `validateConfigShape` before any
	 *    write. Validation failures land in `status: 'error'` and
	 *    `error`; the file is not touched.
	 *  - Skips silently if the active adapter is read-only (remote
	 *    mode). The Settings panel surfaces a disabled save button via
	 *    `isReadOnly`; this branch is the belt-and-braces guard.
	 *  - On write failure, re-throws and leaves the in-memory `config`
	 *    untouched (no partial state). The adapter's atomic-write
	 *    contract (LocalFsAdapter) guarantees no half-written file
	 *    is left on disk.
	 *  - On success, updates `config` to the saved value and flips
	 *    `status: 'ready'`.
	 */
	async function save(cfg: Config): Promise<void> {
		// Validate first — no adapter call, no FS touch, no state mutation
		// on a malformed payload.
		let validated: Config;
		try {
			validated = validateConfigShape(cfg);
		} catch (cause) {
			const err = cause instanceof Error ? cause : new Error(String(cause));
			config = null;
			status = 'error';
			error = err;
			return;
		}

		const adapter = adapterProvider();
		if (!adapter) {
			// No active adapter (e.g. still on the home screen) — refuse.
			const err = new Error('Cannot save config: no active adapter');
			status = 'error';
			error = err;
			return;
		}
		if (isReadOnlyAdapter(adapter)) {
			// Remote mode is read-only. Mirror the documented no-op so
			// future callers that bypass the disabled UI don't silently
			// succeed. The store's `status` is left as-is — the caller
			// already knows it's read-only, and a state flip would mask
			// any error from a prior save.
			return;
		}

		const text = JSON.stringify(validated, null, '\t') + '\n';
		// LocalFsAdapter.writeTextFile is atomic (temp + rename); a
		// failure here is a real IO error and must propagate.
		// The cast narrows the union after the `isReadOnlyAdapter`
		// type-guard above; we know at this point that the adapter is
		// writable, but the union type isn't fully eliminated because
		// of how the function signature interacts with the provider's
		// return type.
		await (adapter as WritableDirectoryAdapter).writeTextFile('.quill.md/config.json', text);
		config = validated;
		status = 'ready';
		error = null;
	}

	// Honour an externally-provided signal as well (e.g. test-driven abort).
	if (ctx?.signal) {
		ctx.signal.addEventListener('abort', () => abortInFlight(), { once: true });
	}

	return {
		get config() {
			return config;
		},
		get status() {
			return status;
		},
		get error() {
			return error;
		},
		get isReadOnly() {
			const adapter = adapterProvider();
			return adapter ? isReadOnlyAdapter(adapter) : true;
		},
		load,
		refresh,
		save
	};
}

/**
 * Type-guard for the read-only branch of the `DirectoryAdapter`
 * interface. A `WritableDirectoryAdapter` is one that has
 * `writeTextFile`; everything else is treated as read-only.
 *
 * Returns a type predicate so the caller narrows to
 * `ReadOnlyDirectoryAdapter` in the true branch (and to
 * `WritableDirectoryAdapter` in the false branch via the negation).
 *
 * Centralised here (not in the adapter module) because the test stub
 * for `MemoryFsAdapter` and the real `LocalFsAdapter` both satisfy
 * the writable shape, while the `ReadonlyRemoteAdapter` returned by
 * `remote-git.ts` does not.
 */
function isReadOnlyAdapter(
	adapter: WritableDirectoryAdapter | ReadOnlyDirectoryAdapter
): adapter is ReadOnlyDirectoryAdapter {
	return typeof (adapter as Partial<WritableDirectoryAdapter>).writeTextFile !== 'function';
}
