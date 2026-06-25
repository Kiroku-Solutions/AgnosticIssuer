<!--
	Badge.svelte — daisyUI `.badge` wrapper.

	Props:
	  variant: 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline'
	  size:    'sm' | 'md' | 'lg' (default 'md')
	  class:   string  — extra utility classes
	  children: Snippet
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant =
		| 'neutral'
		| 'primary'
		| 'secondary'
		| 'success'
		| 'warning'
		| 'error'
		| 'ghost'
		| 'outline';
	type Size = 'sm' | 'md' | 'lg';

	type Props = {
		variant?: Variant;
		size?: Size;
		class?: string;
		children?: Snippet;
	};

	let { variant = 'neutral', size = 'md', class: extraClass = '', children }: Props = $props();

	const variantClass = $derived(
		variant === 'primary' ? 'bg-primary text-on-primary' :
		variant === 'secondary' ? 'bg-surface-dark text-on-dark' :
		variant === 'success' ? 'bg-[var(--color-cb-up)]/10 text-[var(--color-cb-up)]' :
		variant === 'warning' ? 'bg-[var(--color-cb-yellow)]/10 text-ink' :
		variant === 'error' ? 'bg-[var(--color-cb-down)]/10 text-[var(--color-cb-down)]' :
		variant === 'outline' ? 'bg-transparent border border-hairline text-ink' :
		variant === 'ghost' ? 'bg-transparent text-ink' :
		'bg-surface-strong text-ink'
	);
	const sizeClass = $derived(
		size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 
		size === 'lg' ? 'px-4 py-1.5 text-sm' : 
		'px-3 py-1 text-xs'
	);
</script>

<span class="inline-flex items-center justify-center font-sans uppercase font-semibold tracking-wider rounded-pill {variantClass} {sizeClass} {extraClass}">
	{#if children}{@render children()}{/if}
</span>
