[//]: # (E2E Test Coverage: A17. Add E2E test: approval rejection path)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg)](https://vitejs.dev/)

# PetAd Frontend 🐾

<!-- close #C15 -->
<!-- Note: A13. Add sort-by-date and sort-by-status controls to Approval list documentation reference placeholder -->
<!-- Updated toast/snackbar support for high-priority live notifications (close #C10) -->
<!-- Note: ApprovalListPage integrated with useApprovalList and filters (close #8) -->
<!-- Added useRejectRequest mutation hook implementation notes (close #A7) -->
<!-- Added ApprovalCard component support (close #A9) -->

A modern, responsive web application for pet adoption and temporary custody management, powered by blockchain-backed trust guarantees (Stellar trust layer integration).

***
## Overview

PetAd Frontend is the client-side application for the PetAd platform, enabling users to browse pets, initiate adoption processes, and manage temporary custody arrangements. The application communicates exclusively with the PetAd backend API and does not directly interact with blockchain infrastructure.

<!-- close #B4 -->
Note: Includes REST fallback and backfill paths for notifications via `notificationService.ts` to support offline usage and initial loading.

***

## ✨ Features

- **🔍 Pet Browsing & Search** - Discover available pets with advanced filtering
- **❤️ Adoption Workflows** - Streamlined adoption process from inquiry to completion
- **⏰ Temporary Custody** - Request and manage short-term pet care arrangements
- **👤 User Profiles** - Personalized dashboards for pet seekers and caretakers
- **📄 Document Management**
- **📄 Document Manageme
- **📄 Document Manageme
- **📄 Document Management** - Secure upload and verification of required documents
- **🔔 Real-time Updates** - Live status notifications for adoption and custody requests (close #C9)
- **🔔 Real-time Updates** - Live status notifications for adoption and custody requests
- **⚖️ Dispute Management** - Comprehensive tracking and resolution pathways for administrative and user disputes

***

## 🛠️ Tech Stack

| Technology         | Purpose                   |
| ------------
| ------------
| ------------
|
| ------------

***

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
