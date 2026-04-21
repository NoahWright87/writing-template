'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { applyExtensions: applySiteExtensions } = require('../scripts/build-site');
const { applyExtensions: applyPdfExtensions } = require('../scripts/build-pdf');

const siteData = require('./data/site-extensions.json');
const pdfData = require('./data/pdf-extensions.json');

// ── Site extensions ───────────────────────────────────────────────────────────

for (const { given, then } of siteData) {
  const label = given.html.slice(0, 60);
  test(`site applyExtensions: "${label}"`, () => {
    const result = applySiteExtensions(given.html, given.specMap ?? {}, given.depth ?? 1);
    assert.equal(result, then);
  });
}

// ── PDF extensions ────────────────────────────────────────────────────────────

for (const { given, then } of pdfData) {
  const label = given.slice(0, 60);
  test(`pdf applyExtensions: "${label}"`, () => {
    const result = applyPdfExtensions(given);
    assert.equal(result, then);
  });
}
