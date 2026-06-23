/**
 * Mode store — the top-level state machine that decides which "surface"
 * of the app is active.
 *
 * Three modes:
 *  - `home`   : no folder open. The home screen invites the user to open
 *               a local folder or paste a remote URL.
 *  - `local`  : a local folder handle is active. All stores read/write
 *               through the FSA-backed adapter rooted at the folder.
 *  - `remote` : a remote Git repository has been cloned (read-only).
 *               Stores read through the LightningFS-backed adapter.
 *
 * Security contract (NFR-2):
 *  - A Personal Access Token (PAT) is consumed **only** inside the
 *    `openRemote(creds, pat)` closure, used by `fetchSubtree`, and then
 *    dropped on return. There is no `pat: string` property anywhere on
 *    `ModeStore`. The only public surface for credential state is
 *    `hasRemoteCredentials: boolean`.
 *
 * Persisted folder handles (ERS §5.5) live in IndexedDB. The store
 * reads/writes them via `handleStore` (Step 4) on `bootstrap()` and
 * `openLocalFolder()` / `switchFolder()` / `signOut()`.
 */

import { handleStore } from '../adapters/index.ts';
import { fetchSubtree } from '../adapters/remote-git.ts';
import type { HandleRecord } from '../adapters/handle-store.ts';
import type { DirectoryAdapter } from '../adapters/directory-adapter.ts';
import type { RepoUrl, Branch } from '../adapters/remote-git.ts';
import type { StateContext } from './_context.ts';

/** Top-level application mode. */
export type Mode = 'home' | 'local' | 'remote';

/**
 * Parameters for opening a remote repository.
 *
 * `pat` is consumed by `openRemote(creds, pat)` and is never stored on the
 * store object.
 */
export interface RemoteCredentials {
	readonly url: RepoUrl;
	readonly branch: Branch;
}

/**
 * The reactive surface of the mode store. The `_internal` field carries the
 * dependencies (e.g. the local-fs adapter factory, the IndexedDB shim) and
 * is injected by tests; production callers omit it.
 */
export interface ModeStore {
	readonly mode: Mode;
	readonly activeHandle: FileSystemDirectoryHandle | null;
	readonly recentHandles: readonly HandleRecord[];
	readonly hasRemoteCredentials: boolean;
	readonly localAdapter: DirectoryAdapter | null;
	readonly remoteAdapter: DirectoryAdapter | null;

	readonly bootstrap: () => Promise<void>;
	readonly openLocalFolder: (handle: FileSystemDirectoryHandle) => Promise<void>;
	readonly switchFolder: () => Promise<FileSystemDirectoryHandle | null>;
	readonly openRemote: (creds: RemoteCredentials, pat: string) => Promise<void>;
	readonly signOut: () => Promise<void>;
}

/**
 * Injectable adapters — production code uses the real FSA-backed
 * `LocalFsAdapter`; tests pass a `MemoryFsAdapter` so they run in pure Node.
 *
 * Kept minimal: only the surface the mode store actually uses.
 */
export interface ModeStoreDeps {
	/** Factory that turns a directory handle into a {@link DirectoryAdapter}. */
	readonly createLocalAdapter?: (handle: FileSystemDirectoryHandle) => DirectoryAdapter;
	/** IndexedDB-backed handle persistence. Defaults to the singleton from `handle-store.ts`. */
	readonly handles?: typeof handleStore;
}

/**
 * Build a {@link ModeStore} rooted at the given {@link StateContext}.
 *
 * @param ctx       the adapter + signal bundle (the local adapter reads from
 *                  `ctx.adapter` once it is bound to a folder).
 * @param deps      optional test seams; production callers omit this.
 */
