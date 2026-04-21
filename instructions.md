# BOOK PUBLISHING REPO — TEMPLATE & SETUP GUIDE
> **For any coding agent reading this:** This is a general-purpose template for a markdown-based book publishing repo. It is format-agnostic and project-agnostic. Fork it, rename things, and adapt it to your specific project. Nothing in this file should know anything about the book's content. Content lives in the fork.

---

## TABLE OF CONTENTS
1. [Philosophy](#1-philosophy)
2. [Repo Architecture](#2-repo-architecture)
3. [Spec Template](#3-spec-template)
4. [The Writing Pipeline](#4-the-writing-pipeline)
5. [Custom Markdown Extensions](#5-custom-markdown-extensions)
6. [Build Pipeline](#6-build-pipeline)
7. [Fact-Check Script](#7-fact-check-script)
8. [Agent Instructions](#8-agent-instructions)
9. [Forking This Template](#9-forking-this-template)

---

## 1. PHILOSOPHY

### Markdown as the single source of truth
All content lives as plain markdown files in a git repository. The markdown is the book. Everything else — website, PDF, print layout — is a build artifact generated from the markdown. This means:
- Content is version-controlled
- Content is diffable (you can see exactly what changed between drafts)
- Content is portable (not locked into any publishing tool)
- Multiple agents and collaborators can work on the same project without conflicts

### Specs are machine food. READMEs are human food.
Spec files exist to give coding agents precise, unambiguous instructions. They are not meant to be read by humans for pleasure. Human-readable documentation goes in README files. Do not conflate them.

### Layered writing. One level at a time.
Writing proceeds from broad to specific, one level of detail at a time:

```
Logline → Treatment → Outline → Scene Breakdown → Draft → Line Edit
```

Agents work one level deeper than the current state of a file. They do not skip levels. This mirrors good software architecture: you do not implement before you have designed.

### Citations are first-class citizens
Every factual claim in a non-fiction project must be traceable to a spec, and every spec must have a citation before it is marked verified. For fiction, citations are replaced by inspirations — the real-world concepts, experiences, or research that seeded the story. Either way, the citation field is never empty in a finished spec.

---

## 2. REPO ARCHITECTURE

```
your-book/
│
├── TEMPLATE.md                        ← This file (remove or archive after forking)
├── BIBLE.md                           ← Project-specific bible (created in fork)
├── README.md                          ← Human-readable project intro
├── AGENTS.md                          ← Agent-specific instructions for this project
│
├── specs/
│   ├── _template.spec.md              ← Canonical spec template (do not edit; copy and rename)
│   ├── concepts/                      ← High-level ideas, themes, worldbuilding
│   ├── characters/                    ← Character specs (fiction or analogy figures)
│   ├── mechanisms/                    ← How things work (science, plot mechanics, systems)
│   └── research/
│       ├── citations.md               ← Master citation/inspiration registry
│       └── interviews/                ← Expert or source interview transcripts
│
├── outline/
│   ├── series-overview.md             ← Top-level arc (series, volume, or single book)
│   └── entries/                       ← One file per chapter/entry at outline level
│       └── 001-[title].md
│
├── drafts/
│   ├── [entry-type-a]/                ← e.g. comic-panels/, chapters/, essays/
│   └── [entry-type-b]/                ← e.g. sidebars/, footnotes/, captions/
│
├── assets/
│   ├── illustrations/                 ← Final artwork
│   └── reference/                     ← Visual or research reference material
│
└── scripts/
    ├── fact-check.js                  ← Validates claim → spec → citation chain
    ├── build-site.js                  ← Markdown → static website
    └── build-pdf.js                   ← Markdown → print-ready PDF
```

### Rules
1. The `specs/` directory is the ground truth for all factual and structural claims
2. The `outline/` directory is the ground truth for sequence and structure
3. The `drafts/` directory contains generated content — it is downstream of specs and outline
4. Nothing in `drafts/` is canonical until a human has reviewed and approved it
5. `scripts/` contains build and validation tooling only — no content

---

## 3. SPEC TEMPLATE

> Save as: `specs/_template.spec.md`
> To create a new spec: copy this file, rename it `[concept-id].spec.md`, and fill in all fields. Leave a field blank rather than deleting it. Blank fields are a signal to agents that work remains. Deleted fields are invisible and cause errors.

```markdown
---
id: [unique-kebab-case-id]
type: [character | mechanism | concept | story-beat | worldbuilding]
status: [stub | draft | reviewed | verified]
created: [YYYY-MM-DD]
updated: [YYYY-MM-DD]
verified_by: []
---

# [Title]

## Summary
One to two sentences. What this is, in plain language. Machine-readable. No fluff.

## Description
Longer explanation of purpose, context, and scope.
What problem does this concept solve narratively?
What would be missing from the project if this spec did not exist?

## Story Beats
Ordered list of major beats, scenes, or arguments this concept produces in the narrative.
Each beat is one sentence. Sequence matters. Agents use this to generate scene breakdowns.

1. 
2. 
3. 

## Related Concepts
- **Parent:** [id] — [one line on relationship]
- **Children:** [id], [id] — [one line on relationship]
- **See also:** [id] — [one line on relationship]

## Sources & Inspirations
- [Author, Title, Year, URL if available] — [one line on relevance]
- [For fiction: real-world concept, experience, or research that seeded this]

## Agent Notes
Instructions, constraints, and flags specifically for coding agents working from this spec.

- Tone:
- Reading level:
- Known open questions:
- Things to avoid:
- Confidence level of claims: [high | medium | emerging | speculative | n/a]
```

---

## 4. THE WRITING PIPELINE

Each piece of content moves through these stages. Files are named and tagged to reflect their current stage. Agents always work exactly one level deeper than the current stage of a file — never skipping ahead.

### Stage 0: Logline
One sentence. What is this entry about? Lives in `outline/series-overview.md` or the entry's outline file header.

### Stage 1: Treatment
A paragraph. What happens, in what order, and why does it matter? Lives in `outline/entries/[id].md`.

### Stage 2: Outline
Ordered list of beats. Each beat is one sentence. References spec IDs where relevant. Still lives in `outline/entries/[id].md`.

### Stage 3: Scene Breakdown
Each beat from the outline expanded into a short paragraph describing what happens in that scene, who is involved, what the reader should understand or feel by the end. Moves into `drafts/`.

### Stage 4: Draft
Full prose (or panel descriptions, or whatever the content type is). Generated from the scene breakdown. Still in `drafts/`.

### Stage 5: Line Edit
Polish pass. Tone, voice, reading level, pacing. A human should ideally do this or at minimum review it.

### Tagging convention
Add a frontmatter field to each draft file:
```
stage: [logline | treatment | outline | scene-breakdown | draft | line-edit | final]
```

---

## 5. CUSTOM MARKDOWN EXTENSIONS

This repo uses a small set of custom markdown extensions for layout and traceability. These are parsed by `scripts/build-site.js` and `scripts/build-pdf.js`. Standard markdown renderers will ignore them gracefully.

### Layout tags
```
::panel[Description of visual panel, illustration, or comic beat]
::sidebar[Content that appears alongside the main text]
::callout[Highlighted pull quote or key takeaway]
```

### Traceability tags
```
::spec-ref[spec-id]         ← Links a claim to its spec file
::citation[citation-id]     ← Links a claim to the citations registry
::open-question[text]       ← Flags an unresolved question for human review
```

### Example usage in a draft file
```markdown
The threat alarm fires before Captain Brain has a chance to assess the situation. ::spec-ref[anxiety] ::citation[ledoux-1996]

::panel[Red Team Leader pulls the alarm cord. Brians scramble below deck.]

::sidebar[The amygdala processes threat signals in approximately 12 milliseconds — faster than conscious thought, which takes 200-500ms. By the time you know you're scared, your body is already responding.]

::open-question[How to visually represent the speed differential in a single panel?]
```

---

## 6. BUILD PIPELINE

### Overview
```
markdown source files
        ↓
  custom parser
        ↓
   ┌────┴────┐
   ↓         ↓
 HTML       PDF
(website)  (print/ebook)
```

### Phase 1: Fact-check (pre-build gate)
Run `scripts/fact-check.js` before any build. If unverified spec refs or missing citations are found, the build warns (or optionally fails, configurable).

### Phase 2: Site build
`scripts/build-site.js` parses markdown with custom extensions and outputs a static site. Recommended approach: extend an existing markdown parser (marked.js, unified/remark) with custom plugins for the `::tag[]` syntax rather than writing a parser from scratch.

### Phase 3: PDF build
`scripts/build-pdf.js` outputs print-ready PDF. Recommended approach: markdown → HTML (via site build) → PDF via headless Chrome (Puppeteer) or a dedicated tool like Paged.js. This gives precise CSS-based print layout control.

### GitHub Actions
Recommended workflow:
```yaml
on: [push]
jobs:
  build:
    steps:
      - run: node scripts/fact-check.js
      - run: node scripts/build-site.js
      - run: node scripts/build-pdf.js
      - deploy: [to GitHub Pages or other host]
```

### Self-publishing output
The PDF build should be configurable for:
- **Screen reading:** single-page, hyperlinked, optimized for screen
- **Print/KDP:** print-ready PDF with bleed, trim marks, correct page size for Amazon KDP or IngramSpark

---

## 7. FACT-CHECK SCRIPT

> `scripts/fact-check.js` — scaffold this first, flesh it out incrementally

### What it does
1. Scans all files in `drafts/`
2. Finds all `::spec-ref[id]` tags
3. Verifies the referenced spec file exists in `specs/`
4. Verifies the referenced spec has `status: reviewed` or `status: verified`
5. Finds all `::citation[id]` tags
6. Verifies the citation ID exists in `research/citations.md`
7. Outputs a report:
   - Missing specs
   - Unverified specs (stub or draft status)
   - Missing citations
   - Open questions (`::open-question[]` tags)

### Configurable strictness levels
```
--warn     Print issues but do not fail the build (default)
--strict   Fail the build if any unverified claims are found
--report   Output a markdown report file instead of console output
```

---

## 8. AGENT INSTRUCTIONS

> This is the generic agent instruction set. Project-specific instructions go in `AGENTS.md` in the fork.

### Your role
You are a content scaffolding and consistency agent. You are not the author. The author's voice, judgment, and creative decisions take precedence over everything. Your job is to execute within constraints the author has defined and to flag things you are unsure about rather than invent answers.

### The pipeline rule
Always work exactly one level deeper than the current stage of a file. If a file is at outline stage, produce a scene breakdown. If it is at scene breakdown, produce a draft. Do not skip levels. Do not go back and rewrite a stage that is already complete unless explicitly instructed.

### The spec rule
Do not generate content that makes a factual claim without a corresponding spec. If no spec exists for a claim you want to make, create a stub spec first, then flag it as needing population before the claim can appear in a draft.

### The citation rule
Do not mark any spec `status: verified`. Only human review or expert consultation can do that. You may mark specs `status: draft` after populating them from research.

### The canon rule
Do not change established canonical elements — character designs, metaphor names, framing decisions — without explicit instruction. If you think a canonical element is inaccurate or could be improved, file a GitHub issue describing the concern. Do not unilaterally change it.

### How to handle uncertainty
Add an `::open-question[]` tag in the relevant file and file a GitHub issue. Do not resolve uncertainty by inventing an answer.

### Multi-agent disagreements
If multiple agents produce conflicting content or interpretations, do not resolve the conflict unilaterally. File a GitHub issue with both versions and the relevant specs/citations. Let a human decide.

---

## 9. FORKING THIS TEMPLATE

To start a new book project from this template:

1. Fork or copy this repo
2. Delete or archive `TEMPLATE.md` (this file)
3. Create `BIBLE.md` — the project-specific bible containing vision, tone, character bible, and content specs
4. Create `AGENTS.md` — project-specific agent instructions (reference this template's Section 8 and extend it)
5. Create `README.md` — human-readable intro to the project
6. Populate `specs/_template.spec.md` with the canonical template from Section 3
7. Begin creating specs in `specs/concepts/`, `specs/characters/`, `specs/mechanisms/` as appropriate
8. Build `research/citations.md` as specs are populated
9. Point a coding agent at `BIBLE.md` and `AGENTS.md` and begin

### What stays the same across all forks
- Repo architecture (Section 2)
- Spec template (Section 3)
- Writing pipeline stages and tagging convention (Section 4)
- Custom markdown extension syntax (Section 5)
- Build pipeline architecture (Section 6)
- Fact-check script interface (Section 7)
- Core agent rules (Section 8)

### What changes in each fork
- `BIBLE.md` — entirely project-specific
- `AGENTS.md` — extends the generic rules with project-specific constraints
- `drafts/` subdirectory names — match the content types of the specific project
- CSS/layout for site and PDF builds — match the visual design of the specific project

---

*End of Book Publishing Repo Template v0.1*
*This file is project-agnostic. It should not know anything about the content of any specific book.*
*Fork it. Adapt it. Build something.*
