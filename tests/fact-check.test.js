'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { extractTags, loadCitationIds, parseSpecStatus } = require('../scripts/fact-check');

const extractTagsData = require('./data/extract-tags.json');
const citationIdsData = require('./data/citation-ids.json');

// ── extractTags ───────────────────────────────────────────────────────────────

for (const { given, then } of extractTagsData) {
  const label = given.content.slice(0, 60).replace(/\n/g, '\\n');
  test(`extractTags("${label}...", "${given.tagName}")`, () => {
    const result = extractTags(given.content, given.tagName);
    assert.deepEqual(result, then);
  });
}

// ── loadCitationIds ───────────────────────────────────────────────────────────

for (const { given, then } of citationIdsData) {
  const label = given.slice(0, 60).replace(/\n/g, '\\n');
  test(`loadCitationIds: "${label}..."`, () => {
    const result = [...loadCitationIds(given)].sort();
    assert.deepEqual(result, [...then].sort());
  });
}

// ── parseSpecStatus ───────────────────────────────────────────────────────────

const parseSpecStatusData = [
  {
    given: '---\nstatus: reviewed\n---\n\n# Title',
    then: 'reviewed'
  },
  {
    given: '---\nstatus: verified\n---\n\n# Title',
    then: 'verified'
  },
  {
    given: '---\nstatus: stub\n---\n\n# Title',
    then: 'stub'
  },
  {
    given: '---\nstatus: draft\n---\n\n# Title',
    then: 'draft'
  },
  {
    given: '---\nid: no-status-field\n---\n\n# Title',
    then: 'unknown'
  },
  {
    given: 'No frontmatter at all, just markdown.',
    then: 'unknown'
  }
];

for (const { given, then } of parseSpecStatusData) {
  const label = given.slice(0, 50).replace(/\n/g, '\\n');
  test(`parseSpecStatus: "${label}..."`, () => {
    assert.equal(parseSpecStatus(given), then);
  });
}
