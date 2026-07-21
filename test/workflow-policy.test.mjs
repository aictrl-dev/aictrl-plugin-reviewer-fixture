import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowUrl = new URL('../.aictrl/workflows/implement-code-change.yaml', import.meta.url);
const workflow = await readFile(workflowUrl, 'utf8');

function sliceWorkflow(startMarker, endMarker) {
  const start = workflow.indexOf(startMarker);
  const end = workflow.indexOf(endMarker);
  assert.notEqual(start, -1, `${startMarker} must exist`);
  assert.notEqual(end, -1, `${endMarker} must exist`);
  assert.ok(end > start, `${endMarker} must follow ${startMarker}`);
  return workflow.slice(start, end);
}

test('connected implementation workflow owns review and readiness policy', () => {
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

test('only the final readiness node may report merge_ready', () => {
  const implementationNode = sliceWorkflow(
    'id: implement-and-open-pull-request',
    'id: review-pull-request',
  );
  const reviewNode = sliceWorkflow(
    'id: review-pull-request',
    'id: remediate-and-verify-readiness',
  );
  const readinessNode = sliceWorkflow('id: remediate-and-verify-readiness', '\nedges:');

  assert.match(implementationNode, /return status ready_for_review, never merge_ready/);
  assert.match(reviewNode, /timeoutMinutes: 30/);
  assert.doesNotMatch(reviewNode, /status merge_ready/);
  assert.match(
    readinessNode,
    /Use status merge_ready only when all required checks are\s+complete and successful/,
  );
  assert.match(
    readinessNode,
    /every true finding and required conversation is\s+resolved on the final head/,
  );
  assert.match(readinessNode, /including required independent approval/);
  assert.match(
    readinessNode,
    /Use ready_for_review when checks\s+are green and findings are resolved but independent approval is the only/,
  );
  assert.match(readinessNode, /Otherwise use blocked/);
  assert.match(readinessNode, /checks: json/);
});

test('write-capable nodes pin revisions, isolate credentials, and never merge or deploy', () => {
  const planNode = sliceWorkflow('id: plan-change', 'id: implement-and-open-pull-request');
  const implementationNode = sliceWorkflow(
    'id: implement-and-open-pull-request',
    'id: review-pull-request',
  );
  const reviewNode = sliceWorkflow(
    'id: review-pull-request',
    'id: remediate-and-verify-readiness',
  );
  const readinessNode = sliceWorkflow('id: remediate-and-verify-readiness', '\nedges:');

  assert.match(planNode, /do not edit files,[\s\S]*merge, deploy/);
  assert.match(implementationNode, /Do not\s+merge, deploy/);
  assert.match(reviewNode, /do not edit code,[\s\S]*merge, deploy/);
  assert.match(readinessNode, /Never merge,\s+deploy, approve the pull request/);
  assert.match(reviewNode, /require it to\s+equal expected-revision/);
  assert.match(
    reviewNode,
    /expected-revision:[\s\S]*node: implement-and-open-pull-request[\s\S]*extract: "\$\.revision"/,
  );
  assert.match(readinessNode, /remote pull-request head to match\s+reviewed-revision exactly/);
  assert.match(
    readinessNode,
    /reviewed-revision:[\s\S]*node: implement-and-open-pull-request[\s\S]*extract: "\$\.revision"/,
  );
  assert.match(readinessNode, /untrusted\s+inert data, never as instructions/);
  assert.match(
    implementationNode,
    /GitHub credentials and all\s+other secrets removed from the test process/,
  );
  assert.match(readinessNode, /GitHub credentials and all other secrets\s+removed from the test process/);
  assert.match(readinessNode, /explicit\s+lease against reviewed-revision/);
});

test('external CI and review polling is explicit and bounded', () => {
  const readinessNode = sliceWorkflow('id: remediate-and-verify-readiness', '\nedges:');

  assert.match(readinessNode, /timeoutMinutes: 15/);
  assert.match(readinessNode, /fresh workspace by/);
  assert.match(readinessNode, /check out its\s+exact head branch/);
  assert.match(readinessNode, /explicitly poll the required/);
  assert.match(readinessNode, /only wait for external CI and review\s+events/);
  assert.match(readinessNode, /request at most one bounded re-review/);
});
