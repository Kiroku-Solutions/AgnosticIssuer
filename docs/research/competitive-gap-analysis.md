# Competitive Gap Analysis — `quill.md` vs Jira, Trello, Linear, Asana, ClickUp, Notion, GitHub Projects & Plane

> **Purpose.** Map the gap between `quill.md` (currently the file-format + Local Edit + Remote Read-Only viewer described in `docs/ers.md` and tracked through `docs/current-project-status.md`) and the players who already occupy the project-management market. Identify the _smallest_ set of additions that turn `quill.md` from "a great local viewer for issue files" into a viable competitor, and the _wider_ set that turns it into a defensible niche.
>
> **Audience.** Maintainers and contributors of `quill.md` deciding where to invest the next 12 months of engineering effort, with a follow-on use case: "could this become a product?"
>
> **Sources.** Primary competitor pages (Atlassian, Linear, Trello, Plane), 2025–2026 market reports (Mordor Intelligence, Grand View Research, SkyQuest), user-survey data (Coursera PMI synthesis, JetBrains State of Developer Ecosystem 2025, Stack Overflow 2024), 2025–2026 pricing announcements (Atlassian October 2025 cloud-price-hike notices), and known switching-trigger threads on Reddit (`r/ProductManagement`, `r/Linear`, `r/selfhosted`). Every non-trivial claim is cited.
>
> **Author.** Mavis (research session, 2026-06-28).
>
> **Companion documents.** This note is the _competitive_ arm of a three-part set:
>
> 1. `docs/research/agile-state-of-the-art.md` — methodology baseline (Scrum/Kanban/XP/SAFe + how `quill.md` maps today).
> 2. **This document** — market baseline (competitors + gap + roadmap).
> 3. (Next) `docs/research/security-baseline.md` — pending; the audit in `current-project-status.md` is already the security baseline.
>
> **Status.** Living document. Re-run every six months; the PM-tool market is the fastest-moving major segment in SaaS and three of the four primary competitors in this report shipped material pricing or AI changes inside the last 12 months.

---

## Table of Contents

