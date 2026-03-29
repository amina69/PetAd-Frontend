# Pull Request: Add useAdoptionApprovals Hook

## Description
Hook to fetch and monitor adoption approval state. Automatically checks for approvals every 30 seconds and stops polling once quorum is reached.

## What's New
- `useAdoptionApprovals(adoptionId)` hook fetching approval state
- Polls `GET /adoption/:id/approvals` every 30s while `quorumMet` is false
- Returns: `{required, given, pending, quorumMet, escrowAccountId, isLoading, isError}`
- Stops polling automatically when quorum is met

## Files Added
- `src/api/adoptionApprovalsService.ts` - Service layer
- `src/hooks/useAdoptionApprovals.ts` - Main hook
- Test files with 18 total tests

## Test Coverage
- Pre-quorum and post-quorum states
- Polling behavior verification
- Polling stops when quorumMet:true ✓

Closes adoption approvals issue
