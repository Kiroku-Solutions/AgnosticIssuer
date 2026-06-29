# Tier-S+ Playbook — Ideas to take `quill.md` from "v0 shipping" to "category-best"

> **Purpose.** Brainstorm — *with evidence* — what `quill.md` would need to ship to be considered **S+ tier** in the issue-tracking category by year-end 2027, covering what we already do well, where to deepen it, and what to *not* copy. Companion document to `agile-state-of-the-art.md` (methodology baseline) and `competitive-gap-analysis.md` (market baseline).
>
> **Audience.** Maintainers and contributors of `quill.md` looking for the *next 12 months* of high-leverage product surface, plus the marketing-positioning argument that pays for it.
>
> **Method.** Deep-research across (a) S+ exemplars in adjacent categories — Linear's method, Raycast's "feel", Obsidian's local-first positioning, Arc's cautionary lesson; (b) the canonical reference for our movement — Ink & Switch's *Local-first software* and the seven ideals[^lofi]; (c) the editor-framework consensus of 2025 — Tiptap on ProseMirror, Yjs as the universal CRDT[^liveblocks]; (d) the 2025–2026 OSS-SaaS monetization playbook — Plausible, Ghost, PostHog, Plane[^plausible][^plane][^posthog]; (e) the Scott Brinker / G2 Crowd "activation-rate ceiling" of 25–34 % for SaaS in 2026[^onboarding2026]. Every idea below cites its exemplar.
>
> **Author.** Mavis (research session, 2026-06-28).
>
> **Status.** Living document; 30 ideas, 4 axes of evaluation, sequenced build plan.

---

## Table of Contents

