# Accessibility audit baseline

Automated scans use `@axe-core/playwright` in `e2e/a11y/routes.spec.ts`. The suite opens every top-level route in the light colour scheme, plus the auth-gate modal and the account menu. Animations stay on for these scans; visual snapshots disable them separately.

## What fails CI

A **serious** or **critical** axe violation fails the build when its id is not already listed in `e2e/a11y/baseline.json`. The id is `ruleId::target`. Moderate and minor results are recorded in the Playwright report and do not fail the build.

`e2e/a11y/baseline.json` currently lists no serious or critical violations. A new one must be fixed, or, if it is an accepted existing issue, added to that file in the same pull request with a note here.

## Updating the baseline

1. Run `npx playwright test e2e/a11y --project=a11y`.
2. Copy any accepted `rule::target` ids into `e2e/a11y/baseline.json`.
3. Describe why each id is accepted in this document.

Colour contrast is fixed at the token layer (`tailwind.config.ts` and `src/index.css`), not by ignoring `color-contrast` rules. Status badges include an icon and a text label.
