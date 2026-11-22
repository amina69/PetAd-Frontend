# Frontend security headers

Vercel sends the headers configured in `vercel.json` on every route. The CSP is
currently `Content-Security-Policy-Report-Only`, so it reports violations
without blocking the app while the production API and realtime origins are
confirmed. The `.example.com` hosts in the policy are documentation
placeholders: replace them with the exact API and WebSocket origins configured
in the GitHub `staging` and `production` Environments before relying on CSP
reports. Keep `connect-src` limited to the app origin and those required API
and realtime origins. Do not use wildcards or broad `https:`/`wss:` sources.

After exercising the authenticated, adoption, dispute, upload, and notification
flows in staging, review browser console CSP reports. Update the policy for
required resources, then change the header key to `Content-Security-Policy` to
enforce it. Keep `frame-ancestors 'none'`, `object-src 'none'`, and
`base-uri 'self'`; do not add `unsafe-inline` to `script-src`.

The response also sets `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.

## User-generated content

React escapes text children by default. Dispute authors and messages are
rendered as text in `DisputeThread`; do not turn them into HTML or clickable
URLs. ESLint rejects `dangerouslySetInnerHTML` in TypeScript React files. If a
future product requirement needs rich text, add a reviewed sanitizer with a
strict element/attribute/protocol allow-list before rendering. Never allow
`javascript:` URLs. Links that open a new tab must use
`rel="noopener noreferrer"`.
