[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg)](https://vitejs.dev/)

# PetAd Frontend 🐾

A modern, responsive web application for pet adoption and temporary custody management, powered by blockchain-backed trust guarantees (Stellar trust layer integration).

---

## Overview

PetAd Frontend is the client-side application for the PetAd platform, enabling users to browse pets, initiate adoption processes, and manage temporary custody arrangements. The application communicates exclusively with the PetAd backend API and does not directly interact with blockchain infrastructure.

---

## ✨ Features

- **🔍 Pet Browsing & Search** - Discover available pets with advanced filtering
- **❤️ Adoption Workflows** - Streamlined adoption process from inquiry to completion
- **⏰ Temporary Custody** - Request and manage short-term pet care arrangements
- **👤 User Profiles** - Personalized dashboards for pet seekers and caretakers
- **📄 Document Management** - Secure upload and verification of required documents
- **🔔 Real-time Updates** - Live status notifications for adoption and custody requests

---

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
```

> **Note:** `VITE_API_URL` should point to your PetAd backend API instance.

**Optional environment variables:**

```env
VITE_APP_NAME=PetAd
VITE_ENABLE_ANALYTICS=false
VITE_MSW=true
```

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
├── api/              # API client and service layer
│   ├── petService.ts
│   ├── adoptionService.ts
│   └── custodyService.ts
├── components/       # Reusable UI components
│   ├── common/
│   ├── layout/
│   └── forms/
├── features/         # Domain-specific features
│   ├── pets/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── adoption/
│   └── custody/
├── hooks/            # Shared custom hooks
│   └── __tests__/
├── lib/              # Core infrastructure (ApiClient, errors)
│   └── __tests__/
├── mocks/            # MSW mock API (dev + test)
│   ├── browser.ts    # Browser ServiceWorker setup
│   ├── server.ts     # Node server for Vitest
│   └── handlers/     # One file per domain
│       ├── escrow.ts
│       ├── status.ts
│       ├── approval.ts
│       ├── dispute.ts
│       ├── notify.ts
│       └── files.ts
├── pages/            # Route-level components
├── test/             # Global test setup
│   └── setup.ts
├── types/            # Global TypeScript types
├── main.tsx          # Application entry point
└── App.tsx           # Root component
```

**Key Directories:**

- **`api/`** - Centralized API communication layer
- **`features/`** - Feature-based architecture (pets, adoption, custody)
- **`components/`** - Reusable, presentational components
- **`lib/`** - ApiClient, error classes, shared hooks
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
| `npm run type-check` | Run TypeScript compiler checks |
| `npm run format` | Format code with Prettier |

---

**Important:** Ensure environment variables are configured in your deployment platform:

- `VITE_API_URL` - Backend API endpoint

---

##  Mock API (MSW)

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
| Approval | `src/mocks/handlers/approval.ts` | 🔶 Phase 2 stub |
| Dispute | `src/mocks/handlers/dispute.ts` | 🔶 Phase 2 stub |
| Notifications | `src/mocks/handlers/notify.ts` | 🔶 Phase 2 stub |

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
- Authentication tokens are stored securely (HttpOnly cookies)

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
- Ensure `npm run type-check` passes
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
