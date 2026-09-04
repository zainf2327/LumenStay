# LumenStay — Boutique Hospitality PMS & Guest Platform

[![Deploy Backend to EC2](https://github.com/zainf2327/LumenStay/actions/workflows/deploy.yml/badge.svg)](https://github.com/zainf2327/LumenStay/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ed.svg)](https://www.docker.com/)

**LumenStay** is a luxury boutique hotel property management system (PMS), dynamic yield engine, and guest experience portal. Designed with rich editorial aesthetics, role-specific operational dashboards, transactional reservation integrity, and real-time WebSocket room status synchronization.

---

## Key Features

- **Guest Booking & Experience Engine**: Real-time room availability calculation, date-range overlap logic, instant confirmation with BLE mobile key simulation, and interactive digital folios.
- **Role-Based Staff Dashboards**:
  - **Front Desk**: Live arrivals, departures, in-house guests, keycard issuance, and incidental charge posting.
  - **Supervisor**: Suite condition matrix, turnover inspection queue with one-click **Approve** and **Reclean** actions, and attendant shift roster.
  - **Housekeeping & Maintenance**: Room cleaning status progression, defect dispatch, and work order tracking.
  - **Revenue Management**: Algorithmic yield simulation, dynamic rate plan architecture, MLOS restrictions, and OTA parity monitoring.
  - **General Manager & Ownership**: Real-time RevPAR/ADR health, VIP guest CRM profiles, and monthly owner distribution ledgers.
- **Mobile-Responsive UI**: Desktop single-row data tables with automatic mobile/tablet card-based adaptations and auto-expanding hover icon sidebar.
- **Production CI/CD**: Fully automated pipeline deploying backend Docker containers to AWS EC2 via GitHub Actions and GitHub Container Registry (GHCR).

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js (v22), Express, TypeScript, WebSocket (`ws`), Zod |
| **Database** | Supabase (PostgreSQL) / Relational SQLite with transactional locking |
| **DevOps** | Docker, Docker Compose, Nginx Reverse Proxy, GitHub Actions, GHCR |

---

## Project Structure

```
LumenStay/
├── .github/workflows/
│   └── deploy.yml          # Automated CI/CD workflow to AWS EC2
├── client/                 # React (Vite) + TypeScript frontend
│   └── src/
│       ├── components/     # Reusable UI components & navigation
│       ├── context/        # Auth, Theme, Toast, and WebSocket providers
│       ├── features/       # Feature modules (frontdesk, supervisor, revenue, etc.)
│       └── pages/          # Route-level views & role dashboards
├── server/                 # Express + TypeScript backend
│   ├── Dockerfile          # Multi-stage production build (Node 22 Alpine)
│   ├── docker-compose.yml  # Production container definition
│   └── src/
│       ├── controllers/    # Request dispatchers
│       ├── db/             # Schemas, migrations, and Supabase client
│       ├── routes/v1/      # REST API endpoints mounted at /api/v1
│       └── services/       # Business logic (pricing, booking transactions, webhooks)
└── docs/                   # Product requirements, architecture & RFQ documents
```

---

## Getting Started Locally

### Prerequisites
- Node.js 20+ or 22+
- npm 10+

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env     # Configure database & JWT secrets
npm run dev              # Runs on http://localhost:3001
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev              # Runs on http://localhost:5173
```

---

## Production Deployment (AWS EC2)

The backend is automatically tested, built as a Docker container, pushed to GHCR, and deployed to your AWS EC2 instance on every push to `main` targeting `server/**` or `.github/workflows/deploy.yml`.

### Required GitHub Repository Secrets
- `EC2_HOST`: EC2 Public IPv4 address
- `EC2_USER`: SSH user (e.g., `ubuntu`)
- `EC2_SSH_KEY`: Private SSH Key (`.pem` content)
- `GHCR_PAT`: GitHub Personal Access Token (classic) with `read:packages` scope

---

## License
Private / Proprietary — Built for Lumen Hospitality.
