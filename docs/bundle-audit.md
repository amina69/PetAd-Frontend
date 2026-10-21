# Bundle audit

`npm run build` writes Vite's manifest and then runs
`scripts/check-bundle-size.mjs`. The check follows the entry chunk's imported
JavaScript, reports its gzip size, lists the ten largest JavaScript assets, and
fails when the initial graph exceeds 350 KiB gzipped. Route chunks are still
reported, but they do not count against the initial budget until a route imports
them.

Run `npm run bundle:report` after a build to inspect the report without failing
the command. When the budget fails, first check whether a route import was
accidentally made static, then inspect the largest assets before replacing a
dependency or changing the budget. A budget increase must include the measured
before/after gzip sizes in the PR description and a reason tied to user-facing
functionality.

The route graph is intentionally split in `src/App.tsx`: each page is loaded by
React Router through `React.lazy`, so adding a page import to the top-level
module is a measurable regression.
