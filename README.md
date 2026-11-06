# aictrl plugin reviewer fixture

This dependency-free repository is the deterministic baseline for aictrl's
public plugin review cases. It intentionally contains one small JavaScript
module and a fast Node test suite.

The unused implementation/review/readiness workflow has been retired. Its source
remains in Git history. Git synchronization archives its existing aictrl workflow
and embedded templates while retaining published workflow versions.

```bash
npm test
```

The repository must remain public and contain no credentials, customer data,
private dependencies, production integrations, deployment configuration, or
organization-only instructions. Reviewer cases may create feature branches
and pull requests, but must never merge or deploy them automatically.

Released under the MIT License.
