#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// ── Pure functions (exported for testing) ─────────────────────────────────────

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Apply ::tag[] custom extensions to an HTML string.
 * specMap maps spec IDs to site-root-relative HTML paths.
 * depth is the number of directory levels from the site root to the current file.
 */
function applyExtensions(html, specMap, depth) {
  const root = depth > 0 ? '../'.repeat(depth) : './';
  return html
    .replace(/::panel\[([^\]]+)\]/g, '<div class="panel">$1</div>')
    .replace(/::sidebar\[([^\]]+)\]/g, '<aside class="sidebar">$1</aside>')
    .replace(/::callout\[([^\]]+)\]/g, '<blockquote class="callout">$1</blockquote>')
    .replace(/::spec-ref\[([^\]]+)\]/g, (_, id) => {
      const href = specMap[id];
      const cls = href ? 'spec-ref' : 'spec-ref missing';
      const target = href ? `${root}${href}` : '#';
      return `<a class="${cls}" href="${target}" title="${escHtml(href ? `Spec: ${id}` : `Missing spec: ${id}`)}">[${escHtml(id)}]</a>`;
    })
    .replace(/::citation\[([^\]]+)\]/g, (_, id) =>
      `<a class="citation" href="${root}specs/research/citations.html#${escHtml(id)}" title="Citation: ${escHtml(id)}">[${escHtml(id)}]</a>`
    )
    .replace(/::open-question\[([^\]]+)\]/g, (_, text) =>
      `<span class="open-question" title="Open question">❓ ${escHtml(text)}</span>`
    );
}

/**
 * Wrap body HTML in a full HTML page shell.
 * depth controls how many ../ levels the stylesheet link needs.
 */
function htmlPage(title, bodyHtml, depth) {
  const root = depth > 0 ? '../'.repeat(depth) : './';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)}</title>
  <link rel="stylesheet" href="${root}style.css">
</head>
<body>
  <nav><a href="${root}index.html">← Home</a></nav>
  <main>${bodyHtml}</main>
</body>
</html>`;
}

const CSS = `
*, *::before, *::after { box-sizing: border-box; }

body {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 18px;
  line-height: 1.75;
  color: #1a1a1a;
  background: #fafaf8;
  margin: 0;
  padding: 2rem 1rem;
}

nav {
  max-width: 720px;
  margin: 0 auto 1.5rem;
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
}

main { max-width: 720px; margin: 0 auto; }

h1, h2, h3, h4 { font-family: system-ui, sans-serif; line-height: 1.2; }
a { color: #2563eb; }
code { font-size: 0.875em; background: #f0f0ea; padding: 0.1em 0.3em; border-radius: 3px; }
pre { background: #f0f0ea; padding: 1rem; overflow-x: auto; border-radius: 4px; }
pre code { background: none; padding: 0; }

.panel {
  background: #e8f0fe;
  border: 1px solid #c7d7fb;
  border-radius: 6px;
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
  font-family: system-ui, sans-serif;
  font-size: 0.95rem;
  font-style: italic;
}
.panel::before { content: "Panel: "; font-weight: 700; font-style: normal; }

.sidebar {
  background: #f0f4f8;
  border-left: 4px solid #2563eb;
  padding: 0.75rem 1rem;
  margin: 1.5rem 0;
  font-size: 0.95rem;
}

.callout {
  background: #fff8e1;
  border-left: 4px solid #f59e0b;
  margin: 1.5rem 0;
  padding: 0.75rem 1rem;
  font-style: italic;
}

.spec-ref, .citation {
  font-family: monospace;
  font-size: 0.78em;
  vertical-align: super;
  text-decoration: none;
  color: #7c3aed;
}
.spec-ref.missing { color: #dc2626; text-decoration: line-through; }

.open-question { color: #d97706; font-size: 0.9em; font-family: system-ui, sans-serif; }
`.trim();

// ── File-system helpers (internal) ────────────────────────────────────────────

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

/** Build a map of spec ID → site-root-relative HTML path. */
function buildSpecMap(specsDir) {
  const map = {};
  for (const file of walkMd(specsDir)) {
    const base = path.basename(file, '.md');
    if (base.endsWith('.spec')) {
      const id = base.slice(0, -5);
      const rel = path.relative(specsDir, file);
      map[id] = 'specs/' + rel.replace(/\.md$/, '.html').replace(/\\/g, '/');
    }
  }
  return map;
}

// ── CLI entry point ───────────────────────────────────────────────────────────

function main() {
  const ROOT = path.resolve(__dirname, '..');
  const SITE_DIR = path.join(ROOT, 'dist', 'site');

  fs.mkdirSync(SITE_DIR, { recursive: true });
  fs.writeFileSync(path.join(SITE_DIR, 'style.css'), CSS);

  const specMap = buildSpecMap(path.join(ROOT, 'specs'));
  const indexLinks = [];
  let processed = 0;

  for (const srcDir of ['drafts', 'outline', 'specs']) {
    const srcPath = path.join(ROOT, srcDir);

    for (const file of walkMd(srcPath)) {
      const rel = path.relative(srcPath, file);
      const outRel = path.join(srcDir, rel.replace(/\.md$/, '.html'));
      const outPath = path.join(SITE_DIR, outRel);

      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      const raw = fs.readFileSync(file, 'utf-8');
      const { data: fm, content } = matter(raw);
      const title = fm.title || path.basename(file, '.md');

      const depth = outRel.split(path.sep).length - 1;
      let html = marked.parse(content);
      html = applyExtensions(html, specMap, depth);

      fs.writeFileSync(outPath, htmlPage(title, html, depth));
      indexLinks.push({ title, href: outRel.replace(/\\/g, '/') });
      processed++;
    }
  }

  const listItems = indexLinks
    .map(({ title, href }) => `  <li><a href="${href}">${escHtml(title)}</a></li>`)
    .join('\n');

  fs.writeFileSync(
    path.join(SITE_DIR, 'index.html'),
    htmlPage('Book Publishing Repo', `<h1>Book Publishing Repo</h1>\n<ul>\n${listItems}\n</ul>`, 0)
  );

  console.log(`Site built: ${processed} page(s) → dist/site/`);
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = { applyExtensions, htmlPage, escHtml, CSS };

if (require.main === module) main();
