import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowUrl = new URL('../.aictrl/workflows/implement-code-change.yaml', import.meta.url);

test('connected implementation workflow owns review and readiness policy', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');

  const orderedNodes = [
    'id: plan-change',
    'id: implement-and-open-pull-request',
    'id: review-pull-request',
    'id: remediate-and-verify-readiness',
  ];
  let previousIndex = -1;
  for (const node of orderedNodes) {
    const index = workflow.indexOf(node);
    assert.ok(index > previousIndex, `${node} must exist after the preceding lifecycle node`);
    previousIndex = index;
  }

  assert.match(workflow, /skill: implement-code-change@1\.0\.0/);
  assert.match(workflow, /skill: code-review@1\.0\.0/);
  assert.match(workflow, /skill: reply-to-code-review@1\.0\.0/);
  assert.match(
    workflow,
    /from: implement-and-open-pull-request, to: review-pull-request/,
  );
  assert.match(
    workflow,
    /from: review-pull-request, to: remediate-and-verify-readiness/,
  );
});

test('only the final readiness node may report merge_ready', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const implementationStart = workflow.indexOf('id: implement-and-open-pull-request');
  const reviewStart = workflow.indexOf('id: review-pull-request');
  const readinessStart = workflow.indexOf('id: remediate-and-verify-readiness');
  const edgesStart = workflow.indexOf('\nedges:');

  const implementationNode = workflow.slice(implementationStart, reviewStart);
  const reviewNode = workflow.slice(reviewStart, readinessStart);
  const readinessNode = workflow.slice(readinessStart, edgesStart);

  assert.match(implementationNode, /return status ready_for_review, never merge_ready/);
  assert.doesNotMatch(reviewNode, /status merge_ready/);
  assert.match(readinessNode, /Use status merge_ready only when all required checks are/);
  assert.match(readinessNode, /including required independent approval/);
  assert.match(readinessNode, /Use ready_for_review when checks/);
  assert.match(readinessNode, /Otherwise use blocked/);
  assert.match(readinessNode, /checks: json/);
});

test('external CI and review polling is explicit and bounded', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  const readinessStart = workflow.indexOf('id: remediate-and-verify-readiness');
  const edgesStart = workflow.indexOf('\nedges:');
  const readinessNode = workflow.slice(readinessStart, edgesStart);

  assert.match(readinessNode, /timeoutMinutes: 15/);
  assert.match(readinessNode, /fresh workspace by/);
  assert.match(readinessNode, /check out its exact head branch/);
  assert.match(readinessNode, /explicitly poll the required/);
  assert.match(readinessNode, /only wait for external CI and review\s+events/);
  assert.match(readinessNode, /request at most one bounded re-review/);
});
