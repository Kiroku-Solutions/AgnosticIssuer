<!--
	Alert.svelte — daisyUI `.alert` wrapper.

	Renders a coloured alert banner with a × close button when `onclose`
	is provided. The icon area is reserved (slot reserved) but the
	children fill the body.

	Props:
	  variant: 'info' | 'success' | 'warning' | 'error'
	  onclose: optional close handler; when set, a × button is rendered
	  class:   string  — extra utility classes
	  children: Snippet
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'info' | 'success' | 'warning' | 'error';

	type Props = {
		variant: Variant;
		onclose?: () => void;
		class?: string;
		children?: Snippet;
	};

	let { variant, onclose, class: extraClass = '', children }: Props = $props();

	const variantClass = $derived(
		variant === 'error'
			? 'bg-[var(--color-cb-down)]/10 border-[var(--color-cb-down)] text-ink'
			: variant === 'warning'
				? 'bg-[var(--color-cb-yellow)]/10 border-[var(--color-cb-yellow)] text-ink'
				: variant === 'success'
					? 'bg-[var(--color-cb-up)]/10 border-[var(--color-cb-up)] text-ink'
					: 'bg-surface-strong border-hairline text-ink'
	);
</script>

<div
	role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
	class="flex items-start gap-4 p-4 rounded-xl border {variantClass} {extraClass}"
>
	<div class="flex-1 font-sans text-sm">
		{#if children}{@render children()}{/if}
	</div>
	{#if onclose}
		<button
			type="button"
			aria-label="Close"
			class="shrink-0 p-1 rounded-full text-muted hover:bg-black/5 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
			onclick={onclose}
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
		</button>
	{/if}
</div>
