# FinTrack Pro

A full-stack personal finance dashboard built with Next.js 14, featuring real authentication, interactive charts, budget tracking, and financial goals.

## 🔗 Live Demo

https://fintrack-pro-nu.vercel.app/login

**Demo credentials:**
- Email: `demo@fintrack.dev`
- Password: `Demo@123`

## Quick Start

```bash
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/dashboard` after login.

**Demo credentials:** `demo@fintrack.dev` / `Demo@123`

## Environment Variables

Create a `.env` file in the project root (never commit it — it's in `.gitignore`):

```env
DATABASE_URL="your_postgresql_url_here"   # PostgreSQL — Neon.tech recommended
JWT_SECRET="your_long_random_string_here" # Any long random string
```

See `.env.example` for a reference template. For a free PostgreSQL database, create a project at [neon.tech](https://neon.tech) and paste the connection string as `DATABASE_URL`.

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack in one repo, RSC, built-in routing |
| Database | PostgreSQL via Prisma 6 | Hosted on Neon.tech, production-ready, easy to seed |
| Auth | JWT + httpOnly cookies | No external service dependency, full control |
| UI | Tailwind CSS + shadcn/ui | Rapid component assembly, accessible by default |
| Charts | Recharts | Composable, works well with React state |
| Validation | Zod | Shared schemas between frontend and backend |
| Forms | react-hook-form | Performant, integrates cleanly with Zod |

## Architecture

```
app/
  (auth)/           Login and register pages (no sidebar layout)
  (dashboard)/      All protected pages with sidebar
  api/              REST API routes — HTTP only, no business logic
components/
  charts/           Recharts wrappers (CashflowChart, CategoryDonutChart)
  ui/               shadcn/ui base components
lib/
  auth.ts           JWT sign/verify/decode + cookie helpers
  prisma.ts         Prisma client singleton
  validators/       Zod schemas shared between API routes and forms
services/           Business logic separated from HTTP handlers
prisma/
  schema.prisma     Database schema
  seed.ts           Realistic 6-month seed data
middleware.ts       Route protection — redirects unauthenticated users
```

## Key Technical Decisions

**JWT over NextAuth** — Full control over the token lifecycle, simpler setup, no external provider dependencies.

**Cents over floats** — All monetary values stored as integers (cents). Avoids IEEE 754 floating-point rounding errors in financial calculations.

**Service layer pattern** — API routes handle HTTP concerns (parsing, status codes). Services handle business logic (balance updates, budget overlap validation). Easier to test and reason about independently.

**Prisma 6 over Prisma 7** — Prisma 7 requires driver adapters for local SQLite which adds operational complexity. Prisma 6 has stable, zero-config SQLite support.

**SQLite for development** — No Docker, no connection strings, no external DB. The seed script creates a realistic 6-month dataset in seconds.

## Pages

| Route | Description |
|---|---|
| `/dashboard` | KPI cards, cash flow chart, expenses by category, budget alerts, goals |
| `/transactions` | Paginated table with filters, add/edit/delete, CSV export |
| `/accounts` | Account cards with balance, add/archive |
| `/budgets` | Budget progress bars with color-coded alerts |
| `/goals` | Goal progress tracking with contribution modal |
| `/analytics` | Monthly income vs expenses line chart, category breakdown |
| `/settings` | Profile update, password change, category management, account deletion |

## Seed Data

The seed creates:
- 1 user: `demo@fintrack.dev` / `Demo@123`
- 3 accounts: Main Checking ($4,200), Savings ($12,500), Credit Card (-$850)
- 10 default categories
- 5 budgets (Food, Transport, Entertainment, Shopping, Health)
- 3 goals: Emergency Fund (60%), Vacation (30%), New Laptop (90%)
- 134 transactions across 6 months with realistic spending patterns
