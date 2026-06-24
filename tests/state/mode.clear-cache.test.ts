/**
 * Tests for `ModeStore.clearRemoteCache` (sub-phase 7C).
 *
 * Three branches:
 *  1. No session, no explicit key → throws `RemotePatRequiredError`.
 *  2. Active session, no explicit key → derives the key from
 *     `_patScope` and forwards to `clearCache`.
 *  3. Explicit key → validates via `isCacheKey` and forwards.
 *
 * The real `clearCache` import is the one exercised by the adapter
 * test suite; here we inject a fake through the test seam (the
 * `adapters/remote-git` module is the production dependency). The
 * approach used: spy on the production `clearCache` and assert the
 * call shape.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as remoteGit from '$lib/adapters/remote-git';
import { createModeStore, RemotePatRequiredError } from '$lib/state';
import { createStateContext } from '$lib/state';
import { handleStore as realHandleStore } from '$lib/adapters/handle-store';
import type { Branch, CacheKey, RepoUrl } from '$lib/adapters/remote-git';
import { MemoryFsAdapter } from '$lib/adapters/memory-fs';

function makeRepoUrl(url = 'https://github.com/acme/widgets'): RepoUrl {
	return url as RepoUrl;
}

function makeBranch(branch = 'main'): Branch {
	return branch as Branch;
}

beforeEach(() => {
	// Stub the handle store to avoid touching IndexedDB in Node.
	vi.spyOn(realHandleStore, 'getActive').mockResolvedValue(null);
	vi.spyOn(realHandleStore, 'getRecent').mockResolvedValue([]);
	vi.spyOn(realHandleStore, 'setActive').mockResolvedValue();
	vi.spyOn(realHandleStore, 'clearActive').mockResolvedValue();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('clearRemoteCache — no session', () => {
	it('throws RemotePatRequiredError when no key is supplied and no session is active', async () => {
		const ctx = createStateContext(new MemoryFsAdapter());
		const mode = createModeStore(ctx);
		await expect(mode.clearRemoteCache()).rejects.toBeInstanceOf(RemotePatRequiredError);
	});

	it('passes a valid key straight through to clearCache', async () => {
		const clearCacheSpy = vi.spyOn(remoteGit, 'clearCache').mockResolvedValue(undefined as void);
		const ctx = createStateContext(new MemoryFsAdapter());
		const mode = createModeStore(ctx);
		// Build a synthetic 40-hex SHA so makeCacheKey's brander accepts
		// it (production never calls makeCacheKey with 'pending' — the
		// clear path uses clearCacheForUrl directly).
		const fakeSha = 'a'.repeat(40) as unknown as remoteGit.Sha;
		const key = remoteGit.makeCacheKey(makeRepoUrl(), makeBranch(), fakeSha);
		await mode.clearRemoteCache(key as unknown as CacheKey);
		expect(clearCacheSpy).toHaveBeenCalledWith(key);
	});
});

describe('clearRemoteCache — active session', () => {
	it('derives the (url, branch) from the active session when no key is supplied', async () => {
		const clearCacheForUrlSpy = vi
			.spyOn(remoteGit, 'clearCacheForUrl')
			.mockResolvedValue(undefined as void);
		const ctx = createStateContext(new MemoryFsAdapter());
		const mode = createModeStore(ctx);
		// Stub fetchSubtree to avoid network.
		const fakeAdapter = {
			listDirectory: () => Promise.resolve([]),
			readTextFile: () => Promise.reject(new Error('not used'))
		};
		vi.spyOn(remoteGit, 'fetchSubtree').mockResolvedValue({
			url: makeRepoUrl(),
			branch: makeBranch(),
			sha: 'pending' as unknown as remoteGit.Sha,
			adapter: fakeAdapter as unknown as remoteGit.ReadonlyRemoteAdapter,
			cacheKey: 'pending-key' as unknown as CacheKey,
			proxyWarning: 'warning'
		});
		await mode.openRemote({ url: makeRepoUrl(), branch: makeBranch() }, 'test-pat');
		clearCacheForUrlSpy.mockClear();
		await mode.clearRemoteCache();
		expect(clearCacheForUrlSpy).toHaveBeenCalledTimes(1);
		const [calledUrl, calledBranch] = clearCacheForUrlSpy.mock.calls[0]!;
		expect(calledUrl).toBe('https://github.com/acme/widgets');
		expect(calledBranch).toBe('main');
	});
});
