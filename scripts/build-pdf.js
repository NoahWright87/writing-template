#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

// ── Pure functions (exported for testing) ─────────────────────────────────────

/**
 * Apply ::tag[] extensions to an HTML string for PDF output.
 * ::open-question tags are suppressed (not appropriate in final print).
 * Spec-refs and citations become plain superscript annotations (no links).
 */
function applyExtensions(html) {
  return html
    .replace(/::panel\[([^\]]+)\]/g, '<div class="panel">$1</div>')
    .replace(/::sidebar\[([^\]]+)\]/g, '<aside class="sidebar">$1</aside>')
    .replace(/::callout\[([^\]]+)\]/g, '<blockquote class="callout">$1</blockquote>')
    .replace(/::spec-ref\[([^\]]+)\]/g, (_, id) => `<sup class="spec-ref">[${id}]</sup>`)
    .replace(/::citation\[([^\]]+)\]/g, (_, id) => `<sup class="citation">[${id}]</sup>`)
    .replace(/::open-question\[[^\]]+\]/g, '');
}

/**
 * Build a complete HTML document string from pre-rendered chapter HTML.
 * printMode=true targets KDP/IngramSpark 6×9 in with mirrored gutters.
 * printMode=false targets A4 screen reading.
 */
function buildHtml(chaptersHtml, printMode) {
  const pageRule = printMode
    ? `@page { size: 6in 9in; margin: 0.75in; }
       @page :left  { margin-left: 0.875in; margin-right: 0.75in; }
       @page :right { margin-left: 0.75in;  margin-right: 0.875in; }`
    : `@page { size: A4; margin: 2.5cm; }`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    ${pageRule}

    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: Georgia, "Times New Roman", serif;
      font-size: ${printMode ? '11pt' : '12pt'};
      line-height: 1.6;
      color: #000;
      margin: 0;
      padding: 0;
      orphans: 3;
      widows: 3;
    }

    h1, h2, h3, h4 { font-family: system-ui, sans-serif; line-height: 1.25; page-break-after: avoid; }
    p { margin: 0 0 0.75em; }

    .chapter { page-break-before: always; }
    .chapter:first-child { page-break-before: avoid; }

    .panel {
      border: 1px solid #999;
      padding: 0.5em 0.75em;
      margin: 1em 0;
      font-style: italic;
      font-size: 0.95em;
    }
    .panel::before { content: "Panel: "; font-weight: bold; font-style: normal; }

    .sidebar { border-left: 2pt solid #555; padding: 0.4em 0.75em; margin: 1em 0; font-size: 0.9em; }
    .callout { border-left: 2pt solid #888; padding: 0.4em 0.75em; margin: 1em 0; font-style: italic; }

    .spec-ref, .citation { font-family: monospace; font-size: 0.75em; color: #555; }

    code { font-size: 0.875em; background: #f5f5f5; padding: 0.1em 0.25em; }
    pre { background: #f5f5f5; padding: 0.75em; page-break-inside: avoid; }
    pre code { background: none; padding: 0; }
  </style>
</head>
<body>
${chaptersHtml}
</body>
</html>`;
}

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

// ── CLI entry point ───────────────────────────────────────────────────────────

async function main() {
  const ROOT = path.resolve(__dirname, '..');
  const PDF_DIR = path.join(ROOT, 'dist', 'pdf');

  const args = process.argv.slice(2);
  const PRINT_MODE = args.includes('--print');

  fs.mkdirSync(PDF_DIR, { recursive: true });

  const draftFiles = walkMd(path.join(ROOT, 'drafts')).sort();

  if (draftFiles.length === 0) {
    console.log('No draft files found in drafts/ — nothing to build.');
    return;
  }

  const chaptersHtml = draftFiles.map(file => {
    const { data: fm, content } = matter(fs.readFileSync(file, 'utf-8'));
    const title = fm.title || path.basename(file, '.md');
    let html = marked.parse(content);
    html = applyExtensions(html);
    return `<section class="chapter" aria-label="${title}">\n${html}\n</section>`;
  }).join('\n');

  const fullHtml = buildHtml(chaptersHtml, PRINT_MODE);

  const tmpPath = path.join(PDF_DIR, '_tmp.html');
  fs.writeFileSync(tmpPath, fullHtml);

  const outName = PRINT_MODE ? 'book-print.pdf' : 'book-screen.pdf';
  const outPath = path.join(PDF_DIR, outName);

  // PUPPETEER_EXECUTABLE_PATH lets CI supply system Chrome.
  // Locally, if unset, Puppeteer uses its bundled Chromium.
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`file://${tmpPath}`, { waitUntil: 'networkidle0' });

    const pdfOptions = { path: outPath, printBackground: true };
    if (PRINT_MODE) {
      pdfOptions.width = '6in';
      pdfOptions.height = '9in';
    } else {
      pdfOptions.format = 'A4';
    }

    await page.pdf(pdfOptions);
    console.log(`PDF built: dist/pdf/${outName} (${PRINT_MODE ? 'print / KDP 6×9' : 'screen / A4'})`);
  } finally {
    await browser.close();
    fs.unlinkSync(tmpPath);
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = { applyExtensions, buildHtml };

if (require.main === module) {
  main().catch(err => {
    console.error('PDF build failed:', err.message);
    process.exit(1);
  });
}