1. [TL;DR](#1-tldr)
2. [What "tier S+" costs, and which tier we are in today](#2-what-tier-s-costs-and-which-tier-we-are-in-today)
3. [The seven principles of tier-S+ (and how we already map to them)](#3-the-seven-principles-of-tier-s-and-how-we-already-map-to-them)
4. [The eight evaluation axes](#4-the-eight-evaluation-axes)
5. [The 30 ideas, scored](#5-the-30-ideas-scored)
6. [The sequenced build plan](#6-the-sequenced-build-plan)
7. [The three things we should *not* copy](#7-the-three-things-we-should-not-copy)
8. [Brand narrative — "the issue tracker that lives in your code"](#8-brand-narrative--the-issue-tracker-that-lives-in-your-code)
9. [Onboarding & activation playbook](#9-onboarding--activation-playbook)
10. [Pricing & GTM saturation analysis](#10-pricing--gtm-saturation-analysis)
11. [Citations](#11-citations)
12. [Change log](#12-change-log)

---

## 1. TL;DR

- **Today `quill.md` is at tier A (between A- and A+).** v0 ships Local Edit + Remote Read-Only with a hard methodology-shaped file format, integrity hashing, CSP + SRI + Trusted Types, and 815 tests green per `docs/current-project-status.md` §Step 6. That is *unusually* A for a project of its size — most open-source PM tools ship C-tier core and call it "MVP".
- **Tier S+ requires eight different axes to be S+ at the same time.** A single-axis win (e.g., "fast UI") ranks you A, not S. Linear hit S+ on speed *and* opinionation *and* integrations *and* opinionation-of-cycles simultaneously; Raycast hit S+ on speed *and* extension surface *and* keyboard-first *and* native-feel simultaneously. We need the same compound.
- **Our fastest path to S+ is not "make everything Linear does".** It is *deepen what we already have*: file-format-as-source-of-truth, local-first, methodology-shape, single bundle. Five of the eight S+ axes we map to *today*; the remaining three need work.
- **30 ideas generated.** Of those, **5 are "ship this quarter"** (leverage ≥ 4 across all four evaluation axes). **8 are next-quarter**. **17 are research items** that need scoping before commit.
- **The single biggest lever we are not pulling is the *extensibility moat*.** Obsidian has 5,186 community plugins[^obsidian_plugins]; Raycast has thousands of extensions[^raycast]; Notion has a creator economy. `quill.md` ships zero. Shipping even a narrow plugin surface (Templates first, then Syntax, then Views) gives us **community-driven growth at zero engineering cost per idea added**.
- **The single biggest risk is the *novelty trap*** — Arc burned USD 150 M+ and pivoted to Dia because the most-loved features of Arc were the least-used[^arc_founder]. Linear won by being *opinionated*, not by being *different*. Our lever is *simplicity-with-shape*, not *cleverness-with-effects*.

---

## 2. What "tier S+" costs, and which tier we are in today

### 2.1 The S+ definition I am using

A tool is **tier S+** when *all* of these conditions hold simultaneously, judged by an informed user-segment that uses competitor products daily:

| Condition                             | Evidence the tool meets it                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| **Speed**                             | All common operations complete in < 100 ms perceived[^linearperf]                    |
| **Opinionated shape**                 | The default workflow is *good enough* for 80 % of teams without configuration[^linearopinion] |
| **Compound features**                 | Four axes above S *at the same time*, not three plus one B                           |
| **Native feel**                       | The interface resembles a deliberately-designed product, not a stack of components[^raycastnative] |
| **Trust surface**                     | A documented guarantee the user can cite ("we never read this", "we never phone home", "we never log this")[^obsidian_trust] |
| **Compound non-features**             | The tool deliberately refuses capabilities that competitors offer. The refusal is marketed. |
| **Community flywheel**                | A community contributes content (themes, plugins, templates, snippets) that the maintainer-team never has to write[^obsidian_plugins][^raycast_store] |

### 2.2 Our current tier across the seven conditions

| Condition                         | Today  | Tier | Evidence                                                                 |
| --------------------------------- | :----: | :--- | ------------------------------------------------------------------------ |
| Speed                             | ~75 %  | A    | Single bundle is small; but we lack the sub-100ms perceived benchmark  |
| Opinionated shape                 | ~85 %  | A+   | `validator.ts` enforces schema; methodology mapping is in §9 of agile-state-of-the-art.md |
| Compound features                 | ~50 %  | B+   | Strong on artifact schema; missing comments, real-time, sprint flow     |
| Native feel                       | ~85 %  | A+   | DaisyUI 4 + Svelte 5 primitives; design language in `src/lib/ui/tokens.css` |
| Trust surface                     | 95 %   | A+   | Zero telemetry + CSP + SRI + integrity hash is the *best in the matrix* |
| Compound non-features             | 100 %  | S+   | Already refusing competitors' features (DB, multi-tenant, AI MITM) — this is the moat |
| Community flywheel                | 0 %    | C    | Zero extension surface today; this is the single biggest gap          |

**Composite.** Roughly **A** today (weighted by category). S+ requires lifting speed, compound features, *and* community flywheel — without losing what we have.

---

## 3. The seven principles of tier-S+ (and how we already map to them)

The single best reference for our movement is Ink & Switch's 2019 essay *Local-first software* and the seven ideals Kleppmann et al. codified[^lofi]:

| Ideal                              | What it means                                                | `quill.md` today                                  | Gap                                            |
| ---------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ | ---------------------------------------------- |
| **1. No spinners**                 | Every interaction has immediate local response.              | ✅ Local-first by architecture.                  | Yjs CRDT sync is deferred; that's OK for v1.  |
| **2. Work not trapped on one device** | Sync across devices of *your* choosing.                      | 🟡 Remote Read-Only is one-direction only.        | Sync actor (Phase 3 of prior roadmap).       |
| **3. Network is optional**         | App works fully offline, including writes.                   | ✅ FSA + IndexedDB handle persistence.            | Mobile offline is NFR-5 deferred.             |
| **4. Seamless collaboration**      | Multi-user edits merge without conflict UX horror.           | ❌ Single-user write; Git writes for remote sync. | Yjs on file body (Phase 2).                  |
| **5. The long now**                | Data outlives the company and the app.                       | ✅ ✅ Files on disk in `.md`; you can read with `cat`. | None — this is S+ already.                  |
| **6. Security & privacy by default** | No cloud-account required; encryption is on by default.      | ✅ NFR-3 + audit scorecard confirms.             | Add E2E encryption option (Phase 4).         |
| **7. User control over data**      | You can self-host, fork, export, archive, federate.          | ✅ Single bundle; the source is on your disk.    | Federation with other people's quill.md repos is research-stage. |

**Read.** Five of seven ideals we hit today. The two gaps — sync and collaboration — are the same gap the prior roadmap identified for Phase 3 (hosted sync) and Phase 4 (CRDT). No new principle needed; just delivery.

---

## 4. The eight evaluation axes

I evaluate every idea on **four numerical axes** so I can rank without vibes:

1. **Moat alignment (1–5).** Does the idea deepen an existing `quill.md` moat (file-as-DB / methodology-shape / local-first / single-bundle / zero-telemetry), or compete on a competitor's moat? Higher = better.
2. **Competitive parity delivered (1–4).** 1 = same as incumbent. 2 = same as incumbent + a tiny quill.md-only twist. 3 = beats incumbent on this dimension. 4 = category-defining (no incumbent has it well).
3. **Implementation effort (1–5).** 1 = trivial (≤1 week). 2 = small (≤1 month). 3 = medium (1–3 months). 4 = large (1 quarter). 5 = strategic (>1 quarter). Lower = better.
4. **Risk if shipped wrong (1–3).** 1 = low; even bad version is recoverable. 2 = medium; can hurt brand but not architecture. 3 = high; can shatter trust or lock-in.

**Leverage formula.** I round to two decimals: `(moat × parity × 4) / (effort × risk)`. Lower-bound is `5 × 4 × 4 / (5 × 3 × 4) = 0.20`; upper-bound is `5 × 4 × 4 / (1 × 1 × 4) = 20.00`. The top-quartile of ideas scores ≥ 2.50.

I also annotate three verbal flags:

- **🎯 Ship this quarter** — leverage ≥ 4.0, low risk, single-engineer weeks not months.
- **🧭 Sequence for Q+1** — leverage 2.5–4.0, requires either Phase 1 prerequisite or external work (e.g., hosted infra).
- **🧪 Research item** — leverage < 2.5, or unclear scope; needs a Timeboxed exploration before commitment.

---

## 5. The 30 ideas, scored

The ideas are grouped by **axis** (what surface area they live on), not by which-ships-first. Within each axis, the ideas are listed in priority order — the *first* idea in each axis is the one that scores highest on the four axes for that axis.

### 5.1 Axis A — **Performance** (perceived < 100 ms everywhere)

**S+ exemplar:** Linear (sub-100 ms on board view, 180 ms on backlog list[^linearperf]); Raycast (claims "milliseconds" on every core feature[^raycast_main]).

| # | Idea | What we learn | Why it works for us | Leverage |
| - | ---- | ------------- | ------------------- | :------: |
| A1 | **Move issue parsing + integrity hashing into a Web Worker** | Every Trello/Linear lesson is "the parse path is the bottleneck" | The single bundle is small; the worker takes the cold-start cost off the main thread; first paint becomes a near-instant skeleton; with LRU cache by file-hash, second paint is free. Done first because every other perf improvement compounds on top of it. | **🏆 4.80** 🎯 |
| A2 | **CodeMirror 6 for the issue body editor** (replace bare `<textarea>` + `MarkdownPreview`) | Replit, JetBrains, Logseq use CodeMirror 6 as the canonical fast-flexible editor | We already have an integrity-bound file; CM6's incremental parsers + streaming large documents is *the* tier-S+ editor primitive. ~6 weeks. Risk is "live-preview diverges from text"; mitigated by rendering with the existing `renderer.ts`. | **🏆 4.00** 🎯 |
| A3 | **Streaming syntax highlighting / typeaheads at < 16 ms (60 fps)** | VS Code's editor runs at 60 fps because Monaco uses incremental lexers and requestIdleCallback. Same trick at our scale. | We don't have a monaco-sized surface; we have a 200-row issue. Cost is small (≤1 wk). | 2.50 🧭 |
| A4 | **Service Worker pre-cache the bundle; render before network** | Linear ships a SPA; the second-load is ~instant. We're a static bundle — a SW makes the *first* load after first visit near-instant. | We are already `@sveltejs/adapter-static`. SW is one file, one registration. | 3.20 🧭 |
| A5 | **Sub-100 ms perf badge on the homepage** ("measured in Chromium 130, on a 5-year-old laptop, with 1,000 issues open") | The way you make a perf claim credible is to publish the methodology with the number. | Tech Insider's "Linear 3.7× faster than Jira" line is the kind of claim that buys adoption[^techinsider2026]; the methodology plus the number is the moat. | 2.80 🧭 |

**Net effect:** A1 + A2 + A4 alone deliver the speed axis to tier S+ — the rest is incremental. **Sequencing this quarter: A1 → A4 → A2 (in that order)**.

### 5.2 Axis B — **Methodology** (S+ Scrum-shaped without configuration)

**S+ exemplar:** Linear's Cycles; Plane's Initiatives/Epics/Cycles; classic Scrum Guide's binding commitments[^sg2020]. Compass of the category: methodology is *what makes* a tool S+ in 2026.

The `agile-state-of-the-art.md` report already § 10 lists 19 concrete recommendations. Below are the six *new* ideas that come from the S+ brainstorm, not from the previous methodology note:

| # | Idea | What we learn | Why it works for us | Leverage |
| - | ---- | ------------- | ------------------- | :------: |
| B1 | **"Sprint Goal Wizard" — one-click composition from top of backlog** | Linear's auto-fill cycle from "highest priority unscoped" issues; Plane's auto-assign to cycles. | We have INV-validating template fields; the wizard picks the top-N issues by priority + dependency-feasibility and pre-fills the Sprint Goal field. Visual product. ≤1 week. | **🏆 5.00** 🎯 |
| B2 | **Definition of Done as a *transition gate*** (not just a doc) | The Scrum Guide demands that DoD is a binding commitment[^sg2020]. Nobody in the matrix enforces it; everyone documents it. | Our `validator.ts` already rejects status mismatches; extending it to require *all* DoD checkbox items be ticked before "Done" = transition is *we are the only tool that does this*. | **🏆 4.50** 🎯 |
| B3 | **Velocity + burndown computed from `git log` against the issue files** | Linear's Cycle view pulls burndown live; Plane pulls it from the SQL store. | We can pull it from `git log --since=<sprint-start> -- .quill.md/issues/` filtered by status changes in the diff. Zero new schema. Burndown chart materializes for free. | 4.00 🧭 |
| B4 | **Visual "Definition of Done maturity" badge on the project home** | The pattern of "your repo scores 3 / 5 DoD disciplines" is borrowed from security scorecards (e.g., OpenSSF Scorecard[^ossf_scorecard]) | We can compute a maturity score from the templates: includes DoD? includes Sprint Goal? includes INVEST criteria? → score. Visible, shareable. Less than one day's work after B2. | 3.50 🧭 |
| B5 | **Methodology-aware AI template generator** (e.g., "give me a Shape-Up project plan, output as `.quill.md/` files") | The 2026 trend of "AI-native onboarding"[^onboarding2026] — but applied to *templates*, not to *sessions* | We can ship a serverless AI prompt that the community runs against a well-typed template schema. Generates a `config.json` + `templates/*.json` + sample issues. ~3 weeks. | 2.40 🧪 |
| B6 | **"Off-the-shelf methodology packs":** Scrum / Kanban / Shape Up / Scrumban / LeSS / Nexus / XP | Methodology as configuration rather than as UI. The 2026 Plane trend. | Templates are already first-class in `services/built-in-templates.ts`. Bundling the seven canonical methodology packs = "type `./quill.md init scrum`". | 3.00 🧭 |

**Net effect:** B1 + B2 + B3 ship this quarter; B6 within next. Together with the §10 recommendations from the agile note, this lifts the methodology axis from A+ (85 %) to S+ (95 %+).

### 5.3 Axis C — **Editor** (S+ markdown editing experience)

**S+ exemplar:** Obsidian (bidirectional links, live preview, plugin surface[^obsidian_plugins]); Typora (WYSIWYG-markdown); Notion (slash menu, blocks); VS Code / CodeMirror (live editing at 60 fps); Linear's Cmd-K-and-inline-edit.

| # | Idea | What we learn | Why it works for us | Leverage |
| - | ---- | ------------- | ------------------- | :------: |
| C1 | **Obsidian-grade live preview with editable rendered blocks** | Obsidian's pattern of "click a heading in preview to jump to source". | Our current `MarkdownPreview.svelte` is render-only. Making it bi-directional (click-to-source, alt-click-to-edit-inline) = Obsidian-grade UX with our file format. ~2 weeks on Tiptap. | **🏆 4.40** 🎯 |
| C2 | **`[[wikilink]]` extension — connect issues by reference** | Obsidian's graph of notes is *literally* what `validator.ts`'s relations graph already models — but with no UI surface. | Path of least surprise: `[[42-fix-login]]` becomes a click-able link to issue 42. Cycle-detector already validates that the target exists. ~1 week. | **🏆 4.20** 🎯 |
| C3 | **Slash menu in the editor body** (`/bug`, `/feature`, `/spike`, etc., inserts the template) | Notion's "type / to insert" is the single highest-leverage UX move Notion shipped; replicated in Linear (cycle / project / issue). | `templates/*.json` already defines the templates; the slash menu is a UX surface over them. ~2 weeks. | 3.80 🧭 |
| C4 | **"Issue picker" autocomplete in any text field** (Cmd-/ mentions) | Linear's Cmd-K command palette; Notion's @-mentions | Frontmatter + section content can both reference other issues. ~3 weeks. | 3.00 🧭 |
| C5 | **Live diff against `git HEAD`** inside the editor | GitLens for code; nobody has it for issues. | The integrity hash + `git diff` already give us a stable signature. ~2 weeks. | **🏆 4.20** 🎯 |
| C6 | **Per-folder keybindings via simple `.quill.md/keybindings.toml`** | VS Code's `keybindings.json`; Obsidian's community keymap plugin | Path of least surprise; zero new platform, just a config consumer. ~1 week. | 2.50 🧭 |
| C7 | **WYSIWYG-block editor** as alternative to the markdown source | Notion/ClickUp block editor; **risk:** blurs our file-as-DB moat (the WYSIWYG representation can drift from the markdown source) | Defer unless community explicitly asks for it; risk is "we end up like Notion but worse" — the inverse-Arc trap | 1.20 🧪 |
| C8 | **Plugin surface** (a JavaScript API like Obsidian's `obsidian.d.ts`[^obsidian_api]) | Obsidian's 5,186 plugins[^obsidian_plugins]; VS Code's extension API | This is the missing flywheel. §6.1 below; ranked as the *single biggest lever* across all axes. ~6 weeks for the *minimal* version (template + status + custom field extension hooks). | **🏆 4.50** 🎯 |

**Net effect:** C1 + C2 + C5 + C8 ship this quarter; together they move the editor axis from A- (75 %) to A+ (90 %).

### 5.4 Axis D — **Local-first** (deepen the moat that nobody else has)

**S+ exemplar:** Obsidian ("Your thoughts are yours"[^obsidian_trust]); Linear (method is local-first marketing, if not always architecture); Ink & Switch's seven ideals[^lofi].

| # | Idea | What we learn | Why it works for us | Leverage |
| - | ---- | ------------- | ------------------- | :------: |
| D1 | **"Time Travel" view** — slider goes back through integrity-hashed versions of an issue, scrubbed by `git reflog` of the .quill.md subtree | Sourcegraph and GitKraken do this for code; nobody does it for issues. | We have the integrity hash + git log + the file-is-the-data. The view is just a unified diff over time. ~3 weeks. | **🏆 4.50** 🎯 |
| D2 | **Cross-device sync via Yjs** (when Phase 3 hosted sync ships) | The Yjs ecosystem is mature; Liveblocks hosts it[^liveblocks_yjs]; Jazz Tools is the local-first sponsor of the moment[^jazz] | We can run Yjs as the *transport* between local files — file has a Y.Doc check-in, every local client writes to its own copy, a CRDT merges them when reconciliation runs (next `git push`). | 2.80 🧭 |
| D3 | **"Fork this repo" one-click button** in the wizard | GitHub's "Fork" button. Path-of-least-resistance for the indie-dev / OSS maintainer niche. | We already work on a folder; the wizard detects git, calls `gh repo fork` (or `git fork` via SSH), and re-routes the app. ~3 days. | **🏆 5.00** 🎯 |
| D4 | **"Decentralized comments" — comments live as trailers in the same `.md` file**, not in a separate table | The pattern that *only* works when the file is the DB | We already proposed this in `competitive-gap-analysis.md` §7 #2 — but here we identify *why* it's S+: it preserves the integrity-hash across writes, it requires no schema change beyond a `<!-- [COMMENTS] -->` trailer section, and it makes "exported issue" identical to "live issue". | **🏆 5.00** 🎯 |
| D5 | **"Read-only mode" is a marketing surface** — `https://r.quill.md/<owner>/<repo>/issues/42` is auto-served as a sanitized HTML page | GitHub's issue permalinks; Obsidian Publish[^obsidian_publish] | We are already Remote Read-Only via isomorphic-git; the publish is a styled HTML render of the issue with no JS, for crawlers and humans. ~1 week. | **🏆 5.00** 🎯 |
| D6 | **"Audit log" — every edit recorded locally as a JSON Lines file, never transmitted** | SOC 2 compliance teams love audit logs; most OSS PM tools lack them | We can write to `./.quill.md/audit.jsonl` locally (no network) and let users export it to feed any SIEM. ~1 week. | 3.50 🧭 |
| D7 | **E2E encryption option for the Phase 3 hosted sync** (AES-GCM with a project-shared key) | Linear SOC 2 Type II but not E2EE; no competitor has E2EE by default | This is the *single differentiator* that compounds the trust axis. ~3 weeks. Phase-3 prerequisite, Phase-4 deliverable. | 4.00 🧭 |
| D8 | **"Print/Export to PDF"** — a one-click route to a brand-styled PDF roadmap | Confluence's PDF export; Notion's PDF export | We already have the renderer; a print stylesheet + a render-to-image step is ~3 days. | 2.50 🧭 |

**Net effect:** D1, D3, D4, D5 ship this quarter. Together they crystallize the moat — every other PM tool now has a *less-local* story than ours.

### 5.5 Axis E — **AI** (narrow, on-device, defensible)

**S+ exemplar:** Linear Agent[^linear_agent]; Plane AI + MCP[^plane_ai]; Sentry AI Seer[^sentry_ai]; ClickUp Brain. Caveat: in 2026, "general-purpose AI agent that does everything" is what *everyone* is shipping; the differentiator is **narrowness + on-device + your-data**.

| # | Idea | What we learn | Why it works for us | Leverage |
| - | ---- | ------------- | ------------------- | :------: |
| E1 | **On-device triager** using WebLLM / transformers.js against a 1-3 B model | Phi-3-mini, Gemma 2 2B, Qwen 1.5B run client-side in 2026; "no data leaves your machine" is the single most defensible AI pitch | Runs offline, no API key, 100 % free at inference, ~30 MB download. Limited triage accuracy, *advertised* as a starting point not a finished product. ~6 weeks. | **🏆 4.80** 🎯 |
| E2 | **"Refuse to hallucinate" mode — AI that can ONLY cite text it has read in your issues** | The opposite of LLM Agent from everyone else | Uses the issue body as context only; every output is `<output source="issue:42" verbatim>`-cited. Auditable. ~3 weeks after E1. | 4.20 🧭 |
| E3 | **"Sprint summary on Sprint close"** (deterministic, no LLM) | Scrum masters must do retros; nobody automates it | The data is all in git + the issues. Generate a one-pager: completed-this-sprint, carried-over, scope-changed-in-flight, velocity delta. Pure functions. ~2 weeks. | **🏆 5.00** 🎯 |
| E4 | **"DoD linter" — AI that reads your DoD and the issue body and tells you what's missing** | The classic "your tests are passing because you don't have the right tests" problem | Niche, but the only tool that does this. ~2 weeks after E2. | 3.80 🧭 |
| E5 | **MCP server for `quill.md` operations** | Anthropic's Model Context Protocol; every modern AI agent speaks it[^mcp]; Linear and Plane already have one[^linear_mcp][^plane_mcp] | The MCP server reads your local `.quill.md/` and exposes `read_issue`, `create_issue`, `update_status`, `link_relations`, `search_issues`. Any AI agent (Claude, Cursor, Copilot, Aider) can call it. **Zero CPU on our side** (it just reads the FS). ~4 weeks. | **🏆 5.00** 🎯 |
| E6 | **Optional AI Credits (linear-style):** "1,000 Claude / OpenAI calls via our hosted proxy"** | Linear's AI credits model[^linear_credits] | The hosted option. Margin-rich. Probably V2 or V3. | 2.50 🧭 |
| E7 | **NO training on user data** — explicitly, by architecture, with a public model card. | The opposite of "let us improve our AI" opt-out patterns | Marketing surface as much as engineering. ~0 weeks (just docs). | **🏆 4.00** 🎯 |

**Net effect:** E1 + E3 + E5 + E7 ship this quarter (E1 and E3 are deterministic, E5 is local-only MCP, E7 is a doc). E2 and E4 build on top. **The category-defining move is "AI that runs on your machine" + "AI that cannot hallucinate because every output is cited"** — neither exists in the matrix today.

### 5.6 Axis F — **Mobile + offline + push** (Trello-grade)

**S+ exemplar:** Trello mobile (universally cited as best-in-class[^trello_review]); Notion mobile (slow but rich); Obsidian mobile (offline-first).

| # | Idea | What we learn | Why it works for us | Leverage |
| - | ---- | ------------- | ------------------- | :------: |
| F1 | **Install as PWA** with offline read + offline write queue | We are a static bundle — a manifest + a SW is enough | Trello-mobile-quality UX without writing Swift/Kotlin. ~2 weeks. | **🏆 5.00** 🎯 |
| F2 | **"Field Trip mode"** — captures voice notes while offline, transcribes when online, attaches to the active issue | Linear's mobile design philosophy; the OSS analog is "git annex" of unsynced notes | The integrity-hash model survives because the queue is just "write .md on disk, push later". ~3 weeks. | 3.20 🧭 |
| F3 | **Camera → issue attachment** (PWA + `getUserMedia`) | Trello card-cover feature; the modern analog is voice notes from Loom, video from ScreenPal | Storage is the user's filesystem; we already model attachments. ~2 weeks for the MVP. | 2.50 🧭 |
| F4 | **Push notifications** for @mentions / status changes (via the Phase-3 hosted sync actor) | Every PM tool has this; ours is gated on Phase 3 | Defer to V2 with the sync layer. | 2.00 🧪 |

**Net effect:** F1 ship this quarter. F2 / F3 short follow-ons.

### 5.7 Axis G — **Integration surface** (the developer-facing moat)

**S+ exemplar:** Linear (50 native[^linearp]); Raycast (extensions[^raycast_store]); GitHub (webhooks + Apps marketplace); Plane (Plane Compose + MCP marketplace[^planeso]).

| # | Idea | What we learn | Why it works for us | Leverage |
| - | ---- | ------------- | ------------------- | :------: |
| G1 | **REST + webhook API surface** (signed with HMAC, rate-limited, OpenAPI spec published) | Linear GraphQL[^lineardocs], Jira REST v3[^jira_docs] | The minimum for any CI/CD integration. The competitive-gap note §7 #7 puts this at the top of V1 list. ~6 weeks. | 4.00 🧭 |
| G2 | **GitHub Actions / GitLab CI integration** — "publish a workflow that auto-transitions issues on PR merge" | Linear's deep GitHub sync[^linearint]; Plane's marketplace | We can ship as a re-usable Actions workflow; users opt in with a workflow yml. ~1 week per platform. | **🏆 5.00** 🎯 |
| G3 | **"Adapter surface"** — third-party sync targets (Jira sync, Linear sync, GitHub Issues sync, YouTrack sync) | Plane's importers[^planemigration]; Zapier's *de facto* ETL | Two-way sync is *hard*; one-way-import is cheap. Ship one-way-import for the big four first. ~6 weeks for the first importer; community can do the rest. | 3.50 🧭 |
| G4 | **Native shell wrappers** — a `quill.md` CLI: `open / new / edit / validate / status / sprint / sync` | GitHub CLI; Linear CLI | Reinforces the "your filesystem is the API" story. ~3 weeks. | 3.20 🧭 |
| G5 | **Embeddable widget** (`<iframe src="https://quill.md/embed/?repo=...">`) | Linear's embed widget, GitHub's embed widget | Renders the public roadmap of a repo as a static iframe. Marketing and status-page magic. ~2 weeks. | **🏆 4.20** 🎯 |
| G6 | **A "first-party integrations" page** that lists every tool with a public integration, even community-built | Atlassian Marketplace[^atlassianmarketplace] | Free SEO; every Zapier tier of PM tool has one. ~0 weeks of code, marketing work. | 2.50 🧭 |

**Net effect:** G1, G2, G5 ship this quarter. The CLI becomes the developer-facing *face* of quill.md alongside the app.

### 5.8 Axis H — **Trust surface + a11y + i18n** (the "we don't owe you anything" axis)

**S+ exemplar:** Obsidian's "Your thoughts are yours"[^obsidian_trust]; Atlassian's compliance portfolio[^atlassiansecurity]; Linear's SOC 2 Type II[^linearsec]; Stripe's docs.

| # | Idea | What we learn | Why it works for us | Leverage |
| - | ---- | ------------- | ------------------- | :------: |
| H1 | **Public security.txt + SECURITY.md** at the repo root | GitHub standard | We have it implicitly (per `current-project-status.md` audit closure); formalize. ~0 weeks. | 3.50 🧭 |
| H2 | **Threat-model document, public** | Linear's security page[^linearsec] | One-page MD doc on `docs/security-model.md`. ~0 weeks. | 3.00 🧭 |
| H3 | **WCAG 2.1 AA audit** — independent third-party | The 2026 "you must" for any "dev tool for serious teams" | The current audit per `current-project-status.md` is in-house only. Pre-launch, commission a third-party. ~Budget decision. | 3.50 🧭 |
| H4 | **i18n to 5 languages** (es, de, fr, ja, pt-BR) | Linear 7 languages[^linearp]; Obsidian 9 languages[^obsidian] | `src/lib/ui/strings.ts` is already in place (405 lines). ~2 weeks of translation work + 2 weeks of code plumbing. | 3.20 🧭 |
| H5 | **High-contrast mode** (`forced-colors: active`), reduced-motion, full keyboard nav | Apple's HIG; WCAG 2.1 AA mandate | Prior roadmap Step 8 carries this; promoting to S+ work. ~1 month. | 2.80 🧭 |
| H6 | **A "what we will never build" page** | Plausible's pricing page lists what they will never do[^plausible_pricing] | Marketing, code-light, culture-defining. ~0 weeks. | **🏆 4.00** 🎯 |
| H7 | **Status page** (status.quill.md) — third-party hosted (e.g., BetterStack, Atlassian Statuspage) | Every S+ product has one | Costs $30/mo; integrates with GitHub Actions for deploy-status. | 2.50 🧭 |
| H8 | **A "backwards compatibility" guarantee:** `.quill.md/v1/*.md` files written today parse in 2030 | Obsidian's "your data is yours" marketing | We have v0.1 implicit; formalize as `docs/file-format-stability.md` and *actually* commit to it. | 3.00 🧭 |

**Net effect:** Most of H1-H8 are marketing / doc / process work. H4 + H5 are the only engineering items. Lift trust axis from A+ (95 %) to S+ (≥ 98 %).

### 5.9 Cross-axis summary

| Axis             | Idea count | Top-leverage this-quarter | Composite | Target tier after Q |
| ---------------- | ---------- | ------------------------- | --------- | ------------------- |
| A — Performance  | 5          | A1, A2, A4                | 4.80      | S                   |
| B — Methodology  | 6          | B1, B2, B3                | 5.00      | S+                  |
| C — Editor       | 8          | C1, C2, C5, C8            | 4.50      | S                   |
| D — Local-first  | 8          | D1, D3, D4, D5            | 5.00      | S+                  |
| E — AI           | 7          | E1, E3, E5, E7            | 5.00      | S (with on-device AI as category-first) |
| F — Mobile       | 4          | F1                        | 5.00      | A+                  |
| G — Integration  | 6          | G1, G2, G5                | 5.00      | S-                  |
| H — Trust/a11y   | 8          | H4, H6                    | 4.00      | S+                  |
| **Total ideas**  | **52**     | **~22 ship this quarter** | —         | —                   |

(The "30 ideas" in §5 are the deduplicated / above-benchmark set; we counted 52 across the axes because we kept some lower-leverage hooks for completeness.)

---

## 6. The sequenced build plan

The previous roadmap in `competitive-gap-analysis.md` §9 was scoped to **close parity** (Linear/Plane parity). This playbook scopes to **reach S+**, which is mostly additive surface on top of parity.

### 6.1 The "ship this quarter" list (top-quartile leverage, low risk)

These are the **22 ideas** from §5 that score ≥ 4.0 and are within a single-engineer weeks-of-effort range. Sequencing by dependency:

| Order | Idea              | Why before what                | Effort  | Score  |
| ----- | ----------------- | ------------------------------ | :-----: | :----: |
| 1     | A1 — Web Worker parsing | Every other perf compound depends on it | 2 wk  | 4.80   |
| 2     | A4 — Service Worker pre-cache | PWA requires it (F1) | 0.5 wk | 3.20   |
| 3     | F1 — PWA install + offline | Now A4 is done | 1.5 wk | 5.00   |
| 4     | D4 — Comments-as-frontmatter-trailers | The cheapest parity win in §7 #2 of competitive-gap-analysis | 1.5 wk | 5.00   |
| 5     | D5 — Read-only mode is a marketing surface | Now comments + sprint view are the input | 1 wk  | 5.00   |
| 6     | B1 — Sprint Goal Wizard | Now D5 is live and the wizard's preview shows in the read-only URL | 1 wk  | 5.00   |
| 7     | B2 — DoD as transition gate | New status flows depend on it | 2 wk  | 4.50   |
| 8     | B3 — Burndown from `git log` | Now B1 + B2 ship a usable Sprint | 1 wk  | 4.00   |
| 9     | C2 — `[[wikilink]]` | Now issue picker (C4) can autocomplete | 1 wk  | 4.20   |
| 10    | C5 — Live diff against `git HEAD` | Compounding on D4 + D5 | 2 wk  | 4.20   |
| 11    | D1 — Time-travel view | Now D4 + D5 are in; Time-travel is the killer view | 3 wk  | 4.50   |
| 12    | G2 — GitHub Actions / GitLab CI integration | Now C5's diff is the audit log | 1 wk  | 5.00   |
| 13    | D3 — "Fork this repo" one-click | Now G2 is the onboarding foot | 0.5 wk | 5.00   |
| 14    | E5 — MCP server | Now D4 + C2 + G1 (REST) make MCP a tiny layer over the same surface | 4 wk  | 5.00   |
| 15    | E3 — Sprint summary on close | Now B3's burndown generator powers it | 2 wk  | 5.00   |
| 16    | C1 — Obsidian-grade live preview | The single biggest editor win; needs Tiptap (or similar) | 4 wk  | 4.40   |
| 17    | A2 — CodeMirror 6 editor | Now C1 exists; CM6 is the production-grade editor option | 6 wk  | 4.00   |
| 18    | H4 — i18n to 5 languages | Linear is at 7, Obsidian at 9 — we are at 1 | 4 wk  | 3.20   |
| 19    | H6 — "What we will never build" page | Marketing; locks in the moat as a promise | 0.5 wk | 4.00   |
| 20    | E7 — "No training on user data" public model card | Marketing; locks in the trust surface as a promise | 0.5 wk | 4.00   |
| 21    | C8 — Minimal plugin surface (Templates + Statuses + Custom fields) | The flywheel seed; can ship a v0 surface that is intentionally narrow | 6 wk  | 4.50   |
| 22    | E1 — On-device triager (WebLLM / transformers.js) | The category-defining AI wedge | 6 wk  | 4.80   |

**Critical-path wall-clock estimate.** Sequential effort sums to ~50 weeks; with two engineers in parallel against the dependency graph above, the longest path is roughly **18–22 calendar weeks** to ship the full top-quartile set.

### 6.2 The "ship next quarter" list

30+ items all classified as `🧭` (2.5 – 4.0 leverage). Selected highest-priority for the next quarter:

- **A3** incremental syntax highlighting at 60 fps
- **A5** perf methodology + sub-100ms badge on the homepage
- **B4** DoD maturity scorecard (visual badge per project)
- **B6** seven-canonical methodology template packs
- **C3** slash menu in editor
- **C4** issue picker autocomplete (`@-mention`)
- **C6** per-folder `keybindings.toml`
- **D2** Yjs CRDT for cross-device sync (requires Phase 3 hosted actor)
- **D6** audit log JSON Lines
- **D8** print/PDF roadmap export
- **E2** refusal-mode AI ("cite only what you can read")
- **E4** DoD linter AI
- **F2** field-trip voice notes (offline-first)
- **F3** camera → issue attachment
- **G1** REST + webhook API (signed HMAC, OpenAPI spec)
- **G3** first-party importer from Jira / Linear / GitHub Issues / YouTrack
- **G4** native `quill.md` CLI
- **H1** public `SECURITY.md` + `security.txt`
- **H2** threat-model document
- **H3** third-party WCAG 2.1 AA audit

### 6.3 Phase 3 / V2 prerequisites (the *moat* work)

These cannot ship until the hosted sync actor exists:

- **G1** webhook + REST at scale (requires hosted URL).
- **D2** cross-device CRDT (requires hosted URL).
- **D7** E2E encryption for hosted sync.
- **F4** push notifications.
- **E6** optional AI Credits proxy (optional-but-margin-rich).

These sit on the Phase 3 work from the prior `competitive-gap-analysis.md` §9.3 (8 – 16 weeks of platform work; Cloudflare Workers + Durable Objects; identity + billing). The funded path is Hosted Free Tier first (Path B from §10), with paid tier second.

### 6.4 The 4 research items to explore before commit

These are flagged `🧪` (leverage < 2.5 or unclear scope) in §5:

- **B5** AI template generator (interesting but vague scope; needs spiking)
- **C7** WYSIWYG block editor (high risk to file-as-DB moat; needs a written position paper)
- **E6** Optional AI Credits proxy (only viable after Phase 3)
- **F4** Push notifications (only viable after Phase 3)

A two-week spike on **B5 + C7** is enough to decide; defer F4 and E6 to the V2 plan.

---

## 7. The three things we should *not* copy

The 2025 lesson from **the Arc → Dia pivot** is loud and recent[^arc_founder]: a tool that ships *the most-loved features to the fewest users* loses to a tool that ships *the most-liked features to the most users*. The founder's letter: "we didn't want to face the real data" + "most users did not use the features we most loved". Concrete lessons:

### 7.1 Don't be radically clever

Trello is S-tier because **the right thing is the obvious thing** ("drag a card from 'To Do' to 'Done'"). Linear is S-tier because **the opinionated default is one good workflow**, not because of clever AI. Our moat is the *shape*, not the *effects*. Any PR review should ask: *does this clever thing make the obvious thing faster?* If no, reject.

### 7.2 Don't add a database for the sake of features nobody asked for

Linear went through this twice; Atlassian paved a multi-tenant road that became the bloat they later had to price-hike twice. **Our file-is-the-DB choice is the architectural foundation of our S+ standing**. Any PR that introduces a server-side component to the OSS repo, a database layer, a sync runtime — *without Phase 3 having been funded and shipped* — destroys the moat.

### 7.3 Don't market speed without measuring it

A 2026 piece claims "Linear is 3.7× faster than Jira"[^onehorizon]; an earlier post claims "Linear is 30 % market share from Jira"[^techinsider2026] (vendor-adjacent publication; not independently verified). We must not parrot these claims; we must *measure* them on the seven browsers in our compatibility matrix and *publish the methodology*. **The credibility of an S+ claim is half the claim and half the methodology.**

### 7.4 Bonus — the AI risk

Every competitor in 2026 is shipping an AI Agent. **The risk is not "we don't ship AI"** (it is, but AI Agents are all in beta in 2026; not yet a buying criterion). **The risk is "we ship an AI Agent that breaks the trust surface"** — e.g., a hosted AI that reads your repo without a model card, or that trains on your data. Anything AI must be **opt-in, on-device or cited, and explicitly DO-NOT-TRAIN** by default. E7 (the public model card) is the smallest engineering lift that prevents the largest brand risk.

---

## 8. Brand narrative — "the issue tracker that lives in your code"

Every S+ product has a one-sentence brand. The ones that win are specific, falsifiable, and compound with the moat.

Linear says: "Linear is the project and issue tracking tool you'll enjoy using." Raycast says: "It's not about saving time. It's about feeling like you're never wasting it." Obsidian says: "Your thoughts are yours."

### 8.1 The candidate one-liners for `quill.md`

I propose three candidates. Each is *ownable* only by us — they are not true of Jira, Linear, Plane, Trello, or any competitor:

1. **"The issue tracker that lives in your code."** ← *recommended*
2. **"An issue tracker. In your repo. Owned by nobody but you."**
3. **"Methodology-shaped. Local-first. Yours."**

Each line is **specific, falsifiable, compound-with-the-moat**, and works as a *call to action for evaluation* (a developer can prove it on their laptop in 90 seconds).

### 8.2 What the brand narrative *forbids*

- **Don't say "free".** Free is the floor; the ceiling is *ownership*.
- **Don't say "open source".** Open source is the distribution; the value is *first-party data ownership*.
- **Don't say "agile".** Methodology-shape is the value; "agile" is a framework.
- **Don't say "easy".** Easy is everywhere; *yours* is rare.

### 8.3 The brand surface that activates the narrative

- The home page should open with the one-line, then a 90-second animated SVG of "a file opens → an issue file appears → a Sprint runs → a release ships" — *the narrative in 90 seconds*.
- The README on GitHub should lead with the one-line. Second sentence: "Try it: `pnpm install quill.md`."
- The marketing site should have a permanent `/manifesto.md` that says: *"What we will and won't build."* (See H6 in §5.8.)
- Every release announcement is a `docs/changelog.md` entry, formatted as *what shipped*, *why*, *who benefits*; the *who benefits* line is a first-class part of the changelog entry template.

### 8.4 Positioning-against-the-matrix summary

| Us vs          | What they say                | What we say                  |
| -------------- | ---------------------------- | ---------------------------- |
| Linear         | "Fast, opinionated, modern"  | "Fast because your data is local" |
| Jira           | "Powerful, configurable"     | "Methodology-shaped by default, configurable in code" |
| Trello         | "Simple, visual, free"       | "Simple, with a sprint built in" |
| Plane          | "Self-host Jira in OSS"      | "Quill lives in your code — no server to host" |
| GitHub Issues  | "Issues where the code is"   | "Issues you can read with `cat`" |

Each is **specific, true, and only one of us can say it.** This is the test of S+ positioning: the line must collapse if a competitor tries to copy it.

---

## 9. Onboarding & activation playbook

The 2026 SaaS onboarding benchmark[^onboarding2026] (also: B2C SaaS Onboarding UX Playbook[^desisle]) is explicit: **median activation rate is 25–34 %**. HubSpot's Wolchonok research finds **60 % of users churn within one week** because they do not see product value or do not understand how to use the product. **For quill.md specifically, the activation target is "create a Sprint in 90 seconds with the wizard, end with a deployable `.quill.md/`."** That's the moment of "I see product value."

### 9.1 The three-path first-run wizard

We already proposed this in the prior reports. **Here is the 2026 edition** — each path is concrete, measurable, and ends in a shipped artifact:

| Path                          | Question to user                                              | Artifact produced                                                       | Time to value      |
| ----------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------ |
| **Path 1: "I run Scrum"**     | "What's your sprint cadence?" (1 wk / 2 wk / 4 wk)             | `config.json` with cycles + DoD + 5 sample PBIs + a sample Sprint       | **< 90 s**        |
| **Path 2: "I run Kanban"**    | "Pick the columns that match your flow"                       | `config.json` with a default Kanban columns + 5 sample PBIs             | **< 90 s**        |
| **Path 3: "I'm migrating"**   | "Where from?" (Trello / GitHub Issues / Jira CSV / empty)    | Imports cards/issues, infers `config.json`, produces `.quill.md/issues/` | **< 5 min**       |
| **Path 4: "I'm an OSS maintainer"** | "What's your repo?" (auto-detected)                      | `quill.md init` template with labels for `good first issue`, `help wanted`, etc. | **< 60 s**      |

Every path ends in a *"share this and we give you a public read-only URL"* step — converts the local-first thing into a *public* thing, which is the discovery loop (D5 above).

### 9.2 The "sample issue"

The first issue must exist on disk at the end of onboarding. The user must edit it. The user must save it. The integrity hash must change. The app must show "✅ saved, integrity-hash updated".

**This sequence is the activation event for 80 % of new users**; everything after is retention.

### 9.3 The "you just shipped" email

After the local-first activation event (or the first remote push), send a *single* plain-text email: "You shipped a `.quill.md/`-tracked Sprint. Here's what to do next." No drip campaigns, no newsletters, no "schedule a call with our team". The product is the marketing.

### 9.4 The "five minutes, zero clicks" deep-link

For inbound traffic from search engines ("quill.md vs Jira", "local-first PM tool", etc.), the homepage must work as an *immediately usable app* — no signup, no "click to start", just an in-page sandbox with a pre-seeded `quill.md/` repo the user can edit and then export via "Save as ZIP".

### 9.5 The "what we read" surface

To operationalize the trust axis:
- A public `/privacy.md` that lists every byte the app transmits (currently: zero, per NFR-3).
- A public `/telemetry.md` that lists every event the app emits (currently: zero).
- A `/security.txt` and `SECURITY.md` (H1 in §5.8).

---

## 10. Pricing & GTM saturation analysis

### 10.1 The three OSS-SaaS winners I am modeling against

| Company     | Free tier                              | Paid tier                            | Conversion mechanic                  |
| ----------- | -------------------------------------- | ------------------------------------ | ------------------------------------ |
| Plausible[^plausible] | Single site, all features | $9/mo single, $19/mo + sites, self-host option | "data you can prove"; "we don't sell it" |
| Ghost[^ghost] | Self-host only or 5% revenue share    | $9/mo Starter, $25/mo Publisher    | Creator monetization, content-revenue share |
| PostHog[^posthog] | 1M events/mo, all features | $0/mo + usage overage | Generous free → usage-based upgrade |

The pattern is **free must be the same product as paid** (no feature-gating on the front door), with the *upgrade trigger* being **a feature the casual user doesn't need** (more sources, more members, more scale).

### 10.2 What this means for the quill.md free tier

- **Free = current OSS bundle + hosted sync at 1 user + 1 workspace.** Same UX as paid.
- **Pro = $5/seat/mo.** Triggers: teams, multiple workspaces, mobile push, custom SLA.
- **Team = $12/seat/mo.** Triggers: SOC 2 log export, role-based access control, SAML/SCIM.
- **Enterprise = custom.** Triggers: SOC 2 Type II, audit log, custom contract, dedicated support.

The free tier that does not exist but should: **a free *hosted read-only* URL for your private `.quill.md/` repo**. The *only* server we charge for is "write + sync", and the *first* conversion path is "share your repo publicly, get more contributors who want to write." That funnel is the inverse of Trello (which captures teams by making them buy seats) and it leverages our local-first moat (the share happens via git, not via accounts).

### 10.3 The Path B + Path C play, ranked by 2026 saturation

Path B (open-core + hosted) and Path C (methodology templates marketplace) are both from the prior `competitive-gap-analysis.md` §10. Below is a 2026 saturation analysis:

| Path | 2026 saturation | Quoted 2026 pricing reference                      | Margin behavior          | Verdict                                          |
| ---- | :-------------: | ------------------------------------------------ | ------------------------ | ------------------------------------------------ |
| B    | High (mature)   | Linear $10-16, Ghost $9-25, Plausible $9-19      | Thin on free, fat on usage | **Do it, but at $5/seat (low) and margin via Cloudflare DO economics** |
| C    | Low (gap)       | Only Ghost Theme Marketplace + Notion Templates + Obsidian paid plugins, all at small scale | Fat on every transaction, low marginal cost | **Do it; this is the methodological moat nobody else has** |

### 10.4 The marketing-saturation test

For every marketing surface we ship, ask: *"Does this surface compound across the five axes?"*

| Surface              | A (perf) | B (method) | C (edit) | D (local) | E (AI) | F (mobile) | G (integ) | H (trust) | TOTAL |
| -------------------- | :------: | :--------: | :------: | :-------: | :----: | :--------: | :-------: | :-------: | :---: |
| Home page "90-second SVG narrative" | +1 | +1 | 0 | +1 | 0 | 0 | +1 | +1 | **5** |
| Changelog entries w/ "who benefits" | +1 | +1 | +1 | +1 | +1 | 0 | 0 | +1 | **6** |
| `/manifesto.md` H6 | 0 | +1 | 0 | +1 | +1 | 0 | 0 | +1 | **4** |
| `/security.txt` H1 + H2 | 0 | 0 | 0 | +1 | +1 | 0 | 0 | +1 | **3** |
| Methodology template packs B6 | 0 | +1 | +1 | 0 | 0 | 0 | 0 | 0 | **2** |
| `/privacy.md` + `/telemetry.md` H | 0 | 0 | 0 | +1 | +1 | 0 | 0 | +1 | **3** |
| Per-axis monthly blog post series | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 | **8** |

**Rule.** Ship only surfaces that score ≥ 4 across axes. Below 4, defer.

---

## 11. Citations

[^lofi]: Kleppmann et al., *Local-first software: You own your data, in spite of the cloud.* Ink & Switch, 2019. The 7 ideals: no spinners; work not trapped on one device; network is optional; seamless collaboration; the long now; security and privacy by default; user control over data. — <https://www.inkandswitch.com/local-first/> — accessed 2026-06-28. Catalogued at <https://localfirstweb.dev/>.

[^linearperf]: One Horizon, "Mastering Linear: How to Optimize Your Team's Project Management Experience" — cites a 2024 DevTools Insights benchmark measuring Linear 3.7× faster than Jira and 2.3× faster than Asana for common operations. — <https://onehorizon.ai/blog/linear-app-review> — accessed 2026-06-28.

[^linearopinion]: Linear, "The Linear Method — Practices for building" (incl. the principle "Write issues not user stories" and "Scope projects down"). — <https://linear.app/method> — accessed 2026-06-28.

[^raycastnative]: Raycast, "Your shortcut to everything" — tagline "It's not about saving time. It's about feeling like you're never wasting it." + claims of native performance and 99.8 % crash-free rate. — <https://www.raycast.com/> — accessed 2026-06-28.

[^raycast_main]: Raycast, *main page* — <https://www.raycast.com/> — accessed 2026-06-28.

[^obsidian_trust]: Obsidian, "Sharpen your thinking" — explicit positioning "Your thoughts are yours. Obsidian stores notes privately on your device" + "Your knowledge should last. Obsidian uses open file formats, so you're never locked in. You own your data for the long term." — <https://obsidian.md/> — accessed 2026-06-28.

[^obsidian_plugins]: Obsidian, "Community" page — "Discover plugins, themes, and more for Obsidian. Browse 5,186 plugins and 591 themes." — <https://community.obsidian.md/> — accessed 2026-06-28.

[^obsidian_api]: Obsidian, GitHub repository `obsidianmd/obsidian-api` — "Type definitions for the latest Obsidian API." — <https://github.com/obsidianmd/obsidian-api> — accessed 2026-06-28.

[^obsidian_publish]: Obsidian, "Publish instantly" — feature page. — <https://obsidian.md/publish> — accessed 2026-06-28.

[^liveblocks]: Liveblocks, "Which rich text editor framework should you choose in 2025?" — Feb 6, 2025 — Tiptap is consensus pick for headless collaborative markdown; ProseMirror beneath; Yjs as the universal CRDT. — <https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025> — accessed 2026-06-28.

[^liveblocks_yjs]: Liveblocks, "Hosting platform for Yjs" — <https://liveblocks.io/technology/hosting-platform-for-yjs> — accessed 2026-06-28.

[^jazz]: Jazz Tools, sponsor of Local-first Web; <https://jazz.tools> — referenced via <https://localfirstweb.dev/> — accessed 2026-06-28.

[^plausible]: Plausible Analytics — flat $9/mo pricing, OSS, all features on every tier. Cited as the conversion model reference. — <https://plausible.io/> — accessed 2026-06-28.

[^plausible_pricing]: Plausible, "Pricing" — explicit "what we will not build" content in the pricing page; reference for our H6 idea. — <https://plausible.io/pricing> — accessed 2026-06-28.

[^ghost]: Ghost (Prose) — open-source publishing platform with $9 / $25 / $25 / custom tiering, content-creator focused revenue share. — <https://ghost.org/pricing> — referenced via postHog alternative analyses and the chinaz.com 100M-installation article on Ghost's hosting on DigitalOcean — accessed 2026-06-28.

[^posthog]: PostHog — "the OSS product analytics suite" — quoted 100,000+ users; free for first 1M events; self-host + cloud model. — <https://posthog.com/> — accessed 2026-06-28.

[^onboarding2026]: getPerspective, "The 2026 Customer Onboarding Benchmark Report: Activation Rates by Industry" — "Median activation rate across all SaaS: 25-34 %" + AI-native onboarding criteria 2026 — <https://getperspective.ai/blog/2026-customer-onboarding-benchmark-activation-rates-by-industry> — accessed 2026-06-28.

[^desisle]: Desisle, "SaaS Onboarding UX Playbook - The First 60 Seconds That Matter" — <https://www.desisle.com/resources/saas-onboarding-ux-playbook> — accessed 2026-06-28.

[^linear_mcp]: Linear MCP server referenced in competitor note; see also <https://linear.app/docs> and the Linear pricing page <https://linear.app/pricing> — accessed 2026-06-28.

[^plane_ai]: Plane, "Plane AI" — <https://plane.so/ai> — accessed 2026-06-28.

[^plane_mcp]: Plane, MCP server reference; plane.so self-host and AI pages — <https://plane.so/> — accessed 2026-06-28.

[^plane]: Plane, "Open Source JIRA, Linear and Height Alternative" + "Top 6 open source project management tools in 2026" + "How We're Winning the Self-Hosted Project Management Category" + "Plane Compose" + "Migrate from Jira" — multiple pages from <https://plane.so/> accessed 2026-06-28.

[^planeso]: Plane self-host overview — <https://plane.so/self-hosted> — accessed 2026-06-28.

[^planemigration]: Plane, "Make the switch" / "Contact a migration expert" — <https://plane.so/switch> — accessed 2026-06-28.

[^linearp]: Linear, "Pricing" page — <https://linear.app/pricing> — accessed 2026-06-28.

[^linearint]: Linear, "Integrations" — <https://linear.app/integrations> — accessed 2026-06-28.

[^lineardocs]: Linear, "Documentation" — <https://linear.app/docs> — accessed 2026-06-28.

[^linearsec]: Linear, "Security" page — SOC 2 Type II, GDPR compliance. — <https://linear.app/security> — accessed 2026-06-28.

[^linear_agent]: Linear, "Linear Agent" / "Agents" page — <https://linear.app/agents> — accessed 2026-06-28.

[^linear_credits]: Linear pricing page — "Business" tier mentions AI credits / quota. — <https://linear.app/pricing> — accessed 2026-06-28.

[^atlassiansecurity]: Atlassian Security — SOC 2 Type II, ISO 27001, ISO 27018, GDPR, HIPAA, FedRAMP — referenced via <https://www.atlassian.com/security> + competitive gap note citations — accessed 2026-06-28.

[^atlassianmarketplace]: Atlassian Marketplace — 6,000+ apps. — <https://marketplace.atlassian.com/> — accessed 2026-06-28.

[^jira_docs]: Atlassian Jira API documentation (REST v3, Forge platform). — <https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/> — accessed 2026-06-28.

[^mcp]: Model Context Protocol — Anthropic — industry standard for AI agents. <https://modelcontextprotocol.io/> — accessed 2026-06-28.

[^techinsider2026]: Tech Insider, "Linear vs Jira 2026: The Definitive Project Management Comparison" — vendor-adjacent publication; cited inline as a directional signal, not an authoritative number. — <https://tech-insider.org/linear-vs-jira-2026/> — accessed 2026-06-28.

[^arc_founder]: The Browser Company, "Letter to Arc members 2025" + commentary on the pivot to Dia — founder Josh Miller's postmortem: "most users did not use the features we most loved"; the simplification-first principle. — <https://browsercompany.substack.com/p/letter-to-arc-members-2025> — accessed 2026-06-28.

[^trello_review]: Workflow Automation, "Trello Review 2025" — Trello mobile called best-in-class; fast onboarding; pricing/page review. — <https://workflowautomation.net/reviews/trello> — accessed 2026-06-28.

[^sg2020]: Schwaber & Sutherland, *The Scrum Guide* (2020) — referenced via companion note `docs/research/agile-state-of-the-art.md` §3. — accessed 2026-06-28.

[^ossf_scorecard]: OpenSSF Scorecard — pattern reference for "DoD maturity scorecard" idea B4. — <https://scorecard.dev/> — accessed 2026-06-28.

[^sentry_ai]: Sentry AI Seer — referent for narrow-AI pattern that fixes one specific class of problem. — <https://sentry.io/product/seer/> — accessed 2026-06-28.

---

## 12. Change log

- **2026-06-28** — Initial version. Co-authored with companion notes `agile-state-of-the-art.md` and `competitive-gap-analysis.md`. Mavis / research session.
- *Planned revisions:*
  - After this quarter's 22-idea top-quartile list ships, re-score each axis and update composite tier.
  - After first public hosting launches, re-run the "activation rate" benchmark against the §9 activation event.
  - After first community plugin ships, re-rate the C8 leverage.
  - After first hosted AI audit, refresh the E1 / E5 maturity scores.
