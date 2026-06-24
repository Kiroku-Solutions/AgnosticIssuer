<!--
	Wizard — first-run template setup (FR-11 / UC-5, sub-phase 6H
	re-skin).

	Triggered when the home page's "Open local folder" flow detects a
	missing `.nomad.md/config.json` — see `+page.svelte`. The route is
	also reachable directly via `/wizard` for users who want to
	re-run the wizard over an existing project (the route is tolerant
	of an already-set-up repo and offers to leave existing files in
	place; see `wizard.ts:writeWizardSetup`).

	Paths:
	  - "Use built-in templates" → checklist of the four built-in
	    templates (Epic / User Story / Task / Bug). At least one
	    must be selected to enable the Apply button.
	  - "Create your own" → the future in-app template editor. The
	    button is disabled with a tooltip "Coming soon"; FR-11 only
	    requires the built-in path to be functional.

	On Apply:
	  1. `writeWizardSetup(adapter, selectedIds, { overwriteConfig: true })`
	  2. Re-load config + templates through the stores
	  3. `goto('/local')` — the user is now on the main surface.

	Sub-phase 6H replaces the daisyUI-only markup with the 6B primitives
	(Card, Button, Alert, Badge, Radio, Checkbox) + 6A tokens. Logic is
	unchanged.
