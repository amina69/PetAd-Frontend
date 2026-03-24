# usePolling Hook

A reusable React hook that wraps React Query's `refetchInterval` with intelligent pause-on-hidden-tab behavior and conditional stopping.

## Features

- ✅ Automatic polling at specified intervals
- ✅ Pause polling when browser tab is hidden (configurable)
- ✅ Stop polling when terminal condition is met
- ✅ Built on React Query for caching and state management
- ✅ TypeScript support with full type safety
- ✅ Automatic cleanup of event listeners

## Installation

This hook requires `@tanstack/react-query` as a peer dependency:

```bash
npm install @tanstack/react-query
```

## Usage

### Basic Example

```typescript
import { usePolling } from './lib/hooks';

function AdoptionStatus({ adoptionId }) {
  const { data, isLoading, error } = usePolling(
    ['adoption-status', adoptionId],
    async () => {
      const response = await fetch(`/api/adoptions/${adoptionId}`);
      return response.json();
    },
    {
      intervalMs: 5000, // Poll every 5 seconds
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Status: {data?.status}</div>;
}
```

### With Terminal Condition

Stop polling when a specific condition is met:

```typescript
const { data } = usePolling(
  ['task-status', taskId],
  fetchTaskStatus,
  {
    intervalMs: 2000,
    stopWhen: (data) => 
      data?.status === 'completed' || data?.status === 'failed',
  }
);
```

### Disable Pause on Hidden

Continue polling even when the tab is hidden:

```typescript
const { data } = usePolling(
  ['notifications'],
  fetchNotifications,
  {
    intervalMs: 30000,
    pauseOnHidden: false, // Keep polling in background
  }
);
```

### Conditional Polling

Enable/disable polling based on a condition:

```typescript
const { data } = usePolling(
  ['live-data'],
  fetchLiveData,
  {
    intervalMs: 1000,
    enabled: isUserActive, // Only poll when user is active
  }
);
```

## API

### Parameters

```typescript
usePolling<TData>(
  queryKey: QueryKey,
  fetchFn: () => Promise<TData>,
  options: UsePollingOptions<TData>
)
```

#### `queryKey`
- Type: `QueryKey` (from React Query)
- React Query cache key for the query

#### `fetchFn`
- Type: `() => Promise<TData>`
- Async function that fetches the data

#### `options`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `intervalMs` | `number` | Required | Polling interval in milliseconds |
| `stopWhen` | `(data: TData \| undefined) => boolean` | `undefined` | Function that returns `true` to stop polling |
| `pauseOnHidden` | `boolean` | `true` | Pause polling when tab is hidden |
| `enabled` | `boolean` | `true` | Enable/disable the query |

### Return Value

Returns a React Query `UseQueryResult` object with:

- `data`: The fetched data
- `isLoading`: Loading state
- `error`: Error object if fetch failed
- `refetch`: Manual refetch function
- And all other React Query result properties

## How It Works

1. **Polling**: Uses React Query's `refetchInterval` to automatically refetch data
2. **Pause on Hidden**: Listens to `visibilitychange` events to pause polling when tab is hidden
3. **Terminal Condition**: Checks `stopWhen` function after each fetch to determine if polling should stop
4. **Cleanup**: Automatically removes event listeners when component unmounts

## Testing

The hook includes comprehensive unit tests covering:

- ✅ Polling at specified intervals
- ✅ Pausing when tab is hidden
- ✅ Stopping when terminal condition is met
- ✅ Respecting `pauseOnHidden` option
- ✅ Respecting `enabled` option
- ✅ Proper cleanup of event listeners

Run tests:

```bash
npm test src/lib/hooks/__tests__/usePolling.test.tsx
```

## Examples

See `usePolling.example.tsx` for more detailed usage examples including:

- Adoption status tracking
- Pet location tracking
- Notification polling
- Document processing status

## Performance Considerations

- Use appropriate `intervalMs` values to balance freshness vs. server load
- Set `pauseOnHidden: true` (default) to reduce unnecessary requests
- Use `stopWhen` to prevent polling after terminal states are reached
- Consider using `enabled` to conditionally enable polling based on user actions

## License

MIT
