# feat: Implement ApprovalDecisionButtons Component

## Summary

Approve/reject buttons for adoption approvals with rejection reason modal.

## Changes

- `ApprovalDecisionButtons` component with conditional rendering
- Approve button (one-click submission)
- Reject button (opens modal for reason)
- Toast notifications on success/error
- `submitApprovalDecision` method in adoptionApprovalsService
- 18 unit tests

## Tests

All passing - covers visibility, mutations, modals, and accessibility
