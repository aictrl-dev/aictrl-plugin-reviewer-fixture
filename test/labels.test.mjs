import assert from 'node:assert/strict';
import test from 'node:test';

import { isReleaseLabel, normalizeLabel } from '../src/labels.mjs';

test('recognizes release labels without depending on letter case', () => {
  assert.equal(isReleaseLabel('release:beta'), true);
  assert.equal(isReleaseLabel('  RELEASE:stable'), true);
});

test('rejects unrelated and non-string labels', () => {
  assert.equal(isReleaseLabel('documentation'), false);
  assert.equal(isReleaseLabel(null), false);
});

test('normalizeLabel normalizes typical human-entered text', () => {
  assert.equal(normalizeLabel('  Bug Report  '), 'bug-report');
  assert.equal(normalizeLabel('Feature Request'), 'feature-request');
});

test('normalizeLabel collapses repeated whitespace and underscores', () => {
  assert.equal(normalizeLabel('Priority   __High__'), 'priority-high');
  assert.equal(normalizeLabel('a   b___c'), 'a-b-c');
});

test('normalizeLabel strips punctuation it cannot represent', () => {
  assert.equal(normalizeLabel('Feature: New!'), 'feature-new');
  assert.equal(normalizeLabel('a.b,c;d'), 'abcd');
});

test('normalizeLabel returns an empty string when nothing valid remains', () => {
  assert.equal(normalizeLabel('!!!'), '');
  assert.equal(normalizeLabel('   '), '');
});

test('normalizeLabel throws TypeError for non-string input', () => {
  assert.throws(() => normalizeLabel(42), TypeError);
  assert.throws(() => normalizeLabel(null), TypeError);
});
