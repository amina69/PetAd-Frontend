# Approvals Badge Implementation

## Overview
This implementation adds a dynamic notification badge to the "Approvals" navigation item that displays the count of pending approvals and updates automatically via polling.

## Features Implemented

### 1. Data Fetching & Polling
- **API Service**: Created `src/api/shelterService.ts` with a dedicated endpoint for fetching pending approvals count
- **Hook**: Refactored `usePendingApprovalsCount` to use React Query (`@tanstack/react-query`)
- **Polling Configuration**:
  - Stale time: 5 minutes (300,000ms)
  - Refetch interval: 5 minutes (300,000ms)
  - Refetch on window focus: Enabled for immediate updates when user returns to tab

### 2. Role-Based Access Control
- **Authorized Roles**: SHELTER and ADMIN
- **Guard Logic**: 
  - Badge only renders for users with SHELTER or ADMIN roles
  - API requests are conditionally enabled based on role using React Query's `enabled` option
  - Unauthorized users (USER role) will not trigger any API calls
- **Hook Enhancement**: Updated `useRoleGuard` to include `isShelter` boolean

### 3. UI & Badge Logic
- **Styling**: Small, circular red badge with white text
- **Display Rules**:
  - `count === 0`: Badge is hidden
  - `0 < count <= 9`: Display exact number
  - `count > 9`: Display "9+"
- **Layout**: Badge positioned inline with the "Approvals" link text
- **Consistency**: Matches existing navigation theme with proper spacing

### 4. Accessibility
- **ARIA Label**: Badge includes descriptive `aria-label` with format:
  - Singular: "1 pending approval"
  - Plural: "5 pending approvals"
- **Screen Reader Support**: Count is announced to assistive technologies

## Files Created/Modified

### Created Files
1. `src/api/shelterService.ts` - API service for shelter-related endpoints
2. `src/hooks/__tests__/usePendingApprovalsCount.test.tsx` - Comprehensive hook tests
3. `src/components/layout/__tests__/Navbar.test.tsx` - Navbar component tests with badge scenarios

### Modified Files
1. `src/hooks/usePendingApprovalsCount.ts` - Refactored to use React Query with polling
2. `src/hooks/useRoleGuard.ts` - Added `isShelter` boolean for SHELTER role
3. `src/components/layout/Navbar.tsx` - Added Approvals link with dynamic badge

## Test Coverage

### Hook Tests (`usePendingApprovalsCount.test.tsx`)
- ✅ Returns count 0 when user is not authorized
- ✅ Fetches and returns count for admin role
- ✅ Fetches and returns count for shelter role
- ✅ Returns 0 when API returns no count
- ✅ Handles API errors gracefully
- ✅ Does not fetch when role is null

### Navbar Tests (`Navbar.test.tsx`)
- ✅ Does not show Approvals link for regular users
- ✅ Shows Approvals link for admin users
- ✅ Shows Approvals link for shelter users
- ✅ Hides badge when count is 0
- ✅ Displays exact count when count is between 1 and 9
- ✅ Displays "9+" when count is 10
- ✅ Displays "9+" when count is 100
- ✅ Displays singular "approval" in aria-label when count is 1
- ✅ Has correct styling for badge
- ✅ Shows all base navigation links

## Running Tests

```bash
# Run all tests
npm test

# Run specific test files
npm test -- src/hooks/__tests__/usePendingApprovalsCount.test.tsx
npm test -- src/components/layout/__tests__/Navbar.test.tsx

# Run tests in watch mode (for development)
npm test -- --watch
```

## Usage

### Setting User Role
The role is stored in localStorage under the key `petad_user_role`:

```javascript
// Set admin role
localStorage.setItem('petad_user_role', 'admin');

// Set shelter role
localStorage.setItem('petad_user_role', 'shelter');

// Set user role (no badge)
localStorage.setItem('petad_user_role', 'user');
```

### Manual Cache Invalidation
To manually refresh the badge count (e.g., after resolving an approval):

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate the cache to trigger immediate refetch
queryClient.invalidateQueries(['shelter', 'approvals', 'pending-count']);
```

## Performance Considerations

1. **Conditional Fetching**: API requests only fire for authorized users (SHELTER/ADMIN)
2. **Polling Optimization**: 5-minute interval balances freshness with server load
3. **Window Focus Refetch**: Ensures data is current when user returns to the application
4. **React Query Caching**: Prevents unnecessary requests when navigating between pages

## Badge Styling Details

```css
/* Badge classes */
.badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;        /* Ensures circular shape for single digits */
  height: 20px;
  padding: 0 6px;         /* Flexible width for "9+" */
  font-size: 11px;
  font-weight: bold;
  color: white;
  background-color: #ef4444; /* red-500 */
  border-radius: 9999px;  /* fully rounded */
}
```

## Future Enhancements

1. **Real-time Updates**: Consider WebSocket integration for instant updates
2. **Sound Notifications**: Optional audio alert for new approvals
3. **Badge Animation**: Subtle pulse effect when count increases
4. **Detailed Tooltip**: Hover tooltip showing breakdown of approval types
5. **Mobile Responsiveness**: Ensure badge displays correctly on mobile navigation

## API Contract

### Endpoint
```
GET /shelter/approvals?status=PENDING&limit=0
```

### Response
```typescript
{
  count: number;
  items?: unknown[];
}
```

### Example Response
```json
{
  "count": 5,
  "items": []
}
```

## Troubleshooting

### Badge Not Showing
1. Verify user role: `localStorage.getItem('petad_user_role')`
2. Check if count > 0
3. Ensure user has SHELTER or ADMIN role

### API Not Being Called
1. Verify React Query is properly configured
2. Check that `enabled` condition is met (role is admin or shelter)
3. Inspect network tab for API requests

### Tests Failing
1. Ensure all dependencies are installed: `npm install`
2. Clear test cache: `npm test -- --clearCache`
3. Check mock implementations are correct
