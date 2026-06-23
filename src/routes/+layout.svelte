<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import {
		createConfigStore,
		createEditorStore,
		createFilterStore,
		createIssuesStore,
		createModeStore,
		createStateContext,
		createTemplatesStore,
		createThemeStore,
		createViewStore,
		setStores
	} from '$lib/state';
	import { handleStore, LocalFsAdapter } from '$lib/adapters';
	import { isFsaAvailable } from '$lib/adapters/feature-detect';

	let { children } = $props();

	// Stores are instantiated per mount. The `modeStore` is constructed
	// first because every data store needs an adapter provider that
	// routes through the active mode. The `config` + `templates` stores
	// feed the `issues` store's validation context, and the `editor` store
	// sits on top of `issues`.
	const ctx = createStateContext(
		// The seed adapter is irrelevant — `modeStore.openLocalFolder`
		// replaces `ctx.adapter` once a folder handle is bound. We
		// supply a dummy `DirectoryAdapter` shim to satisfy the type.
		{
			readTextFile: () => Promise.reject(new Error('No folder bound')),
			listDirectory: () => Promise.reject(new Error('No folder bound')),
			writeTextFile: () => Promise.reject(new Error('No folder bound')),
			removeFile: () => Promise.reject(new Error('No folder bound')),
			moveFile: () => Promise.reject(new Error('No folder bound'))
		},
		new AbortController().signal
	);
	const mode = createModeStore(ctx, {
		handles: handleStore,
		createLocalAdapter: (handle) =>
			// `LocalFsAdapter`'s constructor is private; use the static
			// factory `LocalFsAdapter.fromHandle` (set up below) to keep
			// the pick-vs-bind seam visible at the call site.
			LocalFsAdapter.fromHandle(handle)
	});
	// Adapter provider that resolves to the active adapter (local or
	// remote). In Remote Mode the adapter is read-only by ERS contract
	// (C-2); we cast through `unknown` because the data-store APIs all
	// accept the writable shape, but the Remote Mode UI disables every
	// write affordance so the write methods are never actually called.
	const adapterProvider = (): typeof mode.localAdapter => {
		return (mode.localAdapter ??
			(mode.remoteAdapter as unknown as typeof mode.localAdapter) ??
			null) as typeof mode.localAdapter;
	};
	const config = createConfigStore(adapterProvider);
	const templates = createTemplatesStore(adapterProvider);
	const issues = createIssuesStore(adapterProvider, { config, templates });
	const editor = createEditorStore({ issues, config, templates });
	const filter = createFilterStore();
	const view = createViewStore();
	const theme = createThemeStore();

	setStores({ mode, config, templates, issues, editor, filter, view, theme });

	// Bootstrap the mode + theme on mount. `mode.bootstrap()` restores the
	// last folder handle from IndexedDB; `theme` reads localStorage.
	// Both are no-ops on the server / in tests.
	onMount(async () => {
		if (!isFsaAvailable()) return;
		// Apply the theme to <html> before any component renders to avoid
		// a flash. The `prefers-color-scheme` fallback is handled by the
		// store constructor.
		document.documentElement.classList.toggle('dark', theme.theme === 'dark');
		try {
			await mode.bootstrap();
			if (mode.localAdapter) {
				await Promise.all([config.load(), templates.load()]);
				await issues.load();
			} else if (mode.remoteAdapter) {
				await Promise.all([config.load(), templates.load()]);
				await issues.load();
			}
		} catch (cause) {
			console.error('[nomad-md] bootstrap failed:', cause);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>nomad.md</title>
</svelte:head>

{@render children()}
