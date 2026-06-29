# State of the Art of Agile / Scrum — Research Note

> **Purpose.** Map the current state of the art of agile methodologies (with a focus on Scrum) and translate it into concrete guidance for `quill.md` so the app can grow into a tool that _guides teams by the standards of the methodology_ rather than just _stores issue files_.
>
> **Audience.** Maintainers and contributors of `quill.md` who want to reason about future product surface area against a clear methodological baseline.
>
> **Sources.** Primary source is the official _2020 Scrum Guide_ by Ken Schwaber & Jeff Sutherland[^sg2020]. Secondary sources are listed inline and consolidated at the end. Every claim that is not pure background knowledge is cited.
>
> **Author.** Mavis (research session, 2026-06-28).
>
> **Status.** Living document. The 2020 Scrum Guide is still the current canonical version of Scrum at the time of writing — there is no "2026 Scrum Guide"[^sg2020][^revisions].

---

## Table of Contents

1. [TL;DR](#1-tldr)
2. [What "state of the art" means here](#2-what-state-of-the-art-means-here)
3. [Scrum theory — the foundation](#3-scrum-theory--the-foundation)
4. [The Scrum Team](#4-the-scrum-team)
5. [The Scrum events](#5-the-scrum-events)
6. [The Scrum artifacts and their commitments](#6-the-scrum-artifacts-and-their-commitments)
7. [How everything links together — the analytical core](#7-how-everything-links-together--the-analytical-core)
8. [Adjacent landscape: Kanban, Scrumban, XP, Nexus, LeSS, SAFe](#8-adjacent-landscape-kanban-scrumban-xp-nexus-less-safe)
9. [Mapping Scrum concepts onto `quill.md` today](#9-mapping-scrum-concepts-onto-quillmd-today)
10. [Recommendations to make `quill.md` methodology-guided](#10-recommendations-to-make-quillmd-methodology-guided)
11. [Risk register: what to _not_ copy](#11-risk-register-what-to-not-copy)
12. [Citations](#12-citations)
13. [Change log](#13-change-log)

---

## 1. TL;DR

- **The canonical reference is the 2020 Scrum Guide**, co-authored by Schwaber & Sutherland. It defines Scrum as a _minimal_ framework built on empiricism and lean thinking, with **three pillars** (transparency, inspection, adaptation), **five values**, **three accountabilities** (PO, SM, Developers — not "roles"), **five events** (the Sprint contains four), and **three artifacts** (each with a binding commitment)[^sg2020].
- The 2020 update **softened prescriptive language** (dropped the Daily Scrum three questions, removed the "cancel Sprint" section, introduced Product Goal) so that Scrum can serve any complex domain, not only software[^sg2020][^top5].
- **Everything in Scrum is a loop inside a loop**: each event inspects one or more artifacts against its commitment, and the Sprint contains all four inspection events as a container for empirical learning[^sg2020].
- **`quill.md` is already ~60% aligned** with Scrum at the artifact level (it has a Product Backlog in spirit, statuses, a Kanban view, Gantt dependencies, a template-defined schema, integrity-hash-baked files). It is **missing the timeboxed cadence, Sprint Goal, Definition of Done, and explicit Sprint Backlog** that turn a backlog into a Scrum artifact.
- To become _methodology-guided_, the smallest high-leverage changes are: (a) introduce a Sprint entity with start/end dates and a Sprint Goal field, (b) bind a DoD to the project config, (c) promote the Kanban view to be a _Sprint_ Kanban by default with a backlog lane, (d) auto-suggest Sprint Planning content from the top of the backlog using INVEST heuristics[^invest], (e) expose burndown/velocity as a derived view from the Sprint Backlog history.

---

## 2. What "state of the art" means here

"State of the art" in agile is unusual because, unlike engineering disciplines, **the field is normatively defined by two authors and a 13-page document** rather than by a moving frontier of peer-reviewed research[^sg2020]. The Scrum Guide explicitly states that "the rules of Scrum guide their relationships and interactions" and that "Scrum exists only in its entirety"[^sg2020]. So the _literal_ state of the art for Scrum = the current Scrum Guide, which as of 2026-06-28 is the November 2020 edition[^revisions].

Adjacent methodologies (Kanban, Scrumban, XP, LeSS, Nexus, SAFe) are _not_ normative single-document frameworks — they each have a body of practice, conference circuits (e.g. ScanAgile, Agile Days)[^scanagile][^agiledays], and annual reports (e.g. _State of Agile_ by Digital.ai)[^soa17][^soa18]. Their state of the art is documented in those reports and in the primary books cited at the end.

For this note we hold three layers:

1. **Canonical Scrum** — the 2020 Guide and the supporting primary literature.
2. **Operational extensions** — Kanban, Scrumban, XP (the practices Scrum usually wraps around)[^mongodb][^wrike].
3. **Scaling frameworks** — Nexus, LeSS, SAFe (when one team is not enough)[^nexus][^less].

---

## 3. Scrum theory — the foundation

Scrum is built on **empiricism** (knowledge comes from experience, decisions are based on what is observed) and **lean thinking** (reduce waste, focus on the essentials). It uses an **iterative, incremental** approach to optimize predictability and control risk[^sg2020].

### 3.1 The three pillars

| Pillar       | What it means                                                                                                                                                                                 | How it shows up in practice                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Transparency | Significant aspects of the process and the work must be visible to those who perform and receive the work. Decisions are based on the perceived state of the three formal artifacts[^sg2020]. | Done Definition on every artifact; status radiators; no hidden work.                       |
| Inspection   | Artifacts and progress toward agreed goals are inspected frequently and diligently to detect undesirable variances[^sg2020].                                                                  | The five events (cadence).                                                                 |
| Adaptation   | If any aspect deviates outside acceptable limits, or the resulting product is unacceptable, the process or the material must be adjusted _as soon as possible_[^sg2020].                      | The output of each event is concrete changes to artifacts (or to the next event's inputs). |

The pillars are inseparable: "inspection without transparency is misleading and wasteful"; "inspection without adaptation is considered pointless"[^sg2020]. This is the diagnostic frame for any "is this team actually doing Scrum?" question.

### 3.2 The five values

The 2020 Guide lists **Commitment, Focus, Openness, Respect, Courage**[^sg2020]. They are _values_ in the Rokeach sense — they "give direction to the Scrum Team with regard to their work, actions, and behavior". Crucially, the Guide says the pillars "come to life" when values are _embodied_, not when they are posted on a wall[^sg2020]. This is the soft layer that explains why two teams running identical processes can have radically different outcomes.

> **Design implication for `quill.md`.** A methodology-guided tool cannot enforce values, but it can make values _visible_: a "definition of done that includes 'code reviewed by a peer'" makes Commitment concrete; a "blockers" badge on a card makes Openness frictionless; a Sprint Retro template makes Courage and Respect possible. The UI is where values land or die.

---

## 4. The Scrum Team

The 2020 Guide uses **"accountabilities"** rather than "roles" (a deliberate 2020 change) to stress that the three accountabilities are complementary, not job titles, and a single person can hold more than one[^top5][^sg2020]. The Scrum Team is **one Scrum Master, one Product Owner, and Developers** — cross-functional and self-managing, typically 10 or fewer people, focused on one objective (the Product Goal)[^sg2020].

| Accountability    | Core accountability (verbatim, abridged)                                                                                                                                                     | Scope of service                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Developers**    | Create a plan for the Sprint (the Sprint Backlog); instill quality by adhering to the Definition of Done; adapt the plan daily toward the Sprint Goal; hold each other accountable[^sg2020]. | The Sprint itself.                                                                                      |
| **Product Owner** | Maximize the value of the product; develop and explicitly communicate the Product Goal; create, clearly communicate, order, and keep transparent the Product Backlog[^sg2020].               | The Product Backlog (single source of work undertaken by the Scrum Team).                               |
| **Scrum Master**  | Establish Scrum as defined in the Guide; the team's effectiveness[^sg2020].                                                                                                                  | The Scrum Team, the Product Owner, and the organization — three concentric circles of service[^sg2020]. |

> **Note on the "Developers are accountable for the Sprint Plan" wording.** This was added in 2020. Before 2020 the _Scrum Master_ was listed as facilitating the Sprint Plan; the 2020 shift makes it explicit that **the people doing the work own the plan**[^top5][^sg2020].

The whole Scrum Team is **accountable for creating a valuable, useful Increment every Sprint**[^sg2020]. This is the "one team, one goal" idea — the 2020 Guide removed the "Development Team" sub-team concept explicitly to prevent "us vs them" dynamics between PO and Dev[^sg2020].

---

## 5. The Scrum events

The Sprint is the **container** for the other four events. Failing to run an event as prescribed results in "lost opportunities to inspect and adapt"[^sg2020].

| Event                    | Purpose (verbatim, abridged)                                                                                                                                                                   | Timebox (1-month Sprint) | Inspects                                     | Adapts / produces                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------- | ----------------------------------------------------------------- |
| **The Sprint**           | Container for the other four events; ideas are turned into value; fixed length of one month or less[^sg2020].                                                                                  | ≤ 1 calendar month       | All progress toward the Product Goal         | A consistent heartbeat; a "short project"[^sg2020].               |
| **Sprint Planning**      | Lays out the work for the Sprint; addresses (1) _Why is this Sprint valuable?_ → Sprint Goal; (2) _What can be done?_ → selected PBIs; (3) _How will it get done?_ → actionable plan[^sg2020]. | ≤ 8 hours                | Product Backlog, Product Goal, capacity, DoD | **Sprint Backlog** = Sprint Goal + selected PBIs + plan[^sg2020]. |
| **Daily Scrum**          | Inspect progress toward the Sprint Goal; adapt the Sprint Backlog; produces an actionable plan for the next day[^sg2020].                                                                      | 15 minutes               | Sprint Backlog, Sprint Goal                  | Updated Sprint Backlog for tomorrow[^sg2020].                     |
| **Sprint Review**        | Inspect the outcome of the Sprint and determine future adaptations; present results to stakeholders; discuss progress toward the Product Goal[^sg2020].                                        | ≤ 4 hours                | The Increment (output)                       | Adjusted Product Backlog[^sg2020].                                |
| **Sprint Retrospective** | Plan ways to increase quality and effectiveness; inspect individuals, interactions, processes, tools, DoD; identify most helpful changes[^sg2020].                                             | ≤ 3 hours                | The team's working agreement                 | Improvements added to the next Sprint Backlog[^sg2020].           |

> **Key 2020 change:** the three Daily Scrum questions ("What did I do yesterday? What will I do today? What impediments do I have?") were removed. The Guide now says the Developers "can select whatever structure and techniques they want, as long as their Daily Scrum focuses on progress toward the Sprint Goal and produces an actionable plan for the next day"[^sg2020][^top5]. This is the "less prescriptive, more minimal" ethos.

> **The Sprint _contains_ the events, not the other way around.** When a team "doesn't have time for a retrospective" they are skipping the _only_ inspect-and-adapt event for the team's own process. The Guide is unambiguous that this is a Scrum failure mode[^sg2020].

---

## 6. The Scrum artifacts and their commitments

This is the part most teams get wrong. **Each artifact has a _commitment_** — a binding promise that gives the artifact its transparency and its definition of "done for this artifact"[^sg2020][^top5]. The 2020 Guide formalized these commitments; in earlier versions they existed but were not explicitly attached to the artifact they bound[^top5].

| Artifact            | What it is (verbatim, abridged)                                                                                                                                                                                   | Commitment attached    | What the commitment does                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product Backlog** | An emergent, ordered list of what is needed to improve the product; the single source of work undertaken by the Scrum Team[^sg2020].                                                                              | **Product Goal**       | "A future state of the product which can serve as a target for the Scrum Team to plan against"[^sg2020].                                                       |
| **Sprint Backlog**  | Sprint Goal (why) + set of Product Backlog items selected for the Sprint (what) + actionable plan for delivering the Increment (how). It is a plan by and for the Developers; highly visible, real-time[^sg2020]. | **Sprint Goal**        | "The single objective for the Sprint … creates coherence and focus, encouraging the Scrum Team to work together rather than on separate initiatives"[^sg2020]. |
| **Increment**       | A concrete stepping stone toward the Product Goal; additive to all prior Increments; thoroughly verified; must be usable[^sg2020].                                                                                | **Definition of Done** | "A formal description of the state of the Increment when it meets the quality measures required for the product"[^sg2020].                                     |

The **Product Goal → Sprint Goal → DoD** chain is the spine of Scrum:

- If your Product Goal is fuzzy, every Sprint Goal becomes arbitrary.
- If your Sprint Goal is fuzzy, every Increment becomes arbitrary.
- If your DoD is fuzzy, "Done" means different things to different people, and Sprint Review becomes theatre[^dod].

### 6.1 The Definition of Done — the most under-implemented commitment

The Guide is unusually explicit here:

- "Work cannot be considered part of an Increment unless it meets the Definition of Done"[^sg2020].
- "If a Product Backlog item does not meet the Definition of Done, it cannot be released or even presented at the Sprint Review. Instead, it returns to the Product Backlog for future consideration"[^sg2020].
- "If the Definition of Done for an increment is part of the standards of the organization, all Scrum Teams must follow it as a minimum. If it is not an organizational standard, the Scrum Team must create a Definition of Done appropriate for the product"[^sg2020].

A practical DoD example for a software team: _code written, peer-reviewed, merged, deployed to staging, smoke-tested, and user-facing copy reviewed_. Anything weaker than that allows "Done" to leak WIP into the Sprint Review[^dod][^sg2020].

### 6.2 PBI quality — DEEP + INVEST

Backlog items must be _ready_ for selection in a Sprint Planning event. The community has converged on two complementary mnemonics:

- **DEEP**: _Detailed Appropriately, Estimated, Emergent, Prioritized_. Items near the top of the Product Backlog are more detailed and more accurately estimated; items near the bottom are epics that will be refined[^deep].
- **INVEST**: _Independent, Negotiable, Valuable, Estimable, Small, Testable_. Created by Bill Wake as a quality check for individual user stories[^invest][^investwiki].

The 2020 Guide "softened" the prescriptive language around PBI attributes ("Attributes often vary with the domain of work") but did _not_ drop the requirement that they be refined before being pulled into a Sprint[^sg2020].

---

## 7. How everything links together — the analytical core

This is the section the user asked for explicitly: how one element links to another following the state of the art.

### 7.1 The five-link chain (the simplest mental model)

```text
Product Goal  ──►  Product Backlog  ──►  Sprint Backlog  ──►  Increment  ──►  Product Goal
       ▲                                                                                  │
       └──────────────────── Sprint Review feeds new learning back ──────────────────────┘
```

Read left-to-right, this is the value stream: a future state (Goal) is decomposed into ordered work (Backlog), a slice is committed to (Sprint Backlog), the slice is built and verified (Increment), and the new state of the product updates the Goal. The Sprint Review is the moment this loop closes[^sg2020].

### 7.2 The four-link inspection loop (what teams actually run every Sprint)

```text
Sprint Planning ──► Daily Scrum ──► Sprint Review ──► Sprint Retrospective
       │                  │                │                       │
       ▼                  ▼                ▼                       ▼
   Sprint Backlog     Sprint Backlog   Product Backlog      Next Sprint Backlog
   (created)          (updated daily)  (adjusted)           (improvements added)
```

Each event inspects one artifact and adapts the next artifact in the chain. This is the "four formal events for inspection and adaptation within a containing event, the Sprint" the Guide refers to[^sg2020]. The Retrospective closes the loop on the _process_ (not the product); its improvements land in the _next_ Sprint Backlog[^sg2020].

### 7.3 The three-accountability braid

Each accountability touches the same artifacts but with different lenses:

| Accountability | Owns / authors                         | Inspects against                    | Is held accountable by                 |
| -------------- | -------------------------------------- | ----------------------------------- | -------------------------------------- |
| PO             | Product Goal, Product Backlog ordering | The Increment, stakeholder feedback | The organization, the market[^sg2020]  |
| Developers     | Sprint Goal, Sprint Backlog, Increment | The Product Goal, the DoD           | Each other (as professionals)[^sg2020] |
| Scrum Master   | The events themselves, the DoD         | The team's adoption of Scrum        | The team and the org[^sg2020]          |

This is what the 2020 Guide means by "no sub-teams or hierarchies" — the accountabilities overlap, not nest[^sg2020].

### 7.4 The cadence ↔ artifact ↔ commitment triangle

If you internalize one diagram from the Guide, internalize this one:

```text
              ┌─ Product Backlog ─── commitment: Product Goal ──┐
              │                                                  │
              ▼                                                  │
         Sprint Planning                                         │
              │                                                  │
              ▼                                                  │
              ┌─ Sprint Backlog ─── commitment: Sprint Goal ─────┤
              │                                                  │
              ▼                                                  │
        Daily Scrum (inspect/adjust)                             │
              │                                                  │
              ▼                                                  │
              ┌─ Increment ──── commitment: Definition of Done ──┘
              │
              ▼
         Sprint Review ─► adjusts Product Backlog
              │
              ▼
         Sprint Retrospective ─► adjusts next Sprint Backlog
```

The three commitments _are_ the acceptance criteria for their artifacts. A backlog item without a clear ordering is failing its Product Goal commitment; a Sprint Backlog without a Sprint Goal is failing its Sprint Goal commitment; an Increment presented at Review without meeting the DoD is failing its DoD commitment[^sg2020].

### 7.5 Why this is _minimal_ but not _trivial_

The Guide is at pains to say Scrum is "purposefully incomplete"[^sg2020]. It does not prescribe:

- How estimation is done (story points, ideal hours, no estimate — all valid).
- What engineering practices the team uses (TDD, pair programming, trunk-based dev).
- How the Product Backlog is _physically_ stored (spreadsheet, Jira, Markdown files in a Git repo).
- How many PBIs a Sprint contains.

What it _does_ prescribe is the loop above and the commitments that hold it together. **The state of the art is: keep the loop, choose your own practices.**[^sg2020]

---

## 8. Adjacent landscape: Kanban, Scrumban, XP, Nexus, LeSS, SAFe

Scrum is the most-used agile framework but not the only one[^soa17][^soa18]. The state of the art for _agile teams_ is usually a hybrid, and a methodology-guided tool should make that hybrid expressible.

| Framework                    | Origin / source                                      | Core idea                                                                               | When it beats / extends Scrum                                                              |
| ---------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Kanban**                   | Toyota Production System; David J. Anderson[^kanban] | Visualize work, limit WIP, manage flow. No prescribed roles or iterations[^atlassian].  | Continuous flow (ops, support); when Sprints feel artificial.                              |
| **Scrumban**                 | Corey Ladas (2008); community practice[^scrumban]    | Apply Kanban's WIP limits and flow metrics inside Scrum's cadence and roles[^wrike].    | Teams whose Sprints have become theatre; teams with mixed interrupt-driven + planned work. |
| **Extreme Programming (XP)** | Kent Beck (1999)[^mongodb]                           | Engineering practices: TDD, pair programming, CI, refactoring, simple design[^mongodb]. | Teams that need to harden the engineering practices Scrum is silent on.                    |
| **Nexus**                    | Ken Schwaber (Scrum.org) [^nexus]                    | A "Scrum of Scrums" — 3–9 Scrum Teams working on a single Product Backlog.              | When one team can't deliver a single Increment anymore (typically 9+ people).              |
| **LeSS**                     | Craig Larman, Bas Vodde[^less]                       | "Large-Scale Scrum" — up to 8 teams on one Product Backlog, one Sprint, one DoD.        | Multi-team product, prefer minimal scaling.                                                |
| **SAFe**                     | Dean Leffingwell[^safe]                              | Scaled Agile Framework — multiple levels, multiple backlogs, multiple cadences.         | Enterprise portfolios that need explicit alignment between strategy and execution.         |

> **State-of-the-art trend (2024–2026).** The 17th _State of Agile_ report notes ongoing diversification of agile beyond software and IT, into operations, marketing, HR, sales — the same shift the 2020 Scrum Guide made explicit[^soa17][^soa18]. The 2025 agile conference circuit (ScanAgile, Agile Days) reinforces that "Agile is no longer a niche IT tool — it has become a global management standard"[^scanagile][^agiledays]. For a tool like `quill.md`, this means: design for domain-agnostic methodology, not for software-specific workflows.

---

## 9. Mapping Scrum concepts onto `quill.md` today

This is the bridge from research to product. The mapping uses `quill.md`'s own ERS and code as the ground truth[^ers][^product][^status].

### 9.1 Coverage matrix (current state)

| Scrum concept                   | Where it lives in `quill.md` today                                                                                                                                                                            | Verdict                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Product Goal**                | Implicit in `config.json`'s project metadata; no first-class field.                                                                                                                                           | **Missing.** Should be a top-level frontmatter field on a single `.quill.md/product-goal.md` or on `config.json`.   |
| **Product Backlog**             | `.quill.md/issues/*.md` — the whole set of issue files is, in spirit, the Product Backlog. FR-7 filter bar orders/groups; default sort by `id` (insertion order) does _not_ equal business value order[^ers]. | **Partial.** The files exist; ordering by value does not.                                                           |
| **Product Backlog Item (PBI)**  | One `.md` file per issue, with frontmatter + sections. Templates define the schema (FR-2)[^ers].                                                                                                              | **Strong.** Already schema-driven.                                                                                  |
| **Backlog refinement**          | Implicit; templates expose fields/sections but there is no "ready for next Sprint" state.                                                                                                                     | **Missing.** Should be a `state: draft \| ready \| in_sprint \| done` machine on each PBI.                          |
| **Sprint**                      | Not represented.                                                                                                                                                                                              | **Missing.** No timeboxed cadence entity.                                                                           |
| **Sprint Goal**                 | Not represented.                                                                                                                                                                                              | **Missing.**                                                                                                        |
| **Sprint Backlog**              | Not represented as a separate artifact; everything is a flat set of issues.                                                                                                                                   | **Missing.**                                                                                                        |
| **Increment**                   | A file that meets the DoD is implicitly an Increment candidate.                                                                                                                                               | **Partial.**                                                                                                        |
| **Definition of Done**          | Not represented at the project level.                                                                                                                                                                         | **Missing.** This is a critical gap given the Guide's emphasis[^sg2020].                                            |
| **Product Owner**               | The user holding the repo (and editing `config.json`).                                                                                                                                                        | **Conceptual only.** Not represented in the data model.                                                             |
| **Scrum Master**                | Not represented.                                                                                                                                                                                              | **Out of scope** (a role, not data).                                                                                |
| **Developers**                  | The user(s) editing issues.                                                                                                                                                                                   | **Conceptual only.**                                                                                                |
| **Sprint Planning**             | Not represented.                                                                                                                                                                                              | **Missing.** A guided UI that proposes PBIs from the top of the Backlog would be ideal.                             |
| **Daily Scrum**                 | Not represented.                                                                                                                                                                                              | **Missing.** A "Today's focus" view that lists in-Sprint items by assignee + status is a 1-day MVP.                 |
| **Sprint Review**               | Not represented.                                                                                                                                                                                              | **Missing.** A "what was completed this Sprint" view (vs Increment / DoD) would close the loop.                     |
| **Sprint Retrospective**        | Not represented.                                                                                                                                                                                              | **Missing.** A retro template + persisted retro notes is a 1-day MVP.                                               |
| **Sprint Burndown / Velocity**  | Not represented.                                                                                                                                                                                              | **Missing.** Trivial to derive from `start_date` + `end_date` + `status` history.                                   |
| **Kanban view**                 | FR-6 view 2: columns from `config.statuses`, drag to update status[^ers].                                                                                                                                     | **Strong.** Already present, already standards-aligned.                                                             |
| **Gantt view**                  | FR-6 view 3: bars grouped by `issue_type`, dependency arrows for `blocks` / `depends_on` relations[^ers].                                                                                                     | **Strong.** Already present.                                                                                        |
| **List view**                   | FR-6 view 1: virtualized table, sortable by column[^ers].                                                                                                                                                     | **Strong.**                                                                                                         |
| **Filter bar**                  | FR-7: combines type, status, assignee, label, free text, date range[^ers].                                                                                                                                    | **Strong.** This is effectively an _ad-hoc_ Product Backlog filter — the same primitive Scrum teams need to refine. |
| **Cross-issue relations**       | FR-9: parent / child / blocks / depends_on / relates_to with cycle detection[^ers].                                                                                                                           | **Strong.** Already supports the dependency graph the Gantt view needs.                                             |
| **Schema (templates)**          | `.quill.md/templates/*.json` per project; four built-in templates (Epic, User Story, Task, Bug)[^product].                                                                                                    | **Strong.** Templates _are_ PBIs at the type level — exactly Scrum's intent.                                        |
| **Per-project workflow config** | `.quill.md/config.json` with statuses, labels, users, kanban, gantt[^ers].                                                                                                                                    | **Strong.**                                                                                                         |
| **Integrity hash**              | FR-15: SHA-256 over canonical form, tamper-warning banner[^ers].                                                                                                                                              | **Strong.** Has no Scrum analog but supports auditability — useful for retro and Definition of Done.                |

### 9.2 Architectural observations

1. **`quill.md` is already a Scrum-shaped _file format_.** Every PBI is a Markdown file; the Product Backlog is a directory; relations are first-class. The data model is closer to the Guide's intent than most commercial trackers (which store everything as opaque rows).
2. **What is missing is _time_ and _commitments_.** No entity has a start or end, no entity carries a Sprint Goal, no project carries a DoD. These three additions convert the file format from "issue repository" to "Scrum artifact store".
3. **The Kanban view is currently _universal_ — every status is a column.** A Scrum-aligned Kanban needs at least one _Backlog_ lane and (optionally) a _Sprint Goal_ banner. This is a 1-day change once Sprint is a first-class entity.
4. **The Gantt view already encodes dependency arrows for `blocks` and `depends_on`**[^ers]. This is the only built-in view that surfaces Scrum's `blocks` relation type. Worth promoting in the UI.
5. **The `integrity_hash` mechanism is a hidden superpower for retrospective.** "What changed in this Sprint's files since Review?" is a query a hash-aware tool can answer in O(N) where N is the Sprint Backlog size.

---

## 10. Recommendations to make `quill.md` methodology-guided

Ordered by _leverage per unit of implementation effort_. Each recommendation cites the Scrum concept it serves.

### 10.1 Quick wins (≤ 1 day each)

| #   | Recommendation                                                                                                                                                                                                                                                                                         | Scrum concept it serves                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 1   | Add `product_goal` as a first-class field on `config.json` (or in a dedicated `.quill.md/product-goal.md`). Render it on the home screen as a banner above the views.                                                                                                                                  | Product Goal[^sg2020]                                |
| 2   | Add a `definition_of_done` array to `config.json` — checklist of strings (e.g. `["peer reviewed", "merged to main", "deployed to staging", "smoke tested"]`). Render it in the editor as a sidebar checklist; an issue can only transition to a `done`-category status when all DoD items are checked. | Definition of Done[^sg2020][^dod]                    |
| 3   | Promote status colors to have a **mandatory `category`** field with values `todo \| doing \| done \| cancelled`[^ers]. The Kanban view uses category to derive column grouping and WIP-limit warnings (a Scrum-team-flavored Kanban).                                                                  | Kanban / Scrumban[^scrumban]                         |
| 4   | Add a `sprint_id` foreign key to the issue frontmatter. Render an optional **Sprint Goal banner** at the top of the Kanban view when one or more issues carry the same `sprint_id`.                                                                                                                    | Sprint Goal[^sg2020]                                 |
| 5   | Add a "What changed in this view?" affordance on the integrity-warning banner that lists the file diff summary — directly usable as retro input.                                                                                                                                                       | Sprint Retrospective (auditability enabler)[^sg2020] |
| 6   | Add an `estimate` field to the template schema (Fibonacci: 1, 2, 3, 5, 8, 13). Surface a total per Sprint in the Gantt view header.                                                                                                                                                                    | DEEP / INVEST — Estimable[^invest][^deep]            |

### 10.2 Medium work (1–3 days each)

| #   | Recommendation                                                                                                                                                                                                                                                                    | Scrum concept it serves              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 7   | Introduce a `Sprint` first-class entity: `.quill.md/sprints/<id>.md` with `start_date`, `end_date`, `goal`, `status` (`planned \| active \| completed`), and a list of issue IDs. Compute velocity from completed Sprints.                                                        | The Sprint[^sg2020]                  |
| 8   | Add a **Sprint Planning** guided UI: pick a Sprint, the system proposes the top N PBIs from the Product Backlog ordered by `priority` (a new frontmatter field) and respecting the average velocity of the last 3 Sprints. The user can add/remove before committing.             | Sprint Planning[^sg2020]             |
| 9   | Add a **Daily Scrum** view: today's in-Sprint items per assignee, blockers (issues with status `blocked` or with a `blocks` relation where the blocked issue is `in_progress`), and an at-risk indicator (items at risk of not meeting the Sprint Goal given remaining capacity). | Daily Scrum[^sg2020]                 |
| 10  | Add a **Sprint Review** view: show every Increment (issue that met the DoD during the Sprint), grouped by Epic, with the Sprint Goal as the header.                                                                                                                               | Sprint Review[^sg2020]               |
| 11  | Add a **Sprint Retrospective** view: a simple Mad / Sad / Glad or Start / Stop / Continue template (configurable per project), persisted as a `.quill.md/sprints/<id>/retro.md`. Top-voted items surface in the next Sprint Planning as defaults.                                 | Sprint Retrospective[^sg2020]        |
| 12  | Add a **burndown** chart derived from the Sprint Backlog: count of remaining PBIs per day vs. an ideal line. Use existing `updated_date` + `status` history.                                                                                                                      | Empirical process control[^sg2020]   |
| 13  | Improve the PBI schema with **INVEST hints**: surface a small badge if a PBI lacks `estimate`, lacks a `description` section, or has no acceptance criteria. Do not block save — these are advisory.                                                                              | INVEST quality[^invest][^investwiki] |
| 14  | Improve the filter bar to be the **Product Backlog refinement** surface: a "Ready for next Sprint" preset (`priority ∈ top 20%`, `estimate set`, `description filled`, `acceptance_criteria filled`).                                                                             | Backlog refinement[^deep][^sg2020]   |
| 15  | Surface a **WIP limit** per status column in the Kanban view (per `config.kanban.wip_limits`). When exceeded, the column header shows a warning and drag-into is blocked.                                                                                                         | Kanban — WIP limits[^kanban]         |

### 10.3 Strategic bets (week+ each)

| #   | Recommendation                                                                                                                                                                                                                                                                                                            | Scrum concept it serves                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 16  | **Multi-team support** via the Nexus pattern: a single `.quill.md/` shared across N teams, each team having its own Sprint cadence and PO/Developers split, with cross-team dependencies surfaced in a shared Gantt. Do _not_ replicate Jira's "project per team" model; keep the file format the single source of truth. | Nexus[^nexus]                                    |
| 17  | **Methodology selector** in the first-run wizard: "Plain issues", "Scrum", "Scrumban", "Kanban", "XP-flavored Scrum" — each seeds a different `config.json` template with the right statuses, DoD, and view defaults.                                                                                                     | Scrumban / hybrid practice[^scrumban]            |
| 18  | **AI-assisted backlog refinement** — given a PBI title and section, suggest missing acceptance criteria and a size estimate (well-scoped, _advisory only_; never auto-commit). This is a 2025-state-of-the-art practice emerging from the agile conference circuit[^scanagile][^agiledays].                               | Backlog refinement — AI augmentation[^scanagile] |
| 19  | **Process metrics dashboard** — a dedicated route showing cycle time, lead time, WIP age, throughput per Sprint, all derived from the existing files + `integrity_hash` history. Sourced from the same empirical pillars the Guide uses[^sg2020].                                                                         | Empiricism[^sg2020]                              |

### 10.4 The "methodology-guided" UX principle

The single design principle that ties all of the above together:

> **Every view should answer one of the five Scrum questions.**
>
> 1. _Where are we going?_ → Product Goal banner.
> 2. _What could we do next?_ → Product Backlog, refined.
> 3. _What are we doing this Sprint?_ → Sprint Backlog (Kanban with Sprint Goal banner).
> 4. _What is the Increment?_ → Sprint Review view + DoD check.
> 5. _How are we working?_ → Retrospective view + process metrics.

If a view cannot answer at least one of these questions directly, it is decorative.

---

## 11. Risk register: what to _not_ copy

A methodology-guided tool is one mistake away from becoming a methodology-_enforcing_ tool. The Guide is explicit that Scrum is a _minimal_ framework and that "various processes, techniques and methods can be employed within the framework"[^sg2020]. Avoid these traps:

- **Do not mandate timeboxed Sprints in the data model.** The Guide explicitly allows dropping or shortening them when complexity demands[^sg2020]. A team running continuous flow with Kanban should be able to use `quill.md` without faking a Sprint cadence.
- **Do not prescribe a single estimation unit.** Story points are common but ideal-hours, T-shirt sizes, and no-estimate are all valid[^mongodb]. Make `estimate` an optional field.
- **Do not hide status transitions behind a forced DoD.** The DoD is an _organizational or team_ standard[^sg2020]. A team without one should be able to define one per project, not be blocked by a global one.
- **Do not collapse Sprint Review into a "release" gate.** The Guide is explicit: "The Sprint Review should never be considered a gate to releasing value"[^sg2020]. Releasing is the organization's call.
- **Do not add ceremony for ceremony's sake.** The 2020 Guide removed the three Daily Scrum questions specifically because prescriptive structure was undermining empirical intent[^sg2020][^top5].

---

## 12. Citations

[^sg2020]: Schwaber, K. & Sutherland, J. (2020). _The Scrum Guide._ Scrum Guides. <https://scrumguides.org/scrum-guide.html> (canonical HTML version of the November 2020 edition; PDF mirror at <https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf>). Licensed under CC BY-SA 4.0.

[^revisions]: Scrum Guides — _Scrum Guide Revisions_ history page. <https://scrumguides.org/revisions.html>. Confirms the 2020 edition remains the current official version at the time of writing.

[^top5]: Mountain Goat Software — _Top 5 Changes in the 2020 Scrum Guide_ (Mike Cohn). <https://www.mountaingoatsoftware.com/blog/top-5-changes-in-the-2020-version-of-the-scrum-guide>. Documents (1) accountabilities replace roles, (2) no more "development team" sub-team, (3) no more "servant leader" wording, (4) Sprint Goal and Definition of Done now formally attached as commitments to artifacts, (5) no sub-teams.

[^dod]: Scrum.org — _Getting started with a Definition of Done (DoD)._ <https://www.scrum.org/resources/blog/getting-started-definition-done-dod>. Practical DoD patterns and the relationship between DoD and Acceptance Criteria.

[^invest]: Wake, B. — _INVEST for Good User Stories._ (Original article on the INVEST mnemonic.) Cross-referenced via the Agile Alliance glossary and Boost's walkthrough: <https://www.boost.co.nz/blog/2021/10/invest-criteria/> and <https://agilealliance.org/glossary/invest/>.

[^investwiki]: Wikipedia — _INVEST (mnemonic)._ <https://en.wikipedia.org/wiki/INVEST_(mnemonic)>. Confirms Bill Wake as the originator and the canonical six-letter expansion.

[^deep]: Roman Pichler — _DEEP: Detailed Appropriately, Estimated, Emergent, Prioritized_ (Product Backlog quality model). Discussed in <https://www.romanpichler.com/blog/deep-product-backlog/> (Roman Pichler's site) and surfaced in secondary sources such as <https://zhuanlan.zhihu.com/p/601755228>.

[^mongodb]: MongoDB — _What Is Agile? A Beginner's Guide._ <https://www.mongodb.com/resources/solutions/use-cases/agile-development>. Concise overview of Scrum, Kanban, XP, and Lean with original-practice references.

[^atlassian]: Atlassian — _Kanban vs Scrum._ <https://www.atlassian.com/agile/kanban/kanban-vs-scrum>. Used for the Kanban column-of-practices description.

[^kanban]: Anderson, D. J. — _Kanban: Successful Evolutionary Change for Your Technology Business._ (Sequential book series, 2010–2016.) Referenced via <https://kanbanbooks.com/> (Better with Kanban series landing page).

[^wrike]: Wrike — _Scrum vs. Kanban vs. Scrumban: What's the Difference?_ <https://www.wrike.com/project-management-guide/faq/kanban-vs-scrum-vs-scrumban-what-are-the-differences/>. Used for the Scrumban hybrid framing.

[^scrumban]: Ladas, C. (2008). _Scrumban._ (Originally articulated on the Modus Cooperandi blog and in subsequent essays.) The hybrid Kanban-inside-Scrum frame used in §8.

[^nexus]: Scrum.org — _The Nexus Guide._ <https://www.scrum.org/resources/nexus-guide>. Scaling framework for 3–9 Scrum Teams on one Product Backlog.

[^less]: Larman, C. & Vodde, B. — _Large-Scale Scrum (LeSS)._ <https://less.works/>. Up to 8 teams on one Product Backlog, one Sprint cadence.

[^safe]: Leffingwell, D. — _Scaled Agile Framework (SAFe)._ <https://scaledagileframework.com/>. Enterprise scaling framework.

[^soa17]: Digital.ai — _17th State of Agile Report._ <https://digital.ai/resource-center/analyst-reports/state-of-agile-report/> (landing page) and <https://2288549.fs1.hubspotusercontent-na1.net/hubfs/2288549/RE-SA-17th-Annual-State-Of-Agile-Report.pdf> (PDF mirror). Longest-running annual agile adoption survey.

[^soa18]: Rebel Scrum — _18th State of Agile Report._ <https://www.rebelscrum.site/post/18th-state-of-agile-report>. Summary of the 18th edition; corroborates Scrum's continued dominance and the spread into non-software domains.

[^scanagile]: ScanAgile 2025 — Conference home page. <https://www.scan-agile.org/>. Northern Europe's largest agile conference; cited as evidence for the current conference-level discourse on Scrum's evolution.

[^agiledays]: Agile Days 2025 — Conference description. <https://www.interfax.ru/events/5112>. Used to corroborate the "Agile as global management standard" framing for 2025–2026.

[^ers]: quill.md Engineering Requirements Specification (`docs/ers.md` in this repo). Source of truth for FR-1…FR-15, NFR-1…NFR-7, the data model, and the use cases cited throughout §9.

[^product]: quill.md Product overview (`PRODUCT.md` in this repo). Source of truth for the operating-mode description and the user-facing capability list.

[^status]: quill.md Current Project Status (`docs/current-project-status.md` in this repo). Source of truth for what is currently implemented and what the Step 7/8 carry-overs are.

---

## 13. Change log

| Date       | Version | Author | Change                                                                                                                          |
| ---------- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-28 | 0.1.0   | Mavis  | Initial research note. Primary source: 2020 Scrum Guide. Secondary: 12 cited sources. Mapping + recommendations for `quill.md`. |

---

> **Re-use note.** This document is offered to the project under the same CC BY-SA 4.0 terms as the Scrum Guide[^sg2020] for the cited definitions, and under the project's own license (see `LICENSE`) for the original analysis in §9–§11. If you fork or extend it, please add a row to §13 and re-run the verification chain (`pnpm check && pnpm lint && pnpm test`) before merging — there is no CI for docs but the contract is the same.