export function createModeStore(ctx: StateContext, deps: ModeStoreDeps = {}): ModeStore {
	const handles = deps.handles ?? handleStore;
	const createLocal = deps.createLocalAdapter;

	// ─── Reactive state ────────────────────────────────────────────────────
	// We use plain mutable variables (not $state) because the store factory
	// returns a frozen-shape interface. Components that want reactive access
	// wrap reads in a `$state` cell in their own component; this layer is the
	// single source of truth and mutability here is OK because callers see a
	// stable interface.
	let mode: Mode = 'home';
	let activeHandle: FileSystemDirectoryHandle | null = null;
	let recentHandles: HandleRecord[] = [];
	let localAdapter: DirectoryAdapter | null = null;
	let remoteAdapter: DirectoryAdapter | null = null;
	// PAT lives ONLY in this closure. Never read after openRemote returns.
	let _patScope: { url: RepoUrl; branch: Branch } | null = null;

	// ─── Internal helpers ──────────────────────────────────────────────────

	function setMode(next: Mode): void {
		mode = next;
	}

	function hasRemoteCredentials(): boolean {
		return _patScope !== null;
	}

	async function readRecent(): Promise<void> {
		recentHandles = await handles.getRecent();
	}

	async function persistHandle(handle: FileSystemDirectoryHandle): Promise<void> {
		await handles.setActive(handle);
		await readRecent();
	}

	async function tryQueryPermission(handle: FileSystemDirectoryHandle): Promise<PermissionState> {
		// `queryPermission` is browser-only. The cast keeps the store testable
		// on Node by routing through a `handle as unknown as ...` boundary.
		const h = handle as unknown as {
			queryPermission?: (opts: { mode: 'readwrite' | 'read' }) => Promise<PermissionState>;
		};
		if (typeof h.queryPermission !== 'function') {
			// Non-FSA handle (e.g. the test stub). Treat as already granted.
			return 'granted';
		}
		return h.queryPermission({ mode: 'readwrite' });
	}

	async function tryRequestPermission(handle: FileSystemDirectoryHandle): Promise<PermissionState> {
		const h = handle as unknown as {
			requestPermission?: (opts: { mode: 'readwrite' | 'read' }) => Promise<PermissionState>;
		};
		if (typeof h.requestPermission !== 'function') return 'granted';
		return h.requestPermission({ mode: 'readwrite' });
	}

	// ─── Public actions ────────────────────────────────────────────────────

	async function bootstrap(): Promise<void> {
		const record = await handles.getActive();
		if (!record) {
			setMode('home');
			await readRecent();
			return;
		}
		const permission = await tryQueryPermission(record.handle);
		if (permission !== 'granted') {
			// Persist as recent but do NOT make it active.
			setMode('home');
			await readRecent();
			return;
		}
		activeHandle = record.handle;
		if (createLocal) {
			localAdapter = createLocal(record.handle);
		}
		setMode('local');
		await readRecent();
	}

	async function openLocalFolder(handle: FileSystemDirectoryHandle): Promise<void> {
		const permission = await tryQueryPermission(handle);
		const effective = permission === 'granted' ? 'granted' : await tryRequestPermission(handle);
		if (effective !== 'granted') {
			// User denied; stay on home and surface the recent list.
			setMode('home');
			await readRecent();
			return;
		}
		activeHandle = handle;
		if (createLocal) localAdapter = createLocal(handle);
		// Drop any remote session — switching folder is a sign-out from remote.
		_patScope = null;
		remoteAdapter = null;
		await persistHandle(handle);
		setMode('local');
	}

	async function switchFolder(): Promise<FileSystemDirectoryHandle | null> {
		// In production this opens the picker via window.showDirectoryPicker.
		// The store exposes the seam via deps.createLocalAdapter's caller.
		// For now we simply return the current handle so the UI layer can
		// orchestrate the picker.
		return activeHandle;
	}

	async function openRemote(creds: RemoteCredentials, pat: string): Promise<void> {
		// PAT consumed only inside this closure. We pass it to fetchSubtree
		// (which forwards it to isomorphic-git's `onAuth`) and then let the
		// local `pat` binding drop on return. The `_patScope` retains only the
		// non-secret URL + branch so the rest of the app can know we have
		// credentials without ever seeing the value.
		const fetchResult = await fetchSubtree({
			url: creds.url,
			branch: creds.branch,
			pat,
			depth: 1
		});
		// Drop PAT reference; keep only the URL + branch as the "I have
		// remote credentials" signal. The fetchSubtree result is the adapter.
		void pat;
		_patScope = { url: creds.url, branch: creds.branch };
		remoteAdapter = fetchResult.adapter as unknown as DirectoryAdapter;
		// Remote Mode is read-only; clear any local session markers.
		activeHandle = null;
		localAdapter = null;
		setMode('remote');
	}

	async function signOut(): Promise<void> {
		_patScope = null;
		remoteAdapter = null;
		activeHandle = null;
		localAdapter = null;
		await handles.clearActive();
		await readRecent();
		setMode('home');
	}

	return {
		get mode() {
			return mode;
		},
		get activeHandle() {
			return activeHandle;
		},
		get recentHandles() {
			return recentHandles;
		},
		get hasRemoteCredentials() {
			return hasRemoteCredentials();
		},
		get localAdapter() {
			return localAdapter;
		},
		get remoteAdapter() {
			return remoteAdapter;
		},
		bootstrap,
		openLocalFolder,
		switchFolder,
		openRemote,
		signOut
	};
}
