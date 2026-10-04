# Bundle audit

Run the production build with the Rollup visualizer enabled:

```bash
npm run build:analyze
```

This writes `dist/bundle-stats.html`. Open that file after a build to inspect the
treemap, compressed sizes, and route chunks. The following is the initial audit
of the dependency graph; the visualizer report is the source of truth for exact
byte sizes.

| Dependency | Why it is present | Action |
| --- | --- | --- |
| `react`, `react-dom` | Application runtime | Required |
| `react-router-dom` | Route and navigation state | Required; route splitting limits its page impact |
| `@tanstack/react-query` | Server-state caching and mutations | Required for API consistency |
| `lucide-react` | Shared icon set | Keep; import icons individually |
| `react-hot-toast` | User-facing mutation feedback | Keep; replace only if the report shows it is unexpectedly large |
| `axios` | API client and interceptors | Required by the existing client boundary |
| `graphql` | GraphQL request parsing/types | Keep while GraphQL endpoints remain supported |
| `date-fns` | Date formatting and comparison | Keep; prefer named imports |
| `tailwindcss` / `@tailwindcss/vite` | Build-time styling | Build-time tooling, not shipped as runtime code |
| `msw` | Development and test API mocks | Must remain out of production chunks |

The report should be regenerated whenever dependencies or top-level routes
change. A dependency is a surprise when it appears in the initial entry chunk
despite being used only by a protected route or test; that case should be
resolved by moving the import behind the route/component boundary or replacing
the dependency with a smaller equivalent.
