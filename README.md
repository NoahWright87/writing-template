# Book Publishing Template

A markdown-based book publishing repo with a fact-checking pipeline, static site builder, and print/screen PDF builder.

## Quick start

```bash
npm install
npm run fact-check      # validate spec refs and citations in drafts/
npm run build:site      # markdown → dist/site/
npm run build:pdf       # markdown → dist/pdf/book-screen.pdf
npm run build:pdf:print # markdown → dist/pdf/book-print.pdf  (6×9 KDP/IngramSpark)
npm run build           # fact-check + site + PDF in one shot
```

## Repo structure

```
├── BIBLE.md                    ← Project vision, tone, canonical elements (fill this in)
├── AGENTS.md                   ← Agent instructions, project-specific rules (fill this in)
├── instructions.md             ← Full template guide and philosophy
├── specs/
│   ├── _template.spec.md       ← Copy this to create a new spec
│   ├── concepts/
│   ├── characters/
│   ├── mechanisms/
│   └── research/
│       ├── citations.md        ← Master citation registry
│       └── interviews/
├── outline/
│   ├── series-overview.md
│   └── entries/
├── drafts/                     ← Generated content (downstream of specs + outline)
├── assets/
│   ├── illustrations/
│   └── reference/
└── scripts/
    ├── fact-check.js           ← Validates ::spec-ref and ::citation tags in drafts/
    ├── build-site.js           ← Markdown → static HTML site
    └── build-pdf.js            ← Markdown → PDF via Puppeteer
```

## Custom markdown extensions

Used in draft files; parsed by the build scripts and ignored by standard renderers.

```
::panel[Visual panel or comic beat description]
::sidebar[Content that appears alongside the main text]
::callout[Pull quote or key takeaway]

::spec-ref[spec-id]           Links a claim to its spec file
::citation[citation-id]       Links a claim to the citations registry
::open-question[text]         Flags an unresolved question (suppressed in PDF output)
```

## Fact-check flags

```
node scripts/fact-check.js            # warn mode (default)
node scripts/fact-check.js --strict   # exit 1 if any errors found
node scripts/fact-check.js --report   # write fact-check-report.md instead of stdout
```

## Forking this template

See `instructions.md` Section 9 for the full forking guide. In short:

1. Fill in `BIBLE.md` with project vision, tone, and canonical elements
2. Fill in `AGENTS.md` with project-specific agent instructions
3. Create specs in `specs/concepts/`, `specs/characters/`, `specs/mechanisms/`
4. Build `specs/research/citations.md` as specs are populated
5. Add content to `outline/entries/` and `drafts/`
