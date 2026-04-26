# Testing and QA

## QA priorities

For each feature, check:

- loading state;
- empty state;
- error state;
- success state;
- validation errors;
- permissions;
- tenant-sensitive data;
- navigation;
- destructive actions;
- table actions;
- API failures;
- slow network behavior.

## Manual test checklist

A QA Agent should produce:

1. Happy path.
2. Error paths.
3. Edge cases.
4. Regression risks.
5. Data assumptions.
6. UX issues.
7. Recommendation.

## Approval levels

- Approve: safe to merge.
- Approve with fixes: minor fixes needed.
- Reject: critical issue or unclear behavior.
