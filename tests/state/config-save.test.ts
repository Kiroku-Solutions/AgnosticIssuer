/**
 * Tests for `src/lib/state/config.svelte.ts` — the `save` and
 * `isReadOnly` surface added in sub-phase 7C.
 *
 * The store's `load` / `refresh` paths are already covered by
 * `tests/state/config.test.ts`. This file is the dedicated home for
 * the writer + the read-only gate.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryFsAdapter } from '$lib/adapters/memory-fs';
import { createConfigStore } from '$lib/state';
import { defaultConfig } from '$lib/services/built-in-templates';
import type {
	ReadOnlyDirectoryAdapter,
	WritableDirectoryAdapter
} from '$lib/adapters/directory-adapter';

function readOnlyStub(): ReadOnlyDirectoryAdapter {
	return {
		listDirectory: () => Promise.resolve([]),
		readTextFile: () => Promise.reject(new Error('read-only adapter: write attempted'))
	};
}

describe('configStore.save — happy path', () => {
	let fs: MemoryFsAdapter;
	beforeEach(() => {
		fs = new MemoryFsAdapter();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('writes the validated config to .quill.md/config.json', async () => {
		const store = createConfigStore(() => fs);
		const cfg = defaultConfig();
		await store.save(cfg);
		const written = await fs.readTextFile('.quill.md/config.json');
		const parsed = JSON.parse(written);
		expect(parsed.default_status).toBe('open');
		expect(parsed.statuses).toHaveLength(5);
	});

	it('updates the reactive `config` slot on success', async () => {
		const store = createConfigStore(() => fs);
		expect(store.config).toBeNull();
		const cfg = defaultConfig();
		await store.save(cfg);
		expect(store.config).toEqual(cfg);
		expect(store.status).toBe('ready');
		expect(store.error).toBeNull();
	});
});

describe('configStore.save — validation failure', () => {
	let fs: MemoryFsAdapter;
	beforeEach(() => {
		fs = new MemoryFsAdapter();
	});

	it('rejects a malformed config without writing', async () => {
		const store = createConfigStore(() => fs);
		// `default_status` references a status that does not exist.
		const bad = {
			...defaultConfig(),
			statuses: defaultConfig().statuses.slice(0, 1),
			default_status: 'in_progress'
		} as unknown as Parameters<typeof store.save>[0];
		await store.save(bad);
		expect(store.status).toBe('error');
		expect(store.error).toBeInstanceOf(Error);
		// No file was written.
		await expect(fs.readTextFile('.quill.md/config.json')).rejects.toThrow();
	});
});

describe('configStore.save — read-only adapter', () => {
	it('is a no-op when the active adapter is read-only', async () => {
		const ro: ReadOnlyDirectoryAdapter = readOnlyStub();
		const writeSpy = vi.spyOn(ro, 'readTextFile');
		const store = createConfigStore(() => ro);
		await store.save(defaultConfig());
		// The store treats the no-op as "nothing happened"; `status`
		// stays at its prior value. This is intentional — flipping it
		// to 'ready' would mask any error from a prior save and lie
		// about the disk state (no file was written).
		expect(store.status).toBe('idle');
		expect(writeSpy).not.toHaveBeenCalled();
	});

	it('isReadOnly reflects the active adapter', () => {
		const fs = new MemoryFsAdapter();
		const store = createConfigStore(() => fs as unknown as WritableDirectoryAdapter);
		expect(store.isReadOnly).toBe(false);

		const ro = readOnlyStub();
		const store2 = createConfigStore(() => ro);
		expect(store2.isReadOnly).toBe(true);
	});
});

describe('configStore.save — no active adapter', () => {
	it('sets status=error and does not throw', async () => {
		const store = createConfigStore(() => null);
		await store.save(defaultConfig());
		expect(store.status).toBe('error');
		expect(store.error).toBeInstanceOf(Error);
	});
});
