/**
 * Tests for `src/lib/services/wizard.ts`.
 *
 * The wizard service is the atomic write of `.nomad.md/config.json` and
 * `.nomad.md/templates/*.json` (FR-11 / UC-5). It runs once on the
 * first-run wizard apply and is also called by the Settings panel's
 * "Reset to defaults" affordance.
 *
 * Coverage:
 *  - Empty `templateIds` throws (FR-11 requires at least one template).
 *  - Unknown template id throws with a clear message.
 *  - Happy path: writes `config.json` + every selected template.
 *  - `overwriteConfig: false` skips an existing config file.
 *  - `overwriteTemplates: false` skips an existing template file.
 *  - Custom `config` override is honoured.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryFsAdapter } from '$lib/adapters/memory-fs';
import { writeWizardSetup } from '$lib/services/wizard';
import { defaultConfig, getBuiltInTemplate } from '$lib/services/built-in-templates';

describe('writeWizardSetup — input validation', () => {
	let fs: MemoryFsAdapter;
	beforeEach(() => {
		fs = new MemoryFsAdapter();
	});

	it('rejects an empty template list (FR-11: at least one template required)', async () => {
		await expect(writeWizardSetup(fs, [])).rejects.toThrow(
			/At least one template must be selected/
		);
	});

	it('rejects an unknown template id with a clear message', async () => {
		await expect(writeWizardSetup(fs, ['bug', 'not-a-real-template'])).rejects.toThrow(
			/Unknown built-in template: not-a-real-template/
		);
	});
});

describe('writeWizardSetup — happy path', () => {
	let fs: MemoryFsAdapter;
	beforeEach(() => {
		fs = new MemoryFsAdapter();
	});

	it('writes the default config + every selected template', async () => {
		const written = await writeWizardSetup(fs, ['bug', 'task']);
		expect(written).toHaveLength(2);
		expect(written.map((t) => t.id)).toEqual(['bug', 'task']);

		// config.json was written and parses back to the default shape.
		const cfgText = await fs.readTextFile('.nomad.md/config.json');
		const cfg = JSON.parse(cfgText);
		expect(cfg.statuses.map((s: { id: string }) => s.id)).toEqual([
			'open',
			'in_progress',
			'in_review',
			'done',
			'closed'
		]);
		expect(cfg.default_status).toBe('open');

		// Each template was written verbatim from the built-in bundle.
		const bugText = await fs.readTextFile('.nomad.md/templates/bug.json');
		const bug = JSON.parse(bugText);
		expect(bug.id).toBe('bug');
		expect(bug.fields.map((f: { key: string }) => f.key)).toContain('severity');

		const taskText = await fs.readTextFile('.nomad.md/templates/task.json');
		const task = JSON.parse(taskText);
		expect(task.id).toBe('task');
	});

	it('honours a custom `config` override', async () => {
		const custom = defaultConfig();
		custom.default_status = 'in_progress';
		custom.statuses = custom.statuses.filter((s) => s.id !== 'closed');
		await writeWizardSetup(fs, ['epic'], { config: custom });
		const cfgText = await fs.readTextFile('.nomad.md/config.json');
		const cfg = JSON.parse(cfgText);
		expect(cfg.default_status).toBe('in_progress');
		expect(cfg.statuses.find((s: { id: string }) => s.id === 'closed')).toBeUndefined();
	});
});

describe('writeWizardSetup — overwrite flags', () => {
	let fs: MemoryFsAdapter;
	beforeEach(() => {
		fs = new MemoryFsAdapter();
	});

	it('skips an existing config when overwriteConfig is false (default)', async () => {
		// Pre-seed a config.
		await fs.writeTextFile(
			'.nomad.md/config.json',
			JSON.stringify({ custom: 'preserved' }, null, '\t') + '\n'
		);
		await writeWizardSetup(fs, ['bug']);
		const cfgText = await fs.readTextFile('.nomad.md/config.json');
		const cfg = JSON.parse(cfgText);
		expect(cfg.custom).toBe('preserved');
	});

	it('overwrites an existing config when overwriteConfig is true', async () => {
		await fs.writeTextFile(
			'.nomad.md/config.json',
			JSON.stringify({ custom: 'will-be-replaced' }, null, '\t') + '\n'
		);
		await writeWizardSetup(fs, ['bug'], { overwriteConfig: true });
		const cfgText = await fs.readTextFile('.nomad.md/config.json');
		const cfg = JSON.parse(cfgText);
		expect(cfg.custom).toBeUndefined();
		expect(cfg.statuses).toBeDefined();
	});

	it('skips an existing template when overwriteTemplates is false (default)', async () => {
		// Pre-seed the bug template with a custom field.
		const original = getBuiltInTemplate('bug');
		expect(original).toBeDefined();
		const tampered = { ...original, custom: 'preserved' };
		await fs.writeTextFile(
			'.nomad.md/templates/bug.json',
			JSON.stringify(tampered, null, '\t') + '\n'
		);
		await writeWizardSetup(fs, ['bug']);
		const bugText = await fs.readTextFile('.nomad.md/templates/bug.json');
		const bug = JSON.parse(bugText);
		expect(bug.custom).toBe('preserved');
	});

	it('overwrites an existing template when overwriteTemplates is true', async () => {
		const original = getBuiltInTemplate('bug');
		const tampered = { ...original, custom: 'will-be-replaced' };
		await fs.writeTextFile(
			'.nomad.md/templates/bug.json',
			JSON.stringify(tampered, null, '\t') + '\n'
		);
		await writeWizardSetup(fs, ['bug'], { overwriteTemplates: true });
		const bugText = await fs.readTextFile('.nomad.md/templates/bug.json');
		const bug = JSON.parse(bugText);
		expect(bug.custom).toBeUndefined();
		expect(bug.id).toBe('bug');
	});
});
