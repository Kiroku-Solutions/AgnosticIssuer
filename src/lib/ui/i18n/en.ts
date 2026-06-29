import type { Params } from './types';

export const en = {
	common: {
		save: 'Save',
		discard: 'Discard',
		close: 'Close',
		cancel: 'Cancel',
		refresh: 'Refresh',
		clear: 'Clear',
		forget: 'Forget',
		review: 'Review',
		dismiss: 'Dismiss',
		ok: 'OK',
		apply: 'Apply',
		back: 'Back',
		next: 'Next',
		loading: 'Loading…',
		empty: 'Empty',
		justNow: 'just now',
		all: 'All',
		required: 'required',
		delete: 'Delete',
		permanentDelete: 'permanently delete',
		trashDirectory: '.quill.md/.trash/',
		remoteSessionExpired: 'Remote session expired — sign in again to refresh.',
		issueCount: (params: Params) => `${params.n} issue${params.n === 1 ? '' : 's'}`,
		dirtyCount: (params: Params) => `${params.n} dirty`,
		validationErrors: (params: Params) =>
			`${params.n} validation ${params.n === 1 ? 'error' : 'errors'}`,
		integrityReview: (params: Params) =>
			`${params.n} integrity ${params.n === 1 ? 'warning' : 'warnings'}`
	},

	app: {
		name: 'Quill.md',
		version: 'v0.0.1',
		homeAria: 'quill.md home',
		logoAlt: 'quill.md logo'
	},

	modeBadge: {
		local: 'Local',
		remote: 'Remote (read-only)',
		setup: 'Setup',
		home: 'Home',
		firstRunSetup: 'First-run setup'
	},

	topbar: {
		remoteRepository: 'Remote repository',
		settingsTooltip: 'Settings',
		openSettings: 'Open settings',
		toggleMobileNav: 'Toggle mobile menu',
		ariaLabel: 'Primary navigation'
	},

	leftrail: {
		ariaLabel: 'Navigation',
		viewsHeading: 'Views',
		planningHeading: 'Planning',
		filtersHeading: 'Filters',
		view: {
			list: 'List',
			kanban: 'Kanban',
			gantt: 'Gantt',
			backlog: 'Backlog',
			sprint: 'Sprint Planner'
		},
		expandNav: 'Expand navigation',
		collapseNav: 'Collapse navigation',
		integrityBadge: (params: Params) =>
			`${params.n} integrity ${params.n === 1 ? 'warning' : 'warnings'}`,
		integrityReview: (params: Params) =>
			`Review ${params.n} integrity ${params.n === 1 ? 'warning' : 'warnings'}`,
		integrityAria: (params: Params) =>
			`${params.n} integrity ${params.n === 1 ? 'warning' : 'warnings'} — review`
	},

	integrity: {
		bannerBody: (params: Params) =>
			`${params.n} ${params.n === 1 ? 'issue file' : 'issue files'} modified outside quill.md — review before saving.`,
		editorWarning:
			'This file was modified outside quill.md. Review the contents before saving — id, relations, and section markers may have drifted.',
		dismissAria: 'Dismiss integrity warning'
	},

	home: {
		heroTitle: 'quill.md',
		heroSubtitle: 'Issues that travel with your repo',
		chooseModeAria: 'Choose a mode',
		openLocalTitle: 'Open a local folder',
		openLocalBody:
			'Pick a folder on your machine to edit issues stored under .quill.md/. Requires a Chromium-based browser.',
		openLocalButton: 'Open local folder',
		openRemoteTitle: 'Browse a remote repository',
		openRemoteBody: 'Read-only access to issues hosted on any Git provider.',
		openRemoteButton: 'Open remote',
		remoteUrlPlaceholder: 'https://github.com/owner/repo',
		remoteBranchPlaceholder: 'main',
		remotePatLabel: 'Personal Access Token (optional for public repos)',
		remotePatPlaceholder: 'ghp_…',
		remotePatHelp:
			'Stored in memory only for the duration of the session — never on disk, never in URLs.',
		fsaUnavailable:
			'Your browser does not support the File System Access API. Use Chrome, Edge, Brave, Arc, Opera, or Vivaldi for Local Edit Mode.',

		recentFolders: {
			title: 'Recent folders',
			lastOpenedAgo: (params: Params) => `Last opened ${params.label}`,
			forgetLabel: (params: Params) => `Forget ${params.name}`
		},

		howItWorks: {
			title: 'How it works',
			pickFolder: {
				title: 'Pick a folder',
				body: 'Open a folder on your machine that already has (or will hold) a .quill.md/ directory.'
			},
			browse: {
				title: 'Browse your issues',
				body: 'See the list, kanban, or gantt view of every issue the folder holds. Filter, search, and open one to read it.'
			},
			edit: {
				title: 'Edit and save',
				body: 'Change a title, tweak a status, or write a new section. Saves go straight to disk in the same folder you picked.'
			}
		}
	},

	localToolbar: {
		newIssue: '+ New issue',
		importIssue: 'Import .md',
		importIssueFailed: (params: Params) => `Failed to import: ${params.msg}`,
		refresh: '↻ Refresh',
		refreshReadOnlyTooltip: 'Read-only — sign out to edit locally',
		trashButton: (params: Params) => `Trash (${params.n})`,
		trashEmptyLabel: 'Empty',
		trashAria: (params: Params) =>
			`Trash contains ${params.n} ${params.n === 1 ? 'file' : 'files'}. Click to empty.`
	},

	remoteToolbar: {
		view: (params: Params) => `${params.n} ${params.n === 1 ? 'issue' : 'issues'} (read-only)`,
		signOut: 'Sign out',
		lastFetchedAria: (params: Params) => `Last fetched ${params.label}`,
		lastFetched: (params: Params) => `Last fetched: ${params.label}`,
		notYetFetched: 'Not yet fetched',
		dismissErrorAria: 'Dismiss error'
	},

	refreshPatPrompt: {
		title: 'Refresh remote',
		body: 'The remote subtree will be re-fetched. Provide a Personal Access Token so the proxy can authenticate against the Git provider. The token is held in memory only.',
		label: 'Personal Access Token',
		refreshing: 'Refreshing…',
		closeAria: 'Close'
	},

	newIssueModal: {
		title: 'New issue',
		closeAria: 'Close new-issue dialog',
		searchPlaceholder: 'Search types…',
		noMatch: (params: Params) => `No types match "${params.q}".`,
		fieldCount: (params: Params) => `${params.n} field${params.n === 1 ? '' : 's'}`,
		sectionCount: (params: Params) => `${params.n} section${params.n === 1 ? '' : 's'}`,
		selectType: (params: Params) => `Select ${params.name}`,
		create: 'Create'
	},

	emptyTrashModal: {
		title: 'Empty trash?',
		closeAria: 'Close empty-trash dialog',
		alreadyEmpty: 'The trash is already empty.',
		confirmBody: (params: Params) =>
			`This will permanently delete ${params.n} ${params.n === 1 ? 'file' : 'files'} from .quill.md/.trash/. This cannot be undone.`,
		confirm: 'Empty trash'
	},

	editor: {
		tabs: {
			form: 'Form',
			write: 'Write',
			preview: 'Preview'
		},
		closeAria: 'Close editor',
		sectionsAria: 'Sections',
		noSectionsEdit: 'No sections to edit.',
		noSectionsPreview: 'No sections to preview.',
		readOnlySaveTooltip: 'Read-only — open locally to save',
		readOnlyDiscardTooltip: 'Read-only — open locally to discard',
		deleteTooltip: 'Move to trash',
		unsaved: 'Unsaved changes',
		footerClose: 'Close'
	},

	formFields: {
		issueTypeDisabledNote:
			'Issue type cannot be changed after creation — create a new issue instead.',
		assigneePlaceholder: 'Unassigned',
		selectPlaceholder: 'Select…',
		noIssues: 'No issues',
		changeTypeTitle: 'Change issue type?',
		changeTypeBody: (params: Params) =>
			`Switching from "${params.old}" to "${params.new}" will reload the editor with the new template. Unsaved changes will be lost.`,
		changeTypeConfirm: 'Change type',
		changeTypeCancel: 'Cancel',
		changeTypeAria: (params: Params) => `Confirm change from ${params.old} to ${params.new}`,
		relationTypes: {
			parent: 'Parent',
			child: 'Child',
			blocks: 'Blocks',
			depends_on: 'Depends On',
			relates_to: 'Relates To'
		},
		addRelation: 'Add relation',
		removeRelationAria: 'Remove relation'
	},

	markdown: {
		previewAria: 'Gantt timeline',
		renderFailed: '<p class="text-error">Failed to render preview.</p>'
	},

	settings: {
		title: 'Settings',
		closeAria: 'Close settings',
		backdropAria: 'Close settings',
		themeHeading: 'Theme',
		themeLight: 'Light',
		themeDark: 'Dark',
		themeSystem: 'System',
		themeSystemHint: (params: Params) => `Following the OS preference (${params.now} right now).`,
		languageHeading: 'Language',
		languageEn: 'English',
		languageEs: 'Español',
		corsHeading: 'CORS proxy',
		corsPlaceholder: '(not configured)',
		corsNote: 'Editing this value requires re-saving your config.json. Coming in a follow-up.',
		recentHeading: 'Recent folders',
		commandsHeading: 'Commands',
		clearCache: 'Clear remote cache',
		clearCacheBusy: 'Clearing…',
		clearCacheDone: 'Cache cleared. The next refresh will re-fetch the subtree.',
		clearCacheError: (params: Params) => `Failed to clear cache: ${params.message}`,
		clearCacheRemoteTooltip: 'Clear the cached remote clone for this repository',
		clearCacheSignInTooltip: 'Sign in to a remote repository to enable this',
		emptyTrash: (params: Params) => `Empty trash${Number(params.n) > 0 ? ` (${params.n})` : ''}`,
		emptyTrashLocalTooltip: 'Empty the local .quill.md/.trash/ folder',
		emptyTrashSignInTooltip: 'Open a local folder to enable this'
	},

	list: {
		countPill: (params: Params) =>
			`${params.filtered} of ${params.total} ${params.total === 1 ? 'issue' : 'issues'}`,
		sortLabel: (params: Params) => `Sort: ${params.key} (${params.dir})`,
		rowAria: (params: Params) => `Open issue ${params.id}: ${params.title}`,
		empty: 'No issues match the current filter.',
		headers: {
			id: 'id',
			title: 'title',
			type: 'type',
			status: 'status',
			assignee: 'assignee',
			labels: 'labels',
			updated: 'updated'
		}
	},

	kanban: {
		cardAria: (params: Params) => `Issue ${params.id}: ${params.title} in column ${params.col}`,
		readOnlyTooltip: 'Read-only — open this issue locally to change its status',
		pickedUp: (params: Params) =>
			`Picked up issue ${params.id}. Use arrow keys to move, Space or Enter to drop, Escape to cancel.`,
		dropped: (params: Params) => `Dropped issue ${params.id} in column ${params.col}`,
		cancelled: (params: Params) => `Cancelled move of issue ${params.id}.`,
		activateHint: 'Press F2 to open the issue editor'
	},

	gantt: {
		emptyTitle: 'No issues are scheduled yet',
		emptyBody: 'Add start and end dates to issues in the Editor to see them on the Gantt.',
		ariaLabel: 'Gantt timeline',
		roleDescription: 'gantt timeline',
		barAria: (params: Params) => `Issue ${params.id}: ${params.title}`,
		barDescription: (params: Params) =>
			`Status ${params.status}, type ${params.type}, group ${params.group}. ` +
			`Starts ${params.start ?? 'unknown'}, ` +
			(params.end ? `ends ${params.end}.` : `duration ${params.duration ?? '?'} days.`),
		truncation: '…',
		fallbackSummary: 'Textual fallback (NFR-4 accessibility)',
		fallbackEmpty: 'No issues match the current filter.',
		fallbackNotScheduled: 'Not scheduled',
		fallbackHeaders: {
			id: 'id',
			title: 'title',
			type: 'type',
			status: 'status',
			group: 'group',
			start: 'start',
			endOrDuration: 'end / duration'
		},
		duration: (params: Params) => `${params.n} d`
	},

	filter: {
		searchLabel: 'Search',
		searchPlaceholder: 'title or section body…',
		statusLabel: 'Status',
		typeLabel: 'Type',
		typePlaceholder: 'bug, task…',
		clearButton: 'Clear'
	},

	theme: {
		switchToLight: 'Switch to light theme',
		switchToDark: 'Switch to dark theme'
	},

	proxy: {
		dismissAria: 'Dismiss proxy warning'
	},

	wizard: {
		headTitle: 'Set up your issue tracker',
		headBody:
			'Your folder does not have a .quill.md/ configuration yet. Pick a path below to get started. You can edit or add templates later from the Settings panel.',
		step1Title: '1. Choose how to set up templates',
		step2Title: '2. Pick the templates you need',
		step2Body:
			'Select at least one. Selected templates are written to .quill.md/templates/ verbatim.',
		builtinTitle: 'Use built-in templates',
		builtinBody:
			'Pick from the six bundled issue types: Epic, Use Case, User Story, Task, Bug, Sprint. Recommended for most projects.',
		builtinAria: 'Use built-in templates',
		customTitle: 'Create your own',
		customBody:
			'Author one or more templates from scratch (coming soon). You can also add templates later from Settings.',
		customAria: 'Create your own templates (coming soon)',
		customTooltip: 'Coming soon — the in-app template editor is a future step',
		applyButton: 'Apply and continue',
		applyTooltip: 'Write the selected templates to .quill.md/',
		applyTooltipDisabled: 'Select at least one template to continue',
		applying: 'Applying…',
		cancel: 'Cancel',
		noFolder: 'No local folder is open. Use "Open local folder" on the home page.',
		applyError: (params: Params) => `Failed to write the wizard setup: ${params.msg}`,
		summary: (params: Params) => `Selected: ${params.selected} · Required: ≥1`,
		selectTemplateAria: (params: Params) => `Select ${params.name}`,
		templateFields: (params: Params) => `${params.n} fields`,
		templateSections: (params: Params) => `${params.n} sections`
	},
	sprint: {
		progress: 'Sprint Progress',
		stories: 'Stories',
		points: 'Story Points',
		progressLabel: 'Progress',
		pointsUnit: 'pts'
	},
	backlogView: {
		tabEpic: 'By Epic',
		tabUseCase: 'By Use Case',
		unparented: 'Unclassified Stories',
		noStories: 'No stories in this group.'
	},
	sprintPlanner: {
		selectSprint: 'Select a Sprint to plan',
		unlink: 'Unlink',
		linkStory: 'Link Story',
		noUnassigned: 'All user stories are assigned to Sprints!',
		unassignedHeader: 'Unassigned User Stories',
		storiesInSprint: 'Stories in Sprint',
		noSprints: 'No Sprints created yet. Create a Sprint issue to start planning!',
		emptySprint: 'This sprint has no stories. Link some below!',
		readyToPlan: 'Ready to Plan',
		needsRefinement: 'Requires Refinement (Missing Epic)',
		linkDisabledTooltip:
			'This story must be linked to an Epic before it can be assigned to a Sprint.'
	}
};

export type Translations = typeof en;
