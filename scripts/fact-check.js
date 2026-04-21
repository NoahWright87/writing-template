#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const DRAFTS_DIR = path.join(ROOT, 'drafts');
const SPECS_DIR = path.join(ROOT, 'specs');
const CITATIONS_FILE = path.join(ROOT, 'specs', 'research', 'citations.md');

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const REPORT_MODE = args.includes('--report');

// ── helpers ──────────────────────────────────────────────────────────────────

function walkMd(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkMd(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) results.push(full);
  }
  return results;
}

function extractTags(content, tagName) {
  const re = new RegExp(`::${tagName}\\[([^\\]]+)\\]`, 'g');
  const values = [];
  let m;
  while ((m = re.exec(content)) !== null) values.push(m[1].trim());
  return values;
}

function findSpecFile(id) {
  return walkMd(SPECS_DIR).find(
    f => path.basename(f) === `${id}.spec.md`
  );
}

function getSpecStatus(filePath) {
  try {
    const { data } = matter(fs.readFileSync(filePath, 'utf-8'));
    return data.status || 'unknown';
  } catch {
    return 'unknown';
  }
}

function loadCitationIds() {
  if (!fs.existsSync(CITATIONS_FILE)) return new Set();
  const content = fs.readFileSync(CITATIONS_FILE, 'utf-8');
  const ids = new Set();
  // Two supported citation ID formats in citations.md:
  //   ## citation-id          (level-2 heading)
  //   - **citation-id**       (bold list item)
  for (const m of content.matchAll(/^##\s+(\S+)/gm)) ids.add(m[1]);
  for (const m of content.matchAll(/^\s*[-*]\s+\*\*([^*]+)\*\*/gm)) ids.add(m[1].trim());
  return ids;
}

// ── scan ─────────────────────────────────────────────────────────────────────

const issues = {
  missingSpecs: [],
  unverifiedSpecs: [],
  missingCitations: [],
  openQuestions: [],
};

const draftFiles = walkMd(DRAFTS_DIR);
const citationIds = loadCitationIds();

for (const file of draftFiles) {
  const rel = path.relative(ROOT, file);
  const content = fs.readFileSync(file, 'utf-8');

  for (const id of extractTags(content, 'spec-ref')) {
    const specFile = findSpecFile(id);
    if (!specFile) {
      issues.missingSpecs.push({ file: rel, id });
    } else {
      const status = getSpecStatus(specFile);
      if (!['reviewed', 'verified'].includes(status)) {
        issues.unverifiedSpecs.push({ file: rel, id, status });
      }
    }
  }

  for (const id of extractTags(content, 'citation')) {
    if (!citationIds.has(id)) {
      issues.missingCitations.push({ file: rel, id });
    }
  }

  for (const text of extractTags(content, 'open-question')) {
    issues.openQuestions.push({ file: rel, text });
  }
}

// ── report ───────────────────────────────────────────────────────────────────

const hasErrors =
  issues.missingSpecs.length > 0 ||
  issues.unverifiedSpecs.length > 0 ||
  issues.missingCitations.length > 0;

const lines = [
  '# Fact-Check Report',
  '',
  `Scanned ${draftFiles.length} draft file(s) — ${new Date().toISOString().slice(0, 10)}.`,
  '',
];

if (!hasErrors && !issues.openQuestions.length) {
  lines.push('All checks passed. No issues found.');
} else {
  if (issues.missingSpecs.length) {
    lines.push('## Missing Specs', '');
    for (const { file, id } of issues.missingSpecs) {
      lines.push(`- \`${id}\` in \`${file}\` — spec file not found`);
    }
    lines.push('');
  }

  if (issues.unverifiedSpecs.length) {
    lines.push('## Unverified Specs', '');
    for (const { file, id, status } of issues.unverifiedSpecs) {
      lines.push(
        `- \`${id}\` in \`${file}\` — status is \`${status}\` (needs \`reviewed\` or \`verified\`)`
      );
    }
    lines.push('');
  }

  if (issues.missingCitations.length) {
    lines.push('## Missing Citations', '');
    for (const { file, id } of issues.missingCitations) {
      lines.push(`- \`${id}\` in \`${file}\` — not found in citations.md`);
    }
    lines.push('');
  }

  if (issues.openQuestions.length) {
    lines.push('## Open Questions', '');
    for (const { file, text } of issues.openQuestions) {
      lines.push(`- \`${file}\`: ${text}`);
    }
    lines.push('');
  }
}

const report = lines.join('\n') + '\n';

if (REPORT_MODE) {
  const outPath = path.join(ROOT, 'fact-check-report.md');
  fs.writeFileSync(outPath, report);
  console.log(`Report written to ${outPath}`);
} else {
  process.stdout.write(report);
}

if (STRICT && hasErrors) {
  process.exit(1);
}
