# AICtrl plugin reviewer fixture

This dependency-free repository is the deterministic baseline for AICtrl's
public plugin review cases. It intentionally contains one small JavaScript
module, a repository-owned implementation/review/readiness workflow, and a fast
Node test suite that locks the workflow's safety policy.

```bash
npm test
```

The repository must remain public and contain no credentials, customer data,
private dependencies, production integrations, deployment configuration, or
organization-only instructions. Reviewer workflows may create feature branches
and pull requests, but must never merge or deploy them automatically.

Released under the MIT License.
