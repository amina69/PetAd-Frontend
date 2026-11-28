# Staging and production deployments

Staging deployments use the `Deploy` GitHub Actions workflow; version tags
(`v*`) release production through the `Release` workflow (`release.yml`). Both
deploy with Vercel. Application configuration is compiled into the static Vite
bundle, so the correct environment values must be selected before
`vercel build` runs.

## Configure GitHub environments

Create GitHub Environments named `staging` and `production` in the repository
settings. Set `production` required reviewers and restrict its deployment
branches/tags to `v*`; GitHub pauses the production job until an authorized
reviewer approves it. Restrict `staging` to the `staging` branch.

Configure these values independently in both environments:

| Name | Type | Purpose |
| --- | --- | --- |
| `VERCEL_TOKEN` | Secret | Vercel deployment credential |
| `VERCEL_ORG_ID` | Variable | Vercel team/account ID |
| `VERCEL_PROJECT_ID` | Variable | Vercel project ID |
| `VITE_API_URL` | Variable | Environment's API base URL |
| `VITE_WEBSOCKET_URL` | Variable | Environment's `wss://` notification endpoint |
| `VITE_ENABLE_ANALYTICS` | Variable | Environment-specific analytics and error-tracking consent (`true` or `false`) |
| `VITE_SENTRY_DSN` | Variable | Sentry DSN; error tracking stays off without it |
| `SENTRY_AUTH_TOKEN` | Secret | Sentry auth token used to upload source maps during the build |
| `SENTRY_ORG` | Variable | Sentry organization slug for source map uploads |
| `SENTRY_PROJECT` | Variable | Sentry project slug for source map uploads |

Use staging-only API and WebSocket URLs in the staging environment, and
production-only URLs in production. Do not copy production application secrets
or API credentials into staging. `VITE_*` values are public build-time values;
never put credentials in them. Keep private credentials in server-side hosting
environment variables. Configure matching staging/production environment
values in Vercel as well for platform functions or previews that do not use
this workflow.

## Deploy

- Every push to `staging` builds with the `staging` GitHub Environment values
  and deploys a Vercel Preview deployment.
- Push a version tag such as `v1.2.3` to build the tagged commit with the
  `production` values through the `Release` workflow. The production job
  requires the configured GitHub Environment approval before it can deploy.
- The workflow uses `vercel pull` to link the configured project, builds the
  Vite app with the selected environment values, then deploys the prebuilt
  output. A missing value should be fixed in the corresponding GitHub
  Environment; do not fall back to a production value in staging.

## Source maps and releases

Release builds emit hidden source maps (`build.sourcemap: "hidden"` in
`vite.config.ts`): the `.map` files are written next to the bundles but the
bundles contain no `sourceMappingURL` comment. `VITE_RELEASE` is set to the git
SHA in CI and is used both as the Sentry release id in the browser and by the
Sentry Vite plugin when uploading maps.

After `vercel build`, both workflows delete every `.map` file from `dist/` and
`.vercel/output/` and fail if any remain, so source maps are never part of the
deployed site. To get readable stack traces, set `SENTRY_AUTH_TOKEN`,
`SENTRY_ORG`, `SENTRY_PROJECT` and `VITE_SENTRY_DSN` in the GitHub Environment;
without Sentry credentials the build still succeeds but maps are discarded
instead of uploaded.

## Roll back

1. Open the Vercel project and select **Deployments**.
2. Identify the last known-good deployment, check its commit/tag and environment,
   and open its deployment menu.
3. Promote that deployment to production (or redeploy it, if promotion is not
   available) and confirm the production alias points to it.
4. Smoke-check the app and API/realtime connectivity, then record the incident
   and deployment IDs.

This is the rollback procedure. A real rollback still requires a project
owner to exercise it once after Vercel and GitHub Environment configuration is
available; this repository change cannot verify a live deployment.
