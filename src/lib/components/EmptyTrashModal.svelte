<!--
	EmptyTrashModal.svelte — confirm modal for the toolbar's
	"Empty trash" affordance (sub-phase 6E, ERS FR-4).

	Mounted by `LocalToolbar.svelte` only in Local Edit Mode (the
	toolbar hides the trigger when `modeStore.mode === 'remote'`).

	Behaviour:
	  - Shows the count of files in `.nomad.md/.trash/`. The count is
	    passed in as a prop (the toolbar reads it via the active local
	    adapter's `listDirectory` and re-reads after every `remove`).
	  - The confirm button calls `emptyTrash(adapter)` from
	    `$lib/adapters/trash`; the toolbar passes the resolved local
	    adapter in so the modal does not need to know about the
	    mode store. The callback fires on success and the modal
	    closes.

	The adapter is typed as `DirectoryAdapter` (`WritableDirectoryAdapter`
	alias per `directory-adapter.ts`) because the read-only surface
	is the only thing `emptyTrash` actually uses.
-->
<script lang="ts">
	import { Modal } from '$lib/ui';
	import { emptyTrash } from '$lib/adapters';
	import type { DirectoryAdapter } from '$lib/adapters';

	type Props = {
		open: boolean;
		adapter: DirectoryAdapter | null;
		count: number;
		onclose: () => void;
		onemptied?: (removed: number) => void;
	};

	let { open = $bindable(), adapter, count, onclose, onemptied }: Props = $props();

	let busy = $state(false);
	let error = $state<string | null>(null);

	function close(): void {
		open = false;
		onclose();
	}

	async function confirm(): Promise<void> {
		if (!adapter || busy) return;
		busy = true;
		error = null;
		try {
			const removed = await emptyTrash(adapter);
			onemptied?.(removed);
			close();
		} catch (cause) {
			error = (cause as Error).message;
		} finally {
			busy = false;
		}
	}
</script>

<Modal bind:open onclose={close} class="max-w-md">
	<header class="mb-2 flex items-start justify-between gap-3">
		<h2 class="text-lg font-semibold">Empty trash?</h2>
		<button
			type="button"
			class="btn btn-ghost btn-sm"
			onclick={close}
			aria-label="Close empty-trash dialog">×</button
		>
	</header>

	<p class="text-sm">
		{#if count === 0}
			The trash is already empty.
		{:else}
			This will <strong class="text-error">permanently delete</strong>
			{count}
			{count === 1 ? 'file' : 'files'} from
			<code>.nomad.md/.trash/</code>. This cannot be undone.
		{/if}
	</p>

	{#if error}
		<p class="text-error mt-3 text-xs" role="alert">{error}</p>
	{/if}

	<footer class="mt-4 flex items-center justify-end gap-2">
		<button type="button" class="btn btn-ghost btn-sm" onclick={close} disabled={busy}>
			Cancel
		</button>
		<button
			type="button"
			class="btn btn-error btn-sm"
			disabled={count === 0 || busy || !adapter}
			aria-busy={busy || undefined}
			onclick={() => void confirm()}
			data-testid="empty-trash-confirm"
		>
			{#if busy}
				<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
			{/if}
			Empty trash
		</button>
	</footer>
</Modal>
