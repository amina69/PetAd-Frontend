// Lighthouse CI: runs against the production build on every PR (see .github/workflows/lighthouse.yml).
// Budgets come from issue #685: mobile performance >= 85 and LCP < 2.5 s on the pets page.
export default {
  ci: {
    collect: {
      startServerCommand: "npm run preview -- --port 4173 --strictPort",
      startServerReadyPattern: "Local",
      url: ["http://localhost:4173/listings"],
      numberOfRuns: 3,
      settings: { preset: "perf", formFactor: "mobile" },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.85 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
