[//]: # (E2E Test Coverage: A17. Add E2E test: approval rejection path)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg)](https://vitejs.dev/)

#PetAd Frontend 🐾

<!-- close #C15 -->
<!-- Note: A13. Add sort-by-date and sort-by-status controls to Approval list documentation reference placeholder -->
<!-- Updated toast/snackbar support for high-priority live notifications (close #C10) -->
<!-- Note: ApprovalListPage integrated with useApprovalList and filters (close #8) -->
<!-- Added useRejectRequest mutation hook implementation notes (close #A7) -->
<!-- Added ApprovalCard component support (close #A9) -->

A modern, responsive web application for pet adoption and temporary custody management, powered by blockchain-backed trust guarantees (Stellar trust layer integration).

***
##Overview

PetAd Frontend is the client-side application for the PetAd platform, enabling users to browse pets, initiate adoption processes, and manage temporary custody arrangements. The application communicates exclusively with the PetAd backend API and does not directly interact with blockchain infrastructure.

<!-- close #B4 -->
Note: Includes REST fallback and backfill paths for notifications via `notificationService.ts` to support offline usage and initial loading.

***

## ✨ Features

- **🔍 Pet Browsing & Search** - Discover available pets with advanced filtering
- **❤️ Adoption Workflows** - Streamlined adoption process from inquiry to completion
- **⏰ Temporary Custody** - Request and manage short-term pet care arrangements
- **👤 User Profiles** - Personalized dashboards for pet seekers and caretakers
- **📄 Document Management** - Secure upload and verification of required documents
- **🔔 Real-time Updates** - Live status notifications for adoption and custody requests (close #C9)
- **⚖️ Dispute Management** - Comprehensive tracking and resolution pathways for administrative and user disputes

### Feature guides

Each domain has a guide with its file map, routes and hook usage snippets:

| Feature | What it covers | Guide |
|---------|----------------|-------|
| ✅ **Approval** | Multi-party approve/reject decisions on adoptions, approval queues, quorum, expiry | [`docs/features/approval.md`](docs/features/approval.md) |
| ⚖️ **Dispute** | Raising disputes with evidence, SLA badges, admin resolution (escrow split) | [`docs/features/dispute.md`](docs/features/dispute.md) |
| 🏠 **Custody** | Temporary custody requests, lifecycle, timeline with on-chain links | [`docs/features/custody.md`](docs/features/custody.md) |
| 🔔 **Notifications** | Bell/dropdown, unread badge, preferences, deep links, WebSocket push | [`docs/features/notifications.md`](docs/features/notifications.md) |

How data flows between these layers is in [`docs/architecture.md`](docs/architecture.md).

***

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18+** | UI library |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first styling |
| **TanStack Query** | Server state management |
| **React Router** | Client-side routing |
| **Zod** | Schema validation |

---

## 🧑‍💻 Development

**New to the project? Start here → [`docs/local-dev.md`](docs/local-dev.md)**

It covers how to choose between the offline MSW mocks (`VITE_MSW=true`) and a real staging backend
(`VITE_MSW=false VITE_API_URL=…`), and what is and isn't testable in each mode.

```bash
pnpm install
pnpm dev        # http://localhost:4321 — offline, MSW mocks
```

Other docs:

- [`docs/local-dev.md`](docs/local-dev.md) — local dev vs. staging backend workflow
- [`docs/guest-mode.md`](docs/guest-mode.md) — guest browsing mode and auth gating
- [`docs/notifications.md`](docs/notifications.md) — real-time notification transport decisions
- [`docs/architecture.md`](docs/architecture.md) — request flow, realtime, auth/session, cache invalidation, frontend/blockchain boundary
- [`docs/features/`](docs/features/) — per-feature guides (approval, dispute, custody, notifications)

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** `>= 20.0.0`
- **npm** `>= 10.0.0` or **pnpm** `>= 8.0.0`

Check your versions:

```bash
node --version
npm --version
```

---

## 🚀 Getting Started

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/amina69/PetAd-Frontend.git
cd petad-frontend
```

2. **Install dependencies**

```bash
npm install
```

Or using pnpm:

```bash
pnpm install
```

---

### Environment Setup

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3000
VITE_MSW=false
```

> **Note:** `VITE_API_URL` should point to your PetAd backend API instance.
> `VITE_MSW` must stay `false` for production builds — enabling the mock
> service worker in a production bundle is blocked by CI (see
> [Mock API (MSW)](#-mock-api-msw)).

**Optional environment variables:**

```env
VITE_APP_NAME=PetAd
VITE_ENABLE_ANALYTICS=false
VITE_ANALYTICS_ENDPOINT=
```

See [`.env.example`](.env.example) for the full list (WebSocket URL, Stellar network, …).

> **Privacy:** analytics and error reporting are **off** unless
> `VITE_ENABLE_ANALYTICS` is exactly `true`; when off, the app makes no
> analytics network calls. When on, only allow-listed events with
> non-free-text values are sent (`src/lib/analytics.ts`) and error reports are
> scrubbed of PII. Use `logger` from `src/lib/logger.ts` instead of `console.*`:
> `debug`/`info` are silent in production and `warn`/`error` are redacted.
> Never log request bodies, headers or cookies.

---

### Running the App

Start the development server:

```bash
npm run dev
```

The application will be available at:

```
http://localhost:5173
```

---

## 📁 Project Structure

```
src/
├── api/                  # Service layer: one object per domain
│   ├── adoptionService.ts, approvalService.ts, authService.ts
│   ├── custodyService.ts, disputes.ts, documentService.ts, escrowService.ts
│   └── notificationService.ts, petService.ts
├── assets/               # Images and static media
├── components/           # UI, grouped by domain
│   ├── adoption/  approval/  auth/  badges/  blockchain/  custody/
│   ├── dispute/  disputes/  escrow/  filters/  home/  icons/  layout/
│   ├── listings/  loaders/  modals/  notifications/  toast/  wallet/
│   ├── shared/           # Cross-domain primitives (ResponsiveImage, Pagination)
│   └── ui/               # Generic widgets (PetCard, Skeleton, badges, upload zones)
├── context/              # AuthGateContext, NotificationSocketContext
├── features/             # Domain modules (api · hooks · schemas · types)
│   ├── approval/         # approval queue + decisions
│   ├── custody/          # custody types + zod schemas
│   ├── dispute/          # legacy dispute module (superseded by disputes/)
│   ├── disputes/         # dispute creation, schemas, status config
│   └── notifications/    # preferences, unread count, mark-read, socket hook
├── hooks/                # Shared and cross-feature hooks (useAuth, useDisputes, …)
├── lib/                  # Core infrastructure
│   ├── api-client.ts     # ApiClient (Bearer token, ApiError, 401 handling)
│   ├── api-errors.ts, query-client.ts
│   ├── logger.ts, analytics.ts, scrub.ts   # privacy-safe logging & analytics
│   ├── stellar.ts        # explorer URL helpers (read-only)
│   ├── hooks/            # Polling, custody, escrow and count hooks
│   └── realtime/         # Framework-agnostic notification WebSocket manager
├── mocks/                # MSW mock API (dev + test)
│   ├── browser.ts        # Browser ServiceWorker setup
│   ├── server.ts         # Node server for Vitest
│   └── handlers/         # One file per domain
│       ├── adoption.ts, approval.ts, auth.ts, custody.ts, dispute.ts
│       └── escrow.ts, files.ts, listings.ts, notify.ts, status.ts
├── pages/                # Route-level components (+ adoption/, disputes/, settings/)
├── test/                 # Global test setup (+ msw/)
├── types/                # Global TypeScript types
├── utils/                # Pure helpers (csv, query params, …)
├── main.tsx              # Entry point (providers, MSW bootstrap, analytics init)
└── App.tsx               # Routes and guards
```

> Documents, profile and auth are not separate `features/` folders: documents
> live in `api/documentService.ts`, `components/ui/Document*` and
> `components/modals/`; profile in `pages/ProfilePage.tsx`; auth in
> `components/auth/`, `hooks/useAuth.ts`, `context/AuthGateContext.tsx` and
> `api/authService.ts`.

**Key Directories:**

- **`api/`** - Centralized API communication layer
- **`features/`** - Feature modules (approval, custody, disputes, notifications)
- **`components/`** - Reusable, presentational components grouped by domain
- **`lib/`** - ApiClient, error classes, logger/analytics, realtime socket manager, shared hooks
- **`mocks/`** - MSW handlers for offline development and tests
- **`hooks/`** - Custom React hooks for shared logic
- **`pages/`** - Top-level route components

---

## 🧑‍💻 Development Guidelines

### Code Style

- Use **feature-based architecture** for scalability
- Keep components **small and focused** (single responsibility)
- Validate all forms with **Zod schemas**
- Handle **loading** and **error states** explicitly
- Use **TypeScript strict mode** (no implicit any)

### Component Example

```tsx
// features/pets/components/PetCard.tsx
import { Pet } from '@/types/pet';

interface PetCardProps {
  pet: Pet;
  onAdopt: (petId: string) => void;
}

export function PetCard({ pet, onAdopt }: PetCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{pet.name}</h3>
      <p className="text-sm text-gray-600">{pet.breed}</p>
      <button
        onClick={() => onAdopt(pet.id)}
        className="mt-2 rounded bg-blue-500 px-4 py-2 text-white"
      >
        Adopt Me
      </button>
    </div>
  );
}
```

### Validation Example

```tsx
import { z } from 'zod';

const adoptionFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  reason: z.string().min(50, 'Please provide more details'),
});

type AdoptionFormData = z.infer<typeof adoptionFormSchema>;
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (hot reload enabled) |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |
| `npm run test` | Run unit tests with Vitest |
| `npm run e2e` | Run Playwright end-to-end tests |
| `npm run check:msw` | Fail if a production build resolves `VITE_MSW=true` |

---

**Important:** Ensure environment variables are configured in your deployment platform:

- `VITE_API_URL` - Backend API endpoint

---

## ⚖️ Mock API (MSW)

This project uses [Mock Service Worker (MSW)](https://mswjs.io/) to intercept API requests during **development** and **Vitest tests**, so the frontend can be developed without the backend running.

### Enable in development

```bash
VITE_MSW=true npm run dev
```

Look for `[MSW] Mocking enabled.` in the browser console to confirm it is active.

### Covered domains

| Domain | File | Status |
|--------|------|--------|
| Escrow | `src/mocks/handlers/escrow.ts` | ✅ Matches backend |
| Adoption status | `src/mocks/handlers/status.ts` | ✅ Matches backend |
| Documents | `src/mocks/handlers/files.ts` | ✅ Matches backend |
| Approval | `src/mocks/handlers/approval.ts` | ✅ Matches backend |
| Dispute | `src/mocks/handlers/dispute.ts` | ✅ Matches backend |
| Notifications | `src/mocks/handlers/notify.ts` | ✅ Matches backend |

### Production guard

`VITE_MSW=true` must never be resolved by a production build. The
`scripts/check-msw-production.mjs` guard runs as part of `npm run build`
(via `npm run check:msw`) and as a CI step. It fails the build when the
resolved environment for a `production` target enables MSW, and it is
self-tested in CI against a deliberately misconfigured environment.

### Simulate slow responses

Append `?delay=<ms>` to any request to simulate network latency:

```bash
curl "http://localhost:5173/api/notifications?delay=2000"
```

### Override a handler in a test

```ts
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

it('shows disputed state', async () => {
  server.use(
    http.get('/api/escrow/:id', () =>
      HttpResponse.json({ status: 'DISPUTED' }),
    ),
  );
  // ... rest of test
});
```

---

## 🔗 API Communication

The frontend communicates with the PetAd backend API for all operations, including:

- User authentication
- Pet listings and details
- Adoption applications
- Custody requests
- Document uploads

**Security:**

- The frontend **never holds private keys**
- All blockchain transactions are processed server-side
- The auth token is a Bearer token kept in browser storage (`auth_token`) and sent in the `Authorization` header; see [Auth and session flow](docs/architecture.md#3-auth-and-session-flow)

**Example API Call:**

```tsx
import { useQuery } from '@tanstack/react-query';
import { petService } from '@/api/petService';

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: () => petService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---
## 🎨 Design Reference

This project follows a comprehensive design system documented in Figma. Please refer to the design files when implementing new features or components to ensure consistency.

**📐 Figma Design File:** [PetAd Design System](https://www.figma.com/design/avLyxNlVzfPjCft7sVrlzs/PETAD?node-id=0-1&t=zUA1sGPYsp60vYt4-1)

The design includes:
- 🎨 Complete UI component library
- 📱 Responsive layouts for mobile, tablet, and desktop
- 🌈 Color palette and typography specifications
- 🔄 User flow diagrams for adoption and custody workflows
- ♿ Accessibility guidelines

> **Note for Developers:** Always check the Figma design before building new components. Maintain pixel-perfect implementations where possible, and consult with the design team for any deviations.

---
## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Before submitting:**

- fix any issues
- Ensure `npm run lint`, `npm run build` and `npm test` pass
- Add tests for new features
- Update documentation if needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ for pet lovers everywhere
- Powered by blockchain technology for transparent, trustworthy pet adoption

---

**Made with 🐾 by the PetAd Team**