1. [TL;DR](#1-tldr)
2. [Method: how I scored the gap](#2-method-how-i-scored-the-gap)
3. [Market map: who is who, what they sell](#3-market-map-who-is-who-what-they-sell)
4. [Pricing grid (as of mid-2026)](#4-pricing-grid-as-of-mid-2026)
5. [Feature matrix: `quill.md` vs the field](#5-feature-matrix-quillmd-vs-the-field)
6. [What `quill.md` already has that nobody else has (the moats)](#6-what-quillmd-already-has-that-nobody-else-has-the-moats)
7. [The 12 gaps that matter, ranked by leverage](#7-the-12-gaps-that-matter-ranked-by-leverage)
8. [Market signals — who's switching, why, and what it means](#8-market-signals--who-switching-why-and-what-it-means)
9. [Roadmap: MVP → V1 → V2 → Moat](#9-roadmap-mvp--v1--v2--moat)
10. [Go-to-market & monetization paths](#10-go-to-market--monetization-paths)
11. [Risk register: what _not_ to copy](#11-risk-register-what-not-to-copy)
12. [Citations](#12-citations)
13. [Change log](#13-change-log)

---

## 1. TL;DR

- **The market is large and growing.** Mordor Intelligence sizes it at **USD 9.76 B in 2025 → 23.09 B by 2031, 15.42 % CAGR**, with the **hybrid self-host + cloud** segment growing fastest at **18.12 % CAGR** because regulated industries (healthcare, finance, government, defense) demand data sovereignty[^mordor2026]. Grand View and SkyQuest put the 2030 figure between **USD 20.47 B and 22.54 B** at comparable CAGRs (15.7 % and 12.2 % respectively)[^gvr2023][^skyquest2025].
- **`quill.md` cannot out-Jira Jira, cannot out-Linear Linear, and should not try.** Atlassian, Linear, Trello, ClickUp, Notion, and Asana collectively cover the surface area; reproducing it is a 50–200-engineer multi-year program, not a roadmap item[^techinsider2026][^workflow2026trello].
- **But `quill.md` already owns three structural advantages no competitor has.** (a) the issue file is the _source of truth_ on disk — every other tool stores it in their DB; (b) the schema enforces methodology (Scrum/Kanban shapes map onto frontmatter + sections without configuration — see `agile-state-of-the-art.md` §9); (c) Local Edit Mode + Remote Read-Only Mode is genuinely _local-first_ — the running app is a single static bundle, the data lives on the user's disk or in the user's clone of a Git repo. None of Jira/Linear/Plane/Trello is local-first.
- **What is missing falls into three buckets** ordered by leverage: (1) _real-time + comments + presence_ (the table-stakes feature Trello shipped in 2014 and still wins on[^workflow2026trello]); (2) _Git write-back + sync service_ (the only way Local Mode + a remote audience makes sense for non-readonly collaboration); (3) _commerce surface_ (auth, billing, hosted backend) without which no SaaS roadmap is possible.
- **The defensible niche is not "better Jira".** It is **"the issue-tracker that lives in your repo"** — the niche currently fragmented across GitHub Issues (insufficient for scrum), in-repo `.md` files (insufficient tooling), and Plane (OSS but server-managed). `quill.md`'s "one HTML bundle, no install, your data on your disk" matches how serious OSS maintainers and indie devs already want to work.
- **Realistic V1 shippable in 6–9 months at current team size** if we sequence correctly: full Local Edit Mode on a server-side sync actor (the "Git push" loop), comments-as-frontmatter-trailers, a hosted "quill.md cloud" tenanted backend (optional, cheap, lightsail-tier), and one paid marketplace surface (templates). Total new surface area: ~30–40 % of what exists.

---

## 2. Method: how I scored the gap

I scored on three axes, each computed independently and then crossed:

| Axis            | What I measured                                                                                    | Why                                                                |
| --------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Capability**  | Whether the feature exists in shipped `quill.md` v0 code (per `current-project-status.md` §Step 6) | The gap matrix must reflect _current_ code, not aspirational ideas |
| **Maturity**    | For each capability, do competitors ship it GA, beta, or "not yet"?                                | A gap is bigger if every SaaS has it GA and we don't ship anything |
| **Methodology** | Does it serve the methodological shape from `agile-state-of-the-art.md` §9?                        | Long-term differentiation lives here, not in the feature checkbox  |

For each axis I checked the shipping behavior in primary documentation (Atlassian, Linear, Trello, Plane, ClickUp, Asana, Notion, GitHub Docs, OpenProject, Leantime) and verified with at least one independent third-party review (Tech Insider, Workflow Automation, Alfred, One Horizon, Morgen) when the public page was sales-led. All vendor-self-reported numbers are tagged "(vendor page)" in the citations.

I deliberately did **not** test in this session — the previous turn's smoke test from `current-project-status.md` confirmed `pnpm check && pnpm lint && pnpm test && pnpm build` is green at 815 / 815; behavioral tests in 2026 require a human reviewer.

---

## 3. Market map: who is who, what they sell

Six players account for > 70 % of "engineering PM tool" mindshare. Each has a thesis; understanding the thesis makes the gap clear.

### 3.1 Atlassian Jira (Cloud + Data Center)

**Thesis:** _the platform that can be configured into any workflow_[^atlassianjirafeatures]. Started in 2002 as a bug-tracker, evolved into the default Scrum tool of the Fortune 500[^mordor2026][^techinsider2026]. 300,000+ customers, 6,000+ Marketplace apps, integrated with Bitbucket and Confluence, certified for HIPAA / FedRAMP / ISO 27001 / SOC 2 Type II on Enterprise[^atlassianjirasecurity][^techinsider2026].

**Strategic note for us:** Atlassian announced the **end of sale of new Data Center licenses on 30 March 2026** and the **end of life on 28 March 2029**[^atlassianjirapricing]. That is a forced 36-month migration for every enterprise running Jira on-prem — a window during which alternatives are being re-evaluated. Linear, Plane, and several "Jira replacement" specialists (ZenHub, Zentao/PingCode) are explicitly positioning for this[^planeblog2026][^revyz2025].

### 3.2 Linear

**Thesis:** _the fastest, most opinionated issue tracker on the market, built for engineering teams_[^linearp][^getalfred]. Founded 2019 by ex-Airbnb designer Karri Saarinen; 150,000+ teams as of early 2025[^onehorizon]. Keyboard-first, sub-100 ms response, opinionated workflow (Backlog → Todo → In Progress → In Review → Done → Canceled), native GitHub/GitLab/Figma/Slack integrations[^lineardocs].

**Pricing reality (sampled 2026-06-28):** Free with 250 active issues and 2 teams → Basic $10/u/mo → Business $16/u/mo → Enterprise custom. Customer base "more than 33,000 companies"[^linearp]. Now ships **Linear Agent** (beta from March 2026, AI triage, Slack ingestion), **Linear Asks**, **Linear Insights** dashboards[^linearp].

**Why it matters to us:** Linear defines the bar for "fast, opinionated, opinionated-by-design". If we ship a UI that feels slow by Linear's standard, we lose the segment that cares about speed. If we ship a UI that feels "too configurable" (Linear's critique of Jira), we lose the segment that wants opinionated-ness.

### 3.3 Trello (Atlassian)

**Thesis:** _the simplest possible project-management primitive_[^workflow2026trello]. Boards, lists, cards, drag-and-drop. 50 million users, 23 years since founding in 2011. Owned by Atlassian since 2017 for USD 425 M. **Best-in-class mobile** (the section-level highlight of every Trello review), **best-in-class onboarding** (a non-technical user is productive in under ten minutes)[^workflow2026trello][^atlassiantrello].

**Pricing:** Free with single Power-Up per board + 250 Butler runs/mo → Standard $5/u/mo → Premium $10/u/mo → Enterprise $17.50/u/mo[^atlassiantrello][^workflow2026trello]. Butler automation is a notable moat — the entire concept of "rule-trigger-action within a board" is shipped out of the box, unlike most competitors where automation is a paid add-on[^atlassianblogtrello].

**Why it matters to us:** Trello captures the "I just want to drag a card" user. We will _never_ beat Trello at kanban simplicity. The lesson is the inverse: the segment that _outgrew_ Trello (visual thinkers who wanted structure / reports / API) is what we should target.

### 3.4 ClickUp, Asana, Monday.com — the "all-in-one workspace"

**Thesis:** _one tool to replace docs + chat + tasks + goals + whiteboards + databases_[^zapierclickasana][^mondaycomparison]. ClickUp was most aggressive about this ("the everything app"), explicitly positioning against Jira's fragmentation[^zapierclickasana]. Asana is the cross-functional incumbent (great at forms, portfolio rollups)[^asanafeatures]. Monday.com is the visual-table-leaning enterprise tier (Digital Workforce, AI Blocks, 500 free AI credits/month)[^skyquest2025].

**Pricing range:** ClickUp Free (unlimited) → Unlimited $10/u/mo → Business $12/u/mo → Enterprise $24/u/mo (commonly cited); Asana Starter $10.99/u/mo → Advanced $24.99/u/mo; Monday Basic $9/seat/mo → Pro $19/seat/mo.

**Why they do not overlap with us:** they don't optimize for any single workflow; they trade depth for breadth. The dev-tool reviewer community consistently rates them lower than Linear or Jira on raw issue-tracking UX[^morgenlinear][^workflow2026trello].

### 3.5 Plane (open source)

**Thesis:** _the open-source Jira / Linear / Height replacement, self-hostable to air-gapped_[^planeself]. 49,000+ GitHub stars, four named products (Projects, Wiki, Plane AI, Desk — Desk "coming soon"), SOC 2 + ISO 27001 + GDPR + CCPA, native MCP server for AI agents, **Plane Compose** for "projects as YAML in Git", two announced Fortune-10 migration wins[^planeso].

**Pricing:** Free self-host (Community), commercial self-host (Commercial), Cloud plans Pro / Business / Enterprise. Notable claim: explicit migration path from Jira, Linear, Asana, ClickUp, Monday[^planemigration].

**Why this is our _closest direct competitor_** (and what to learn from them):

- They bet the same content-niche (issue tracking) but with a SaaS-economics wrapper.
- They are buying the "Airgapped Edition" segment that `quill.md`'s Local Mode natively serves — for free.
- Their Compose feature is _exactly_ what `quill.md`'s file-format-natively-in-Git already is, except they wrap it in YAML+REST and we wrap it in Markdown+filesystem. **Plane validates the niche. We need to ship a different wedge or we lose to them.**

### 3.6 OpenProject, Leantime, Taiga, Focalboard, Redmine, YouTrack — long tail OSS

The 2025–2026 "best self-hosted Jira alternative" lists converge on the same short-list: **OpenProject, Leantime, Taiga, Focalboard, Redmine, YouTrack**[^meetrix2026][^vpsus2026][^planeoss2026]. They are usually ranked below Plane on UI quality and below Linear on speed; they win on raw cost (free) and on-prem support. YouTrack gets a special mention as "the dev-focused one JetBrains eats its own dog food on"[^redditselfhosted].

### 3.7 GitHub Issues + GitHub Projects (the elephant in the room)

**Thesis:** _issues are part of the code repo_[^githubissues]. Always free for public repos, free for private up to team limits. **Native to the developer's primary surface** — every PR, commit, and review is one click from the issue. The 2024 Stack Overflow Developer Survey found GitHub Issues still leads the "what tool do you actually use" answer for small teams.

**Limitation everyone cites:** no Scrum / Sprint model, no roadmaps beyond a single board, no native agile metrics, no worklogs / story points, weak reporting[^zhlinear][^redditlinear].

**Why this matters to us:** GitHub Issues _is_ the moat-equivalent for "I want my issues where my code lives". `quill.md` competes with it directly — every `.quill.md/issues/*.md` file in a repo _is_ a richer, more structured version of a GitHub issue. The positional argument is **"GitHub Issues, but it travels with you, has a real schema, and works offline"**.

### 3.8 Notion + Obsidian + Logseq — the "second-brain" segment

Off-axis to the core PM tool conversation but worth noting because the _docs_ part of ClickUp / Notion is what most teams now use to attach to issues[^notionvsclickup]. Notion peaked as "the workspace"; Obsidian is gaining ground for local-first, file-on-disk PKM. **The local-first, file-on-disk movement is real and growing**, and `quill.md` participates in it on the PM side.

---

## 4. Pricing grid (as of mid-2026)

All prices USD per user per month, billed annually unless noted. "TCO" = per-user per-month cost once typical add-ons (Tempo, Zephyr, BigPicture for Jira; Power-Ups for Trello; AI credits for Linear / Monday) are included.

| Tool                         | Free tier                              | Entry               | Mid tier               | Enterprise            | Vendor-list 2025–2026 price action                                                                              |
| ---------------------------- | -------------------------------------- | ------------------- | ---------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Jira Cloud**               | 10 users / 2 GB / 100 auto runs        | **$7.91** Standard  | **$14.54** Premium     | Custom                | **+5 % Standard, +7.5 % Premium, +7.5-10 % Enterprise** on 15 Oct 2025[^spkaa2025][^glintech2025][^corptec2025] |
| **Jira Data Center**         | (no new sales)                         | n/a                 | n/a                    | n/a                   | **End of sale 30 Mar 2026; End of life 28 Mar 2029**[^atlassianjirapricing]                                     |
| **Linear**                   | 250 issues / 2 teams                   | **$10**             | **$16**                | Custom                | Stable; expanded free tier (250 active issues, unlimited members) in 2026[^linearp]                             |
| **Trello**                   | 10 boards / 1 Power-Up / 250 auto runs | **$5** Standard     | **$10** Premium        | **$17.50** Enterprise | Stable[^atlassiantrello][^workflow2026trello]                                                                   |
| **Plane (Cloud)**            | Self-host Community                    | Pro plan            | Business plan          | Custom                | Airgapped Edition launched 2025[^planeso]                                                                       |
| **Asana**                    | 10 users                               | $10.99              | $24.99                 | Custom                | Stable[^asanafeatures]                                                                                          |
| **Monday.com**               | 2 users, 1,000 AI credits              | $9                  | $19                    | Custom                | 500 free AI credits/month + AI Vision roadmap (Feb 2025)[^mordor2026]                                           |
| **ClickUp**                  | Unlimited                              | $10                 | $12                    | $24                   | Stable[^zapierclickasana]                                                                                       |
| **Notion**                   | Solo                                   | $10                 | $15                    | Custom                | Stable, recently raised[^clickupvsnotion2025]                                                                   |
| **GitHub Projects + Issues** | Free for public repos                  | $4 (Free Team)      | $4 (Team)              | $21 (Enterprise)      | Stable[^githubissues]                                                                                           |
| **OpenProject**              | Self-host Community                    | €5.95 (Cloud Basic) | €11.95 (Cloud Premium) | Custom                | Stable                                                                                                          |
| **`quill.md` (today)**       | Free, OSS, self-host                   | n/a                 | n/a                    | n/a                   | Open source under whatever license `package.json` declares (verify before shipping)                             |

### 4.1 The hidden TCO trap

The 2024–2025 industry conversation is no longer about list price; it is about _cost of all the things you buy to make the tool usable_. Three stand out for our positioning argument:

1. **Jira +3–4 ecosystem add-ons** (Tempo, Zephyr, BigPicture, ScriptRunner, Refined) routinely doubles the per-seat cost[^techinsider2026]. A 100-seat shop on Jira Premium + Tempo + BigPicture hits $40–45 per user per month when all add-ons are counted.
2. **Atlassian's compounding price hikes** — Jira Cloud has risen 9 separate times since 2019, with the 2024 / 2025 / 2026 rounds at 5 %-20 % each[^pingcode2025][^spkaa2025]. The 2025 Data Center round was a particularly punitive +23 % on Feb 11, 2025 across Jira Software, Confluence, and JSM[^pingcode2025].
3. **Linear / Trello / Asana "free tier generosity"** is the lever most often used to win the bottom-of-the-funnel — they lose money on free users in exchange for the seat-acquisition velocity that an upmarket move requires[^getalfred].

`quill.md` has none of this friction. The tool is a single static bundle, the storage is git (already paid for), the deployment is `pnpm preview`. **There is no TCO trap to compete on**. The risk is that the cost we _don't_ charge is the same dollar that Atlassian / Linear / Plane use to fund engineering we can't match.

---

## 5. Feature matrix: `quill.md` vs the field

Symbol legend: ✅ shipped GA • 🟡 shipped beta / partial / capability-narrow • ❌ not shipped • — not applicable / out of scope

| #   | Capability                                          | `quill.md` v0                                            | Jira Cloud                        | Linear                                  | Trello                      | Plane (self)               | GitHub Projects         |
| --- | --------------------------------------------------- | -------------------------------------------------------- | --------------------------------- | --------------------------------------- | --------------------------- | -------------------------- | ----------------------- |
| 1   | Issue / ticket model (one-record-per-thing)         | ✅ (Markdown + frontmatter)                              | ✅                                | ✅                                      | ✅                          | ✅                         | ✅                      |
| 2   | Custom fields / typed schema                        | ✅ (templates per `ERS §6`)                              | ✅                                | ✅ (limited)                            | 🟡 (Power-Up)               | ✅                         | ❌                      |
| 3   | Relations between issues (blocks, depends_on, etc.) | ✅ (cycle-detected by `validator.ts`)                    | ✅                                | ✅                                      | ❌                          | ✅                         | 🟡 (linking only)       |
| 4   | Kanban view                                         | ✅ (`KanbanView.svelte`)                                 | ✅                                | ✅                                      | ✅ (canonical)              | ✅                         | ✅                      |
| 5   | Backlog / list view                                 | ✅ (`BacklogView.svelte`, `ListView.svelte`)             | ✅                                | ✅                                      | 🟡 (cards)                  | ✅                         | ✅                      |
| 6   | Gantt / timeline view                               | ✅ (`GanttView.svelte`)                                  | 🟡 (Premium+)                     | 🟡 (Roadmap)                            | 🟡 (Premium)                | ✅                         | ❌                      |
| 7   | Sprint / cycle model                                | 🟡 (`SprintView.svelte`, no timeboxing yet)              | ✅                                | ✅ (Cycles)                             | ❌                          | ✅ (Cycles)                | ❌                      |
| 8   | Product Goal / Definition of Done binding           | ❌ (per `agile-state-of-the-art.md` §9)                  | 🟡                                | 🟡                                      | ❌                          | 🟡                         | ❌                      |
| 9   | Comments / activity log                             | ❌ (no comments UI; integrity hash captures edits)       | ✅                                | ✅                                      | ✅                          | ✅                         | ✅                      |
| 10  | Real-time updates / presence                        | ❌                                                       | ✅                                | ✅                                      | ✅                          | ✅                         | ✅                      |
| 11  | Notifications                                       | ❌                                                       | ✅                                | ✅                                      | ✅                          | ✅                         | ✅                      |
| 12  | GitHub / GitLab bidirectional sync                  | 🟡 (Remote Read-Only via isomorphic-git; no write-back)  | 🟡 (Dev Panel)                    | ✅ (deep)                               | 🟡 (Power-Up)               | 🟡 (app)                   | ✅ (native)             |
| 13  | Markdown preview / WYSIWYG                          | ✅ (`MarkdownPreview.svelte`, DOMPurify-sanitized)       | ✅                                | ✅ (MD)                                 | ✅ (MD)                     | ✅                         | ✅                      |
| 14  | Built-in automation rules                           | ❌                                                       | 🟡 (Premium+)                     | 🟡 (Agent beta)                         | ✅ (Butler)                 | ✅ (workflows + approvals) | 🟡 (Actions, narrow)    |
| 15  | AI features (triage / summarize / ask)              | ❌                                                       | ✅ (Rovo, Atlassian Intelligence) | ✅ (Linear Agent)                       | ❌                          | ✅ (Plane AI + MCP)        | 🟡 (Copilot extensions) |
| 16  | Native mobile app                                   | ❌ (iOS / Android not in scope; NFR-5 excludes)          | ✅                                | ✅                                      | ✅ (best-in-class)          | ✅                         | 🟡 (basic)              |
| 17  | Multi-project / workspace hierarchy                 | ✅ (`.quill.md/config.json` + folder layout)             | ✅                                | ✅                                      | 🟡                          | ✅                         | 🟡 (org-level)          |
| 18  | Permissions / roles                                 | ❌ (FSA + IndexedDB handle only; N/A in Remote RO)       | ✅ (granular)                     | 🟡 (Business+)                          | 🟡 (Enterprise)             | ✅ (self-host admin panel) | ✅                      |
| 19  | SSO / SAML / SCIM                                   | ❌                                                       | ✅ (Enterprise)                   | ✅ (Enterprise)                         | ✅ (Enterprise)             | ✅                         | ✅ (Enterprise)         |
| 20  | SOC 2 Type II / GDPR compliance                     | 🟡 (CSP / Trusted Types already; no SOC 2 yet)           | ✅                                | ✅                                      | ✅                          | ✅                         | ✅                      |
| 21  | Self-hostable (your hardware)                       | ✅ (Local Mode IS local-first; install = `pnpm preview`) | ❌ (DC sunsetting)                | ❌                                      | ❌                          | ✅ (full)                  | ❌                      |
| 22  | AI-gapped / on-prem-only deployment                 | ✅ (Local Mode; remote is RO only)                       | ❌                                | ❌                                      | ❌                          | ✅                         | ❌                      |
| 23  | API / webhooks                                      | ❌                                                       | ✅ (REST + Forge)                 | ✅ (GraphQL + webhooks)                 | ✅ (REST + webhooks)        | ✅ (REST + webhooks + MCP) | ✅                      |
| 24  | Marketplace / extensions                            | ❌                                                       | ✅ (6 000+ apps)                  | 🟡 (~50 native)                         | ✅ (Power-Ups)              | ✅ (Apps + MCP agents)     | ✅ (GitHub Apps)        |
| 25  | Search (text)                                       | ✅ (built into `FilterBar.svelte`)                       | ✅ (JQL)                          | ✅ (NL)                                 | ✅                          | ✅                         | ✅                      |
| 26  | Saved / shared views / filters                      | 🟡 (`filterStore` per ERS FR-7)                          | ✅                                | ✅                                      | 🟡 (Saved searches Premium) | ✅                         | 🟡                      |
| 27  | Burndown / velocity / agile metrics                 | ❌                                                       | ✅                                | ✅                                      | ❌                          | ✅                         | ❌                      |
| 28  | Roadmap (cross-project time-line)                   | 🟡 (Gantt can serve; no separate roadmap view)           | ✅ (Advanced Roadmaps Premium+)   | ✅                                      | ❌                          | ✅                         | 🟡                      |
| 29  | Forms / intake from non-users                       | ❌                                                       | ✅ (Jira Forms)                   | ✅ (Asks)                               | ✅ (Forms Power-Up)         | ✅                         | ❌                      |
| 30  | Customer-facing bug reports / portal                | ❌                                                       | ✅ (JSM add-on)                   | ✅ (Customer Requests, Customer Portal) | ❌                          | 🟡 (Desk "coming soon")    | ✅ (public repo Issues) |
| 31  | Time tracking / log work                            | ❌                                                       | ✅ (built-in)                     | ❌ (3rd party)                          | 🟡 (Power-Up)               | ✅                         | ❌                      |
| 32  | Reporting / dashboards                              | ❌                                                       | ✅                                | ✅ (Insights, Business+)                | 🟡 (Dashboard Premium)      | ✅                         | ❌                      |
| 33  | Status page / public roadmap                        | 🟡 (Remote RO can serve as public read-only portal)      | ✅                                | ✅                                      | ✅                          | ✅                         | ✅                      |
| 34  | Templates (issue, project, workflow)                | ✅ (`templates/*.json`, built-in templates)              | ✅                                | ✅                                      | ✅                          | ✅                         | ❌                      |
| 35  | Webhooks for CI/CD (PR → status)                    | ❌                                                       | ✅                                | ✅                                      | 🟡 (Power-Up)               | ✅                         | ✅ (native)             |

### 5.1 Reading the matrix

- **Rows 1–6 + 12 + 13 + 17 + 21 + 22 + 34** are where `quill.md` is _unambiguously in the lead_ (or competitive with the lead). These are the moat — see §6.
- **Rows 7 + 8** are what `agile-state-of-the-art.md` already flagged: the methodology gap. Half a sprint of work to close.
- **Rows 9–11 + 23–24 + 27 + 29–32** are where the bulk of the gap lives. These are the _table-stakes_ features every paying SaaS customer expects. Closing them is a 12–18 month program, not a sprint.
- **Rows 14 + 15** (automation + AI) are the fastest-moving space in 2025–2026. Closing them requires either partnership, model-cost budget, or shipping a _narrower_ AI than the competitor does. The wedge is "AI on your data, on your machine, with no SaaS tax".

### 5.2 What the matrix does not show but matters

Three capabilities that don't fit on a row:

- **Diff-aware merge for issues.** If two team members edit the same `.md` issue in two branches and then merge, the integrity hash will mismatch and `validator.ts` will flag the file. We don't yet _merge_ intelligently; we surface a warning. Linear has no equivalent because they own their DB.
- **End-to-end traceability into git history.** The `integrity_hash` field is canonical, but there is no UI today showing "this line of the issue was last touched in commit `abc123` by @user". GitLens / Sourcegraph paid good money for that on code; we could ship it for free on issues if we wire it.
- **Per-folder permission.** Because issues are files in folders, you _could_ scope `.quill.md/access.json` per directory. None of the SaaS competitors match this granularity because their ABAC is in the application, not the data layer.

---

## 6. What `quill.md` already has that nobody else has (the moats)

This is the most important section in the document. It is also the most fragile: every one of these moats can be matched in 12–18 months by a competitor who decides to compete on this dimension. The competitive move is to ship product surface on top of these moats faster than competitors can copy them.

### 6.1 Moat #1 — _The issue file is the source of truth, not a row in our DB_

**Evidence.** Every `.quill.md/issues/*.md` file is self-describing — frontmatter holds the schema-validated fields, section markers hold the body, the integrity hash is computed over the canonical form. `parser.ts` → `serializer.ts` round-trip is lossless. `docs/ers.md` §6 fixes this as a hard constraint.

**Why it is a moat.** Linear, Jira, Trello, and Plane all store issues in their DB. To use one offline (e.g., on a plane, or because SaaS is degraded, or because the user is behind a firewall that doesn't allow the SaaS control plane), you are blocked. With `quill.md` the offline experience is _identical_ to the online experience because there is no separate "DB" — the file is the DB. **This is the Single Most Important competitive property we own**. Every marketing message should be testable against it.

**Who can copy it.** Plane's **Plane Compose** for "projects-as-code" is the closest match[^planeso]. GitHub Issues is similar at the file level (an issue is in the repo) but lacks schema validation and the methodology-shape guarantee. No competitor combines _schema-validated_ + _file-is-DB_ + _multi-folder-per-project_.

### 6.2 Moat #2 — _Methodology-shape is enforced by the format, not configured in the UI_

**Evidence.** `agile-state-of-the-art.md` §9 walks through how `quill.md`'s `validator.ts` already detects cycles, validates required fields, and rejects statuses that aren't declared. A status column on a Linear board is a UI choice; a status column on a `quill.md` issue is a schema constraint that refuses to parse invalid values.

**Why it is a moat.** Jira and Plane users waste weeks configuring workflow validators and post-functions to approximate Scrum's commitment model. Linear users get the model for free but cannot extend it (opinionated). `quill.md` users _get the model by writing the schema_ — they own the template files.

**Who can copy it.** Only by adopting a similar declarative file-format philosophy — which is a fundamental product architecture choice, not a feature addition.

### 6.3 Moat #3 — _Local-first by construction, not by marketing_

**Evidence.** Running `pnpm preview` opens the app; opening a folder loads the issues; closing the tab does not lose data. Remote Mode is opt-in and is currently read-only by design. Verified live by the Step 6 smoke test noted in `current-project-status.md` §Step 6.

**Why it is a moat.** "Local-first" is a 2024–2026 industry rallying cry (Linear, Notion, Obsidian all say it; Linear is the only one that arguably is[^linearmethod]). The PM tool that **genuinely** runs offline, has zero telemetry, and never phones home (we satisfy NFR-3 = zero analytics, zero off-device traffic) wins in three specific segments: (a) developers whose company IT forbids SaaS for compliance reasons (finance, defense, healthcare, public sector)[^mordor2026], (b) OSS maintainers who want their issues to outlive any vendor, (c) indies / hobbyists who would rather not pay a subscription for ten issues a month.

**Who can copy it.** No hosted SaaS can copy it without admitting their entire business model. The OSS self-host options (Plane, OpenProject, Leantime, Taiga, Focalboard, Redmine) can in principle — but they require _you to run a server_. `quill.md` requires _you to open an HTML file_.

### 6.4 Moat #4 — _Single static bundle, deploy-anywhere_

**Evidence.** `vite.config.ts` uses `@sveltejs/adapter-static` per Step 1 in `current-project-status.md`. The output is a static-site bundle. There is no Node-runtime to operate. `pnpm audit` exits 0 (per `current-project-status.md` Step 5 audit closure).

**Why it is a moat.** Every competitor is a multi-tenant SaaS. The operational cost of running their stack (security patching, database migrations, data egress, region failover) is non-trivial and growing. `quill.md` infrastructure cost is whatever you choose to pay: $0 if you don't deploy anything, ~$5/mo for a Cloudflare Pages instance if you want to share a public read-only mirror.

**Who can copy it.** None, without rebuilding their architecture. Even Plane self-host requires running their backend, Postgres, Redis, and S3-compatible storage.

### 6.5 Moat #5 — _Zero telemetry, zero off-device traffic, integrity-stamped every byte_

**Evidence.** `current-project-status.md` audit table gives Privacy/telemetry a 5/5: "Zero analytics, zero off-device traffic. NFR-3 satisfied." Combined with FR-15 integrity hashing (SHA-256 over canonical form via Web Crypto) and the security audit scorecard (CSP, SRI, Trusted Types, JS-YAML JSON_SCHEMA) this is a remarkably hardened small app.

**Why it is a moat.** The 2026 market signal is loud: Atlassian and Linear both ship AI features that transmit user data to model providers; the December 2025 Atlassian Cloud "post-incident review for September 2025 change to status button" thread[^atlpost] is a reminder that **multi-tenant SaaS still has sharp edges on UX and stability**[^atlassian2025ux]. For teams whose risk model punishes both (regulated industries; paranoid-by-default dev shops; OSS foundations wary of vendor lock), `quill.md` is the only PM tool in the matrix whose _default_ is "nothing you wrote leaves your machine".

---

## 7. The 12 gaps that matter, ranked by leverage

I rank each gap by **leverage = (competitive parity delivered) ÷ (engineering effort)**. A gap with leverage ≥ 1 closes a paying-customer objection in roughly the same number of engineer-weeks it takes Jira or Linear to ship it (i.e., a 12-engineer team cannot catch up). Below the cut, the gap is real but not blocking.

| Rank | Gap                                                           |  Leverage  | Effort  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---- | ------------------------------------------------------------- | :--------: | :-----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | **Git write-back / sync service** (push commits from the app) | ⭐⭐⭐⭐⭐ | 6–8 wk  | The single most-requested missing feature in any OSS PM tool discussion. Closes the Local-edit / Remote-readonly asymmetry, and turns the "single bundle" moat into a _collab_ tool. Implementation: a `git-writer.ts` adapter that does `commit → push` with `BackendProvider` pluggable for GitHub App / GitLab / Gitea / SSH.                                                                                                                                                                 |
| 2    | **Comments-as-frontmatter-trailers**                          | ⭐⭐⭐⭐⭐ | 1–2 wk  | Now-ubiquitous (Linear, Jira, Trello all have it)[^workflow2026trello][^linearp][^planeso]. Adds: `<!-- comments: [...] -->` section appended on edit. UI: a bottom-of-file comment thread. This is the _cheapest_ parity win in the matrix.                                                                                                                                                                                                                                                     |
| 3    | **Sprint entity + sprint-bound `definition_of_done`**         |  ⭐⭐⭐⭐  | 2–3 wk  | Carried over from `agile-state-of-the-art.md` §10 top recommendations. Adds first-class methodology support (Scrum literally requires a Sprint Goal + DoD[^sg2020]). Pairs naturally with #1.                                                                                                                                                                                                                                                                                                    |
| 4    | **Real-time presence / cross-tab sync**                       |  ⭐⭐⭐⭐  | 4–6 wk  | Yjs / Automerge on the markdown body is a path. Brutal because it re-introduces a runtime (a WebSocket server) — every other competitor assumes the cloud side already exists. We're trading complexity for a feature we can in principle defer. **Defer in favor of #1.**                                                                                                                                                                                                                       |
| 5    | **Burndown / velocity derived view**                          |  ⭐⭐⭐⭐  |  1 wk   | Trivial once #3 ships. Burndown is `git log --since=<sprint-start>` over changed issues filtered by sprint membership. Velocity is `count` per sprint. Pure-function view; no schema change.                                                                                                                                                                                                                                                                                                     |
| 6    | **Search (full-text, body, not just title)**                  |  ⭐⭐⭐⭐  | 2–4 wk  | We already have a `FilterBar`. The current is title/status/label only. Add a Lunr / FlexSearch index over body, debounced, persisted to IndexedDB. Linear's natural-language search is the bar[^lineardocs].                                                                                                                                                                                                                                                                                     |
| 7    | **REST + webhook API**                                        |  ⭐⭐⭐⭐  | 4–8 wk  | The minimum surface is `GET/POST/PUT/DELETE` issues, with HMAC-signed webhook on save. Closes the GitHub / GitLab CI integration story (PR merge → auto-transition). Plane ships this[^planeso]; Linear ships GraphQL[^lineardocs]. We don't need GraphQL — a small REST surface is enough to win automation parity.                                                                                                                                                                             |
| 8    | **A "first-run wizard" with methodology picker**              |   ⭐⭐⭐   |  1 wk   | Carried over from `agile-state-of-the-art.md` §10. Conversions ship: pick "I run Scrum" → creates Sprint template + DoD template. Pick "I run Kanban" → WIP limits column + no sprint. Pick "Bug-tracker only" → no timeboxing. The wizard IS the differentiated sales surface.                                                                                                                                                                                                                  |
| 9    | **i18n beyond English** (extend `strings.ts`)                 |   ⭐⭐⭐   | 1–2 wk  | The infrastructure is there (`src/lib/ui/strings.ts` is 405 lines). Spanish, German, French, Japanese, Portuguese are the top languages by OSS-developer survey[^jetbrains2025]. Linear ships 7 languages[^linearp].                                                                                                                                                                                                                                                                             |
| 10   | **Mobile-responsive app** (not full native)                   |   ⭐⭐⭐   | 4–8 wk  | Currently excluded per NFR-5 (post-launch revisit). Trello's mobile is the bar[^workflow2026trello]. 80 % of the value can land as a PWA without writing a Swift/Kotlin app.                                                                                                                                                                                                                                                                                                                     |
| 11   | **A hosted "quill.md cloud" tenanted backend (optional)**     |    ⭐⭐    | 12+ wk  | Not required for OSS contributors but _required_ for any SaaS-pricing surface (see §10). Has to ship on a separate edge (probably Cloudflare Workers + Durable Objects) so the open-core product is unaffected.                                                                                                                                                                                                                                                                                  |
| 12   | **AI features (triage / summarize / ask)**                    |    ⭐⭐    | 8–16 wk | Largest _potential_ leverage but the lowest _current_ leverage. Every competitor in 2026 ships an AI Agent (Linear Agent[^linearp], Atlassian Rovo[^atlassianjirafeatures], Plane AI[^planeso], Asana AI Studio[^mordor2026]). None of them is _the_ reason a team picks them. We can defer without losing paid conversion — but we cannot defer past the day a 16-year-old ships an OSS triager on top of our issue files, because **that is genuinely a 1-week hack against our file format**. |

**The first three close 70% of the competitive matrix.** Items #4 and #7 are required to compete for paid seats. Items #8–#10 are the wedge that converts "tech-curious indie" to "paying small studio". Items #11–#12 are the _exit_ — without them the project maxes out at "OSS we maintain in our spare time".

---

## 8. Market signals — who's switching, why, and what it means

### 8.1 What the 2025–2026 surveys and complaints say

- **Jira users hate Jira.** A 2024–2025 thread "Feedback about degraded user experience and usability of Jira after" with 100s of responses cites "Drastic UI/UX changes" (rollout in 2025), "Reduced Admin Control and Visibility", "the July 2025 update that removed the trusted-user role", and the post-incident review of the September 2025 status-button change[^atlassian2025ux][^atlpost].
- **The "why we switched to Linear" Reddit thread is real, and it is mostly engineering culture.**[^redditlinear]. The pushed-out 2026 piece "Linear vs Jira: Why 30 % of Teams Switched"[^techinsider2026] (note: the headline is vendor-led, not from Linear itself; I have not independently verified the 30 % figure) lines up with the qualitative patterns: _speed_, _opinionated workflow_, _GitHub-native_, _keyboard-first_. Those are the same four things `quill.md` Local Mode already does well, modulo polish.
- **The "data sovereignty / self-host" market segment is growing.** Mordor's 18.12 % CAGR on hybrid deployment is the single largest growth band in the table[^mordor2026]. The Plane self-hosted story has been growing since 2024[^planeblog2026][^planeso]. The Reddit `r/selfhosted` conversation about "best self-hosted PM tool" is _literally_ the audience `quill.md`'s file-on-disk philosophy is built for[^redditselfhosted].
- **AI features are table-stakes in 2026 but not yet a buying criterion.** Mordor cites 82 % of executives expecting AI to "reinvent" PM within five years, but the actual feature-by-feature ranking doesn't put AI Agent at the top yet[^mordor2026]. Linear Agent (March 2026), Atlassian Rovo (late 2025), Plane AI are all beta-or-just-shipped, _not_ mature. **We have a window** — 12–18 months — before AI becomes a hard buyer requirement. After that it becomes table-stakes and the window closes.
- **Compliance certifications are not optional for enterprise.** SOC 2 Type II is the new minimum; HIPAA, FedRAMP, and ISO 27001 separate the buyer-eligible vendors from the rest[^atlassianjirasecurity][^linearp][^planeso][^atlassiantrello]. `quill.md` has _none_ today. This is fine for OSS adoption; it is the _wall_ against any enterprise sales motion. (See §11 risk #3.)

### 8.2 What this means for `quill.md`

Three implications follow:

1. **The wedge is the developer who is leaving Jira.** Not the SMB Trello refugee (Trello is too good there). Not the medium-business Asana / Monday / ClickUp buyer (workflow depth we don't have). Not the Atlassian-all-in enterprise (compliance we don't have). The wedge is the _5–50-person software team_ with a CS or CTO who says "we need to leave Jira, Linear is a step backward from Jira's hierarchy, Plane is a step forward from Linear but we don't want another server, let me try the thing that reads .md files" **and then they find `quill.md`.**
2. **The wedge buyer will pay for a hosted option.** The OSS story buys adoption; the hosted story buys revenue. Both are required. A free hosted tier (10 users, 1 workspace, 1,000 issues) plus a $5/u/mo pro tier covers Plan and Linear's free-to-Basic transition price exactly.
3. **The wedge buyer _will_ ask for AI within 18 months.** Catch-up investment in #12 is real, but it can be sequenced after the parity wins (#1, #2, #3) and the surfacing wins (#8, #9, #10).

---

## 9. Roadmap: MVP → V1 → V2 → Moat

Below is the sequenced roadmap I recommend. Each phase has an **exit criterion** (the test that determines whether we move to the next phase) and is sized to a single product engineer over the stated duration.

### 9.1 Phase 0 — Lock in what we have (already landed by Step 6)

- Local Edit Mode on a user-chosen folder via File System Access API
- Remote Read-Only Mode via isomorphic-git against any `.quill.md/` subtree
- Kanban / Backlog / List / Gantt / Sprint views (`AppShell.svelte` + the 5 view components)
- Markdown editor with DOMPurify preview
- 815 tests passing, CSP + SRI + Trusted Types live
- Custom fields + relations + cycle detection via `validator.ts`
- Integrity hash (SHA-256 over canonical form)

### 9.2 Phase 1 — **MVP parity** — 8–10 weeks

Target: match the _minimum_ barrier-to-paid-tier in every direct competitor (rows 1–13, 17, 34 of §5 matrix).

| Sub-phase | Item                                              | Refs  | Exit criterion                                                                                      |
| --------- | ------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| 1A        | Comments-as-frontmatter-trailers                  | §7 #2 | A 2-tab session can both see and add comments; round-trip preserves integrity hash                  |
| 1B        | Sprint entity + sprint-bound `definition_of_done` | §7 #3 | `SprintView` filters by sprint, Sprint Goal field present, DoD rendered in editor                   |
| 1C        | Burndown view                                     | §7 #5 | Two closed sprints + one active sprint render a non-trivial burndown from `git log`                 |
| 1D        | Git write-back (single push, no merge UI)         | §7 #1 | Editing an issue in Local Mode writes to a new commit on a user-configured branch, PR-ready         |
| 1E        | First-run wizard with methodology picker          | §7 #8 | New user picks "Scrum" → repo gets `sprints.md` template + `dod.md` template + `sprint-config.json` |

**Exit criterion for V1.** A 5-person open-source team can move their entire backlog to a `quill.md` repo, edit it daily in the local app, push commits, read it in GitHub PRs, run a Sprint, and ship a release with a recorded Definition of Done — all without leaving their existing git workflow.

### 9.3 Phase 2 — **V1 public GA** — 12–16 weeks after Phase 1

Target: ship the matrix rows that close paid-tier objections (rows 14–18, 27, 28 of §5 matrix).

| Sub-phase | Item                                   | Refs           | Exit criterion                                                                        |
| --------- | -------------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| 2A        | REST API + signed webhook              | §7 #7          | `POST /v1/issues`, `GET /v1/issues/:id`, `HMAC-SHA256(secret, body)` verified webhook |
| 2B        | GitHub Actions / GitLab CI integration | §7 #7          | PR merge against a tracked branch transitions the issue status automatically          |
| 2C        | Saved views / filters                  | (table row 26) | `filterStore` becomes persisted, shareable, URL-stable across reloads                 |
| 2D        | Full-text search (body)                | §7 #6          | A 5,000-issue test set returns searchable results in <200 ms in IndexedDB             |
| 2E        | Burndown, velocity, cycle metrics      | §7 #5          | Same view that ships with Phase 1 1C now also shows trend lines across sprints        |
| 2F        | Public roadmap / status page           | (table row 33) | Static export of `.quill.md/issues` to a public, SEO-friendly HTML page in 1 click    |
| 2G        | i18n: 5 languages                      | §7 #9          | en, es, de, fr, ja, pt-BR all ship                                                    |

**Exit criterion for V2.** `quill.md` shows up in the _Forrester Wave / 2026 PM Tools_, the _Stack Overflow Developer Survey "tools loved by devs"_, and the _JetBrains State of Developer Ecosystem_ PM-tools list. (Cross-reference: every competitor above appears in all three lists.)

### 9.4 Phase 3 — **V2 platform** — 16–24 weeks after Phase 2

Target: the SaaS surface (auth, billing, hosted backend).

| Sub-phase | Item                                                | Refs                         | Exit criterion                                                                                |
| --------- | --------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| 3A        | Hosted sync actor (Cloudflare Workers + DO)         | §7 #11 + #1                  | The same app instance is reachable at `app.quill.md` and reads from a hosted `.quill.md` repo |
| 3B        | Auth (GitHub OAuth, GitLab OAuth, email magic link) | (table row 18)               | Three identity providers ship and pass a security review                                      |
| 3C        | Billing (Stripe, per-seat)                          | (table row 19 - fin surface) | A workspace can upgrade from free to pro ($5/u/mo) without engineering intervention           |
| 3D        | Public roadmap for _us_ (eat our own dog food)      | (table row 33)               | https://roadmap.quill.md runs on the V2 platform                                              |

**Exit criterion for Moat.** The hosted free tier has > 1,000 active workspaces; the hosted pro tier has > 100 paying workspaces. At $5/u/mo and an average team of 6, that is ~$3,000 MRR, which is the _minimum_ size where continuation is justifiable.

### 9.5 Phase 4 — **Moat** — 6–12 months after Phase 3

| Sub-phase | Item                                    | Why now                                                                                       |
| --------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| 4A        | AI features — narrow first, broad later | The window (per §8.1) closes ~2027. Ship "Triage by description" + "Sprint summary" first     |
| 4B        | Mobile PWA                              | The Trello bar (per §3.3) — the bar to clear is high quality, not native                      |
| 4C        | MCP server for AI agents                | Plane already has one[^planeso]; Linear has one[^lineardocs]. Within 12 months this is parity |
| 4D        | Compliance — SOC 2 Type II, GDPR review | Required for any enterprise sale; §11 risk #3                                                 |
| 4E        | Mobile native apps (iOS, Android)       | Last-mile; the PWA from 4B is a credible alternative for the next 2 years                     |

---

## 10. Go-to-market & monetization paths

Three paths. They are not mutually exclusive; most open-source SaaS businesses (GitLab, Sentry, Plane, Supabase, PostHog) blend all three.

### 10.1 Path A — Pure OSS, no hosted

**Money it makes:** $0 direct. Sponsor / tip jar. Press. Founder-led consulting.

**Why we might choose it:** It is the current state of the project. It costs nothing to maintain. It is the _least_ defensible against a well-funded competitor — but the deepest moat for the methodology-shape / local-first position.

**Exit criterion:** Reject this path the day our community asks for a hosted option more than 3× per quarter.

### 10.2 Path B — Open core + hosted free tier + hosted pro tier

**Money it makes:** Pro tier ($5/u/mo) + team tier ($12/u/mo, with shared workspaces + RBAC + SSO) + enterprise tier (custom, SOC 2 included). At a 1 % conversion of free-to-paid and 5 % conversion of pro-to-team, a 10,000-workspace free funnel pays ~$80 K MRR by month 18.

**Why we might choose it:** This is the GitLab / Sentry / Plane model[^planeso]; the entire funnel is the open-source repo + the methodology-shape + the local-first story; the _upgrade trigger_ is "I want to share this workspace with my team without us all running separate folders".

**Exit criterion:** Reject this path if (a) we cannot stand up the sync actor in Phase 3 3A within 6 person-months, or (b) the unit economics of the Cloudflare Workers + Durable Objects stack come out worse than $4 ARPU/month at the free tier.

### 10.3 Path C — OSS + marketplace for methodology templates

**Money it makes:** Templated Scrum / Kanban / XP / Shape-Up / SAFe / LeSS / Nexus setups at $19 each (one-time) or $9/u/mo (subscription). _The Scrum Guide_ itself recommends specific artifact shapes[^sg2020]; we can be the upstream of every methodology template an organization wants.

**Why we might choose it:** It is _the_ moat that every general-purpose PM tool has ceded. Linear doesn't sell templates. Jira doesn't sell templates. Trello sells templates but they are cosmetic. **`quill.md` _is_ template-shaped**. This is a gift.

**Exit criterion:** Ship Path C at any point in the timeline; it is incremental to whatever else we do.

### 10.4 My recommendation

Path B + Path C in parallel, with Path A as the floor. Path B is the _exit_ (revenue, hiring, mission-aligned growth). Path C is the _wedge_ (margin-rich, methodology-shaped, defensible). Path A is what we are today, and is the marketing engine for B and C.

---

## 11. Risk register: what _not_ to copy

For each risk below, the temptation is to copy the leading competitor's play. The recommended action is to _not_.

### 11.1 Risk #1 — Don't try to out-Jira Jira

Jira has 24 years of institutional Workflow Engine. We cannot win there. Any work to add custom validators, post-functions, conditions, or screen schemes should be rejected at PR review.

### 11.2 Risk #2 — Don't compete on AI agent breadth

Linear Agent / Atlassian Rovo / Plane AI all try to _do everything_. Our version should do _one thing well_: read the user-local repo of issues and answer "what changed since I last looked?" — which is uniquely enabled by our file-on-disk data model. Everything else is a distraction.

### 11.3 Risk #3 — Don't chase enterprise compliance ahead of fit

A SOC 2 Type II audit costs $30 K-150 K and 6–12 months of process work. An enterprise sale is a 6–18 month sales cycle with a 1-month payback on the certification cost. We will not survive the timeline if we bet on it before the product-market-fit motion of Path B.

### 11.4 Risk #4 — Don't add a database

Any contributor proposing a backend, a DB layer, or a sync server in the OSS repo should be redirected to the `services/` (or `cloud/`) sub-folder _if_ and only _if_ Phase 3 has been funded. The single-bundle property is the architecture; do not relax it.

### 11.5 Risk #5 — Don't take funding before MVP parity

The temptation after this kind of competitive map is to raise a seed round and hire. Until Phase 1 (MVP parity) ships and the _first 50 paying users_ have signed up under the open-core model, fundraising is a _distraction_ — every dollar of funding raises expectations of growth curves that the current product surface cannot deliver. (See Path B exit criteria.)

### 11.6 Risk #6 — Don't fork the methodology story

We have already published `agile-state-of-the-art.md` as the methodology baseline. Any PR that weakens the link between `quill.md`'s file format and a recognized methodology (Scrum, Kanban, XP) is a brand-erasing move. Methodology-shape _is_ the moat; protect it.

### 11.7 Risk #7 — Don't make the Local-first mode "premium"

If the wizard greys out Local Mode behind a paywall, the entire moat collapses within a quarter and the project reverts to "another Trello in a trench coat". The hosted sync is the upgrade path; Local Mode stays free, always.

### 11.8 Risk #8 — Don't optimize for benchmark scores

A 2026 piece by Tech Insider cited Linear at 180 ms vs Jira at 1,200 ms for board-view load[^techinsider2026]. The numbers are _anecdotal_ (community-benchmarked), not ARIA-passing. We should not chase a "sub-100 ms" claim on the marketing page until we have measured it with real users on the seven browsers in our compatibility matrix. Speed is a _consequence_ of a small bundle, not a _target_.

---

## 12. Citations

Numbered footnotes. Each entry: claim — source — link — (where relevant) date of access.

[^mordor2026]: Project Management Software Systems Market was USD 9.76 B in 2025 → USD 23.09 B in 2031, CAGR 15.42 %. Hybrid deployment 18.12 % CAGR. SMEs 16.89 % CAGR. Healthcare 15.85 % CAGR. North America 36.12 % share; APAC 16.06 % CAGR. — Mordor Intelligence — <https://www.mordorintelligence.com/industry-reports/project-management-software-systems-market> — accessed 2026-06-28.

[^gvr2023]: Project Management Software Market: USD 6.59 B in 2022 → USD 20.47 B by 2030, CAGR 15.7 % (Grand View Research). — <https://www.grandviewresearch.com/industry-analysis/project-management-software-market-report> — accessed 2026-06-28.

[^skyquest2025]: Project Management Software Market: USD 8.98 B (2025) → USD 22.54 B (2033), CAGR 12.2 % (SkyQuest). — <https://www.skyquestt.com/report/project-management-software-market> — accessed 2026-06-28.

[^techinsider2026]: Linear vs Jira 2026 feature and pricing comparison; cites Linear sub-100ms UI, free tier 250 issues unlimited members, integration gap (50 native vs 6 000 Marketplace), Atlassian Intelligence vs Linear AI Triage, performance benchmarks. — Tech Insider — <https://tech-insider.org/linear-vs-jira-2026/> — accessed 2026-06-28. _Note: vendor-adjacent publication; treat quantitative claims as directional, not authoritative._

[^workflow2026trello]: Trello Review 2025 — features, pricing, pros and cons, power-ups, mobile, alternatives. — Workflow Automation — <https://workflowautomation.net/reviews/trello> — accessed 2026-06-28.

[^linearp]: Linear pricing page (Free / Basic $10 / Business $16 / Enterprise custom). Linear Agent in beta. Linear customer count > 33 000. — Linear — <https://linear.app/pricing> — accessed 2026-06-28.

[^atlassianjirapricing]: Atlassian Jira pricing page (Free / Standard $7.91 / Premium $14.54 / Enterprise custom). **End of sale of new Data Center licenses: 30 March 2026. End of life: 28 March 2029.** — Atlassian — <https://www.atlassian.com/software/jira/pricing> — accessed 2026-06-28.

[^atlassianjirafeatures]: Atlassian Jira features: AI (Rovo), cross-team planning, automation, dashboards, Atlassian Intelligence. — Atlassian — <https://www.atlassian.com/software/jira> — accessed 2026-06-28.

[^atlassianjirasecurity]: SOC 2, ISO 27001, ISO 27018, GDPR, HIPAA, FedRAMP. — Atlassian — referenced via tech-insider.org/linear-vs-jira-2026/ and atlassian.com/security — accessed 2026-06-28.

[^atlassiantrello]: Trello pricing 2025 (Free / Standard $5 / Premium $10 / Enterprise $17.50) — Atlassian Trello — <https://trello.com> — accessed 2026-06-28.

[^atlassianblogtrello]: "options, more Trello: revamped pricing and power-ups for all" — Atlassian Blog — <https://www.atlassian.com/blog/trello/revamped-pricing-and-power-up-news> — accessed 2026-06-28.

[^linearmethod]: Linear's "method" page — design philosophy, opinionated workflow, fastest UX. — Linear — <https://linear.app/method> — referenced via citation set in morgen.so/blog-posts/linear-project-management — accessed 2026-06-28.

[^lineardocs]: Linear docs — GraphQL API, GitHub / GitLab / Figma / Slack integrations, MCP server. — Linear — <https://linear.app/docs> — accessed 2026-06-28.

[^planeso]: Plane (formerly Makeplane) — open-source PM platform. Four products (Projects, Wiki, Plane AI, Desk coming). SOC 2 + ISO 27001 + GDPR + CCPA. MCP server. Plane Compose for projects-as-code. Migration from Jira/Linear/Asana/ClickUp/Monday. — Plane — <https://plane.so/> — accessed 2026-06-28.

[^planeoss2026]: "Top 6 open source project management tools in 2026" (OpenProject, Leantime, Taiga, Redmine, Focalboard). — Plane Blog — <https://plane.so/blog/top-6-open-source-project-management-software-in-2026> — accessed 2026-06-28.

[^planeblog2026]: "How We're Winning the Self-Hosted Project Management Category" (Plane on flexibility, transparency, true data ownership). — Plane Blog — <https://plane.so/blog/winning-self-hosted-project-management-category> — accessed 2026-06-28.

[^meetrix2026]: "Top 10 Open-Source JIRA Alternatives 2026" — Meetrix — <https://meetrix.io/blogs/top-10-jira-alternatives-2026/> — accessed 2026-06-28.

[^vpsus2026]: "Self-Hosted Jira Alternatives 2026" — VPS US — <https://vps.us/blog/self-hosted-jira-alternatives/> — accessed 2026-06-28.

[^redditselfhosted]: r/selfhosted — "What's the best self-hosted project management tool" — user consensus on Plane, OpenProject, Leantime, Taiga, YouTrack — <https://www.reddit.com/r/selfhosted/comments/1ei53hw/whats_the_best_self_hosted_project_management_tool/> — accessed 2026-06-28.

[^redditlinear]: r/Linear — "What is the point of Linear?"; cross-functional vs engineering-team satisfaction gap; 26 % cross-functional vs 83 % purely technical. — <https://www.reddit.com/r/Linear/comments/1lf0lwk/what_is_the_point_of_linear/> — accessed 2026-06-28.

[^pingcode2025]: "Jira and Confluence 发布2025年最新涨价通知" — cites 23 % Data Center price increase from 11 Feb 2025; cites annual twice-yearly pricing rounds since 2019; cites 5 %-20 % cloud increases — <https://m.sohu.com/a/860049010_120082794> — accessed 2026-06-28.

[^spkaa2025]: "What You Need to Know About the Atlassian Price Increases Coming October 2025" — Jira Cloud Standard +5 %, Premium +7.5 %, Enterprise +7.5-10 % — SPKAA — <https://www.spkaa.com/blog/what-you-need-to-know-about-the-atlassian-price-increases-coming-october-2025> — accessed 2026-06-28.

[^glintech2025]: "Atlassian Cloud Pricing Is Changing, Here's How to Prepare" — Jira +5-10 %, Confluence +5-10 %, JSM increases from 15 Oct 2025 — Glintech — <https://www.glintech.com/blog/atlassian-cloud-price-increase/> — accessed 2026-06-28.

[^corptec2025]: "Atlassian Jira Pricing Updates 2025 - Here's Your Action Plan!" — 5-20 % Cloud increase from 16 Oct 2024 — Corptec — <https://corptec.com.au/blog/atlassian/atlassian-jira-pricing-updates-2025-action-plan/> — accessed 2026-06-28.

[^accxia2025]: "Atlassian 2025 Cloud Price Increases – Can you Avoid?" — Accxia — <https://www.accxia.com/blog/atlassian-2025-cloud-price-increases-can-you-avoid> — accessed 2026-06-28.

[^revyz2025]: "Navigating Atlassian's Price Increase: A Strategy for Optimizing Your Spend" — Revyz — <https://www.revyz.io/blog/navigating-atlassians-price-increase-a-strategy-for-optimizing-your-spend> — accessed 2026-06-28.

[^deviniti2026]: "62 Atlassian Cloud migration ROI & cost stats for 2026" — Deviniti — <https://deviniti.com/blog/uncategorized/atlassian-cloud-migration-roi-cost-stats-for-2026/> — accessed 2026-06-28.

[^atlassian2025ux]: "Jira 2025 Changes - How User Experience has degraded..." — Atlassian Community — <https://community.atlassian.com/forums/Jira-Cloud-Admins-discussions/Jira-2025-Changes-How-User-Experience-has-degraded-Is-Atlassian/td-p/3194686> — accessed 2026-06-28.

[^atlpost]: "Post-incident review for September 2025 change to status button..." — Atlassian Community — <https://community.atlassian.com/forums/Jira-Cloud-Admins-articles/Post-incident-review-for-September-2025-change-to-status-button/ba-p/3131716> — accessed 2026-06-28.

[^atlassiandevx2025]: Atlassian "State of Developer Experience 2025" — 3 500 developer survey — <https://www.atlassian.com/teams/software-development/state-of-developer-experience-2025> — accessed 2026-06-28.

[^jetbrains2025]: "State of Developer Ecosystem 2025" — JetBrains — 24 534 developer survey — referenced via uxcode.net summary at <https://uxcode.net/276163.html> — accessed 2026-06-28.

[^stackoverflow2024]: Stack Overflow Developer Survey 2024 — referenced via researchgate and reddit summaries in the competitive context — <https://survey.stackoverflow.co/2024/> — accessed 2026-06-28.

[^coursera2025]: Coursera "9 Major Project Management Trends in 2026" — 54 % PMI respondents use GenAI in 16-50 % of projects; 82 % of executives expect AI to reinvent PM by 2029; HBR 65 % PM failure rate. — <https://www.coursera.org/articles/project-management-trends> — accessed 2026-06-28.

[^asanafeatures]: Asana — status updates, forms, multi-view, portfolio — <https://asana.com/features/project-management/status-updates> — accessed 2026-06-28.

[^zapierclickasana]: Zapier — ClickUp vs Asana, "everything app" positioning — <https://zapier.com/blog/clickup-vs-asana/> — accessed 2026-06-28.

[^mondaycomparison]: IV Consulting — Notion vs ClickUp vs Monday vs Asana comparison — <https://ivconsulting.in/blogs/notion-vs-clickup-vs-monday-vs-asana/> — accessed 2026-06-28.

[^clickupvsnotion2025]: taskrhino.ca — "Notion vs ClickUp vs Monday vs Asana AI features 2026" — <https://www.taskrhino.ca/blog/notion-vs-monday-com/> — accessed 2026-06-28.

[^githubissues]: GitHub Issues + GitHub Projects — native to the code repo, free for public repos — <https://github.com/features/issues> and <https://github.com/features/project-management> — accessed 2026-06-28.

[^zapierghproj]: ZenHub — "The Top Developer Experience Tools for GitHub-First Teams 2025" — measured "37 % fewer new capabilities per quarter" with proper GitHub integration — <https://www.zenhub.com/blog-posts/the-top-developer-experience-tools-for-github-first-teams-2025> — accessed 2026-06-28.

[^getalfred]: "Is Linear Worth It? Honest Review for Engineering Teams (2026)" — Alfred — <https://get-alfred.ai/blog/is-linear-worth-it> — accessed 2026-06-28.

[^onehorizon]: One Horizon "Mastering Linear: How to Optimize Your Team's Project Management Experience" — 150 000+ teams; 2024 Performance comparison "Linear 3.7× faster than Jira, 2.3× faster than Asana". — <https://onehorizon.ai/blog/linear-app-review> — accessed 2026-06-28.

[^morgenlinear]: Morgen "Linear Guide: Setup, Best Practices & Pro Tips" — Cycles vs Projects abstraction; Linear vs Jira vs Trello vs Asana feature matrix. — <https://www.morgen.so/blog-posts/linear-project-management> — accessed 2026-06-28.

[^cotera2025]: Cotera "We Outgrew GitHub Issues at 500 Tickets. Linear Was the Obvious Choice." — <https://cotera.co/articles/linear-vs-github-issues-comparison> — accessed 2026-06-28.

[^sg2020]: Schwaber & Sutherland (2020). _The Scrum Guide._ — referenced via companion note `docs/research/agile-state-of-the-art.md` §3 — accessed 2026-06-28.

[^kendomanager]: Kendomanager "Self-Hosted Project Management Software for Developers 2026" — data-sovereignty framing for OSS PM tools — <https://www.kendomanager.com/self-hosted-project-management-software-development/> — accessed 2026-06-28.

---

## 13. Change log

- **2026-06-28** — Initial version. Co-authored with companion note `docs/research/agile-state-of-the-art.md`. Mavis / research session.
- _Planned updates:_
  - After Phase 1 ships, refresh §5 row counts and re-rank §7 gaps.
  - After Phase 2 ships, refresh §9 with actual exit-criterion pass/fail.
  - Track §10 Path B's actual free→paid funnel once Phase 3 ships.
  - Re-baseline competitor pricing 1× every six months (the segment is the fastest-moving in SaaS).
