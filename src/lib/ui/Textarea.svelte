<!--
	Textarea.svelte — daisyUI `.textarea .textarea-bordered` wrapper.

	Mirrors the Input API for multi-line text. Same `aria-describedby`
	error pattern: the error text is rendered below the field with the
	input wired to its id.

	Props:
	  value:       string
	  placeholder: string
	  error:       string | null
	  disabled:    boolean
	  class:       string         — extra utility classes
-->
<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Props = {
		value: string;
		placeholder?: string;
		error?: string | null;
		disabled?: boolean;
		class?: string;
		rows?: number;
	} & Omit<HTMLTextareaAttributes, 'value' | 'class' | 'rows'>;

	let {
		value = $bindable(),
		placeholder = '',
		error = null,
		disabled = false,
		class: extraClass = '',
		rows = 4,
		...rest
	}: Props = $props();

	const errorId = $derived(error ? `textarea-error-${Math.random().toString(36).slice(2, 8)}` : '');
</script>

<div class="flex flex-col gap-1 w-full">
	<textarea
		{placeholder}
		{disabled}
		{rows}
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? errorId : undefined}
		class="w-full bg-background text-foreground rounded-md border border-border p-4 transition-shadow duration-[var(--motion-fast)] ease-[var(--ease-out)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary focus:border-transparent placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed resize-y {error
			? 'ring-2 ring-inset ring-error border-transparent'
			: ''} {extraClass}"
		{...rest}></textarea>
	{#if error}
		<p id={errorId} class="text-error text-sm mt-1" role="alert">{error}</p>
	{/if}
</div>
