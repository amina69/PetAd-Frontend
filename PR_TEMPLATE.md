# feat: Add useAdoptionApprovals Hook

## Summary

Hook to fetch and monitor adoption approval state with smart polling that stops once quorum is reached.

## Changes

- `useAdoptionApprovals(adoptionId)` hook
- Fetches `GET /adoption/:id/approvals`
- Polls every 30s, stops when `quorumMet` is true
- Returns approval counts and state

## Tests

18 tests covering polling behavior and quorum transitions