-->
<script lang="ts">
	import { getStores } from '$lib/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Alert, Badge, Button, Card, Checkbox, Radio, Tooltip } from '$lib/ui';
	import { BUILT_IN_TEMPLATES } from '$lib/services/built-in-templates';
	import { writeWizardSetup } from '$lib/services/wizard';

	const stores = getStores();

	type Path = 'builtin' | 'custom';
	let path = $state<Path>('builtin');
	let selected = $state<ReadonlySet<string>>(new Set());
	let isApplying = $state(false);
	let applyError = $state<string | null>(null);

	const canApply = $derived(path === 'builtin' && selected.size > 0 && !isApplying);

	function toggle(id: string): void {
		// `selected` is reassigned wholesale on every change (immutable-set
		// pattern), so the Svelte 5 reactivity fires on the assignment, not
		// on the inner add/delete. The local `new Set(selected)` is just a
		// shallow copy used to derive the next snapshot; it never escapes
		// this function, so a plain `Set` is correct here.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}

	onMount(() => {
		// If the wizard is opened without a bound local adapter, send
		// the user back home — the wizard cannot write anywhere.
		if (stores.mode.localAdapter === null) {
			void goto(resolve('/'));
		}
	});

	async function apply(): Promise<void> {
		const adapter = stores.mode.localAdapter;
		if (!adapter) {
			applyError = 'No local folder is open. Use "Open local folder" on the home page.';
			return;
		}
		isApplying = true;
		applyError = null;
		try {
			await writeWizardSetup(adapter, [...selected], { overwriteConfig: true });
			// Re-load the affected stores so the UI reflects the new files.
			await Promise.all([stores.config.load(), stores.templates.load()]);
			await stores.issues.load();
			await goto(resolve('/local'));
		} catch (cause) {
			applyError = (cause as Error).message;
		} finally {
			isApplying = false;
		}
	}

	function cancel(): void {
		void goto(resolve('/'));
	}
</script>

<div class="flex min-h-screen flex-col bg-base-100 text-base-content">
	<header
		class="sticky top-0 z-30 flex h-[var(--topbar-height)] items-center gap-3 border-b border-base-300 bg-base-200 px-6"
	>
		<a
			href={resolve('/')}
			class="flex items-baseline gap-2 font-bold tracking-tight hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
			aria-label="nomad.md home"
		>
			<span class="text-lg">nomad.md</span>
			<span class="text-xs opacity-60">v0.0.1</span>
		</a>
		<Badge variant="primary" size="sm">First-run setup</Badge>
		<div class="flex-1"></div>
		<Button variant="ghost" size="sm" onclick={cancel}>Cancel</Button>
	</header>

	<main class="flex-1 px-6 py-10">
		<div class="mx-auto flex max-w-3xl flex-col gap-8">
			<section>
				<h1 class="text-2xl font-semibold">Set up your issue tracker</h1>
				<p class="mt-2 opacity-80">
					Your folder does not have a <code>.nomad.md/</code> configuration yet. Pick a path below to
					get started. You can edit or add templates later from the Settings panel.
				</p>
			</section>

			<section class="flex flex-col gap-3">
				<h2 class="text-lg font-semibold">1. Choose how to set up templates</h2>

				<Card compact class="cursor-pointer">
					<label class="flex cursor-pointer items-start gap-3">
						<Radio name="wizard-path" value="builtin" checked={path === 'builtin'} label="" />
						<div class="flex-1">
							<div class="font-medium">Use built-in templates</div>
							<div class="text-sm opacity-70">
								Pick from the four bundled issue types: Epic, User Story, Task, Bug. Recommended for
								most projects.
							</div>
						</div>
					</label>
					<input
						type="radio"
						name="wizard-path"
						value="builtin"
						checked={path === 'builtin'}
						onchange={() => (path = 'builtin')}
						class="sr-only"
						aria-label="Use built-in templates"
					/>
				</Card>

				<Tooltip text="Coming soon — the in-app template editor is a future step" position="top">
					<Card compact class="cursor-not-allowed opacity-60">
						<div class="flex items-start gap-3">
							<Radio
								name="wizard-path"
								value="custom"
								checked={path === 'custom'}
								label=""
								disabled
							/>
							<div class="flex-1">
								<div class="font-medium">Create your own</div>
								<div class="text-sm opacity-70">
									Author one or more templates from scratch (coming soon). You can also add
									templates later from Settings.
								</div>
							</div>
						</div>
					</Card>
				</Tooltip>
			</section>

			{#if path === 'builtin'}
				<section class="flex flex-col gap-3" data-testid="wizard-template-picker">
					<h2 class="text-lg font-semibold">2. Pick the templates you need</h2>
					<p class="text-sm opacity-70">
						Select at least one. Selected templates are written to
						<code>.nomad.md/templates/</code> verbatim.
					</p>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each BUILT_IN_TEMPLATES as t (t.id)}
							{@const isPicked = selected.has(t.id)}
							<div data-testid="wizard-template-{t.id}">
								<Card compact>
									<label class="flex cursor-pointer items-start gap-3">
										<Checkbox checked={isPicked} label="" />
										<div class="flex-1">
											<div class="flex items-center gap-2 font-medium">
												<span
													class="inline-block h-3 w-3 rounded-full"
													style="background-color: {t.color}"
													aria-hidden="true"
												></span>
												{t.name}
											</div>
											<div class="mt-1 text-xs opacity-70">
												{t.fields.length} fields · {t.sections.length} sections
											</div>
										</div>
									</label>
									<input
										type="checkbox"
										checked={isPicked}
										onchange={() => toggle(t.id)}
										class="sr-only"
										aria-label="Select {t.name}"
									/>
								</Card>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			{#if applyError}
				<Alert variant="error">
					<span>Failed to write the wizard setup: {applyError}</span>
				</Alert>
			{/if}

			<div class="flex items-center gap-3">
				<Tooltip
					text={canApply
						? 'Write the selected templates to .nomad.md/'
						: 'Select at least one template to continue'}
					position="top"
				>
					<Button
						variant="primary"
						disabled={!canApply}
						loading={isApplying}
						onclick={apply}
						data-testid="wizard-apply"
					>
						{isApplying ? 'Applying…' : 'Apply and continue'}
					</Button>
				</Tooltip>
				<Button variant="ghost" onclick={cancel}>Cancel</Button>
				<span class="ml-auto text-xs opacity-60">
					Selected: {selected.size} · Required: ≥1
				</span>
			</div>
		</div>
	</main>
</div>
