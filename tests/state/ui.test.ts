/**
 * Tests for `src/lib/state/ui.svelte.ts`.
 *
 * `UiStore` is the smallest reactive surface for cross-component
 * chrome flags. It has no async, no filesystem, and no dependencies.
 * The tests pin the open / close / toggle contract for the two slots
 * (`settingsOpen`, `editorOpen`) and verify they are independent.
 */
import { describe, expect, it } from 'vitest';
import { createUiStore } from '$lib/state';

describe('UiStore — defaults', () => {
	it('starts with both panels closed', () => {
		const ui = createUiStore();
		expect(ui.settingsOpen).toBe(false);
		expect(ui.editorOpen).toBe(false);
	});
});

describe('UiStore — settings panel', () => {
	it('openSettings flips the slot to true', () => {
		const ui = createUiStore();
		ui.openSettings();
		expect(ui.settingsOpen).toBe(true);
	});

	it('closeSettings flips the slot back to false', () => {
		const ui = createUiStore();
		ui.openSettings();
		ui.closeSettings();
		expect(ui.settingsOpen).toBe(false);
	});

	it('toggleSettings flips the current value', () => {
		const ui = createUiStore();
		ui.toggleSettings();
		expect(ui.settingsOpen).toBe(true);
		ui.toggleSettings();
		expect(ui.settingsOpen).toBe(false);
	});
});

describe('UiStore — editor panel', () => {
	it('openEditor / closeEditor / toggleEditor mirror the settings surface', () => {
		const ui = createUiStore();
		ui.openEditor();
		expect(ui.editorOpen).toBe(true);
		ui.toggleEditor();
		expect(ui.editorOpen).toBe(false);
		ui.closeEditor();
		expect(ui.editorOpen).toBe(false);
	});
});

describe('UiStore — independence', () => {
	it('opening settings does not change editor state', () => {
		const ui = createUiStore();
		ui.openSettings();
		expect(ui.editorOpen).toBe(false);
	});

	it('opening editor does not change settings state', () => {
		const ui = createUiStore();
		ui.openEditor();
		expect(ui.settingsOpen).toBe(false);
	});

	it('two stores do not share state', () => {
		const a = createUiStore();
		const b = createUiStore();
		a.openSettings();
		expect(b.settingsOpen).toBe(false);
	});
});
