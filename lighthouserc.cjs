// Lighthouse CI configuration. Keep this file CommonJS because the 0.14 CLI
// loads configuration with require(), while this application is ESM.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview -- --port 4173 --strictPort',
      startServerReadyPattern: 'Local',
      url: ['http://localhost:4173/listings'],
      numberOfRuns: 3,
      settings: {
        preset: 'perf',
        formFactor: 'mobile',
        // Keep the mobile viewport/user agent while measuring the actual CI
        // runner. Simulated throttling makes this SPA's local preview fail
        // before the browser can execute the application shell.
        throttlingMethod: 'provided',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
