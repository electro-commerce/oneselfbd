# Oneself — Omnichannel E-Commerce Platform Monorepo

A modern, high-performance omnichannel e-commerce platform architected as a **Turborepo + pnpm monorepo**. Consists of a Customer Storefront, an Admin & Operations Dashboard, and an Express/MongoDB Backend API.

---

## 🏛 Architecture Overview

```text
Oneself/
│
├── apps/                                 # Deployable Applications
│   ├── front/                            # Next.js 14 Customer Storefront (Port 3000)
│   ├── dashboard/                        # Next.js 14 Admin & Operations Dashboard (Port 3001)
│   └── server/                           # Express.js & MongoDB Backend REST API (Port 5000)
│
├── packages/                             # Shared Monorepo Packages
│
├── deployment/                           # Production Infrastructure
│   ├── vps/                              # Docker Compose + Caddy with automated Let's Encrypt TLS
│   └── aws/                              # Terraform (VPC, ECS Fargate, ALB, S3, DocumentDB)
│
└── docs/                                 # Platform Documentation & Specifications
    ├── 1.architecture.md                 # System architecture & high-level topology
    ├── 2.repository-structure.md         # Monorepo directory map & conventions
    ├── 3.setup-guide.md                  # Local development setup guide
    ├── 4.deployment-guide.md             # Production VPS & AWS deployment steps
    └── 5.features-and-modules.md         # Platform features, RBAC & integrations
```

---

## ⚡ Tech Stack

- **Monorepo Tooling:** Turborepo `v2.4+`, pnpm `v12.x`, Node.js `24.x`
- **Storefront (`apps/front`):** Next.js 14, React 18, Tailwind CSS, Redux Toolkit, Radix UI
- **Dashboard (`apps/dashboard`):** Next.js 14, React 18, TanStack Table, Tailwind CSS, Redux Toolkit
- **Backend API (`apps/server`):** Node.js, Express.js, TypeScript, MongoDB / Mongoose
- **Logistics & Integrations:** Steadfast, Pathao, Redx, Paperfly, Banglalink SMS, Google Tag Manager (GTM)
- **Quality Gates:** ESLint, Prettier, TypeScript (`tsc --noEmit`)

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js:** `>=20.19.0` (`v24.19.0` recommended)
- **pnpm:** `>=11.0.0`
- **MongoDB:** Running instance on `localhost:27017`

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Run Development Servers
```bash
# Run all applications simultaneously
pnpm dev

# Run individual applications
pnpm dev:front        # Customer Storefront (http://localhost:3000)
pnpm dev:dashboard    # Admin Dashboard (http://localhost:3001)
pnpm dev:server       # Express API (http://localhost:5000)
```

---

## 🛠 Available Root Commands

| Command | Action |
| --- | --- |
| `pnpm dev` | Starts all applications in parallel with Turborepo |
| `pnpm dev:front` | Starts only the Customer Storefront (`apps/front`) |
| `pnpm dev:dashboard` | Starts only the Admin Dashboard (`apps/dashboard`) |
| `pnpm dev:server` | Starts only the Backend API (`apps/server`) |
| `pnpm build` | Builds all applications for production |
| `pnpm lint` | Runs ESLint across all workspace applications |
| `pnpm lint:root` | Runs ESLint on root monorepo files |
| `pnpm lint:all` | Runs lint across all workspace packages and root files |
| `pnpm typecheck` | Validates TypeScript types across all applications |
| `pnpm format` | Formats all source files with Prettier |

---

## 📖 Detailed Documentation

- [1. System Architecture](./docs/1.architecture.md)
- [2. Repository Structure](./docs/2.repository-structure.md)
- [3. Local Setup Guide](./docs/3.setup-guide.md)
- [4. Production Deployment Guide](./docs/4.deployment-guide.md)
- [5. Features & Integrations](./docs/5.features-and-modules.md)
- [Google Tag Manager (GTM) Guide](./GTM_CONTAINER_GUIDE.md)
