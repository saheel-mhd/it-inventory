# CustodyHub

IT asset / inventory management system. Tracks products, assigns them to staff, records services and damage, captures audit logs, and supports Excel import/export.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Prisma 7 · PostgreSQL · Tailwind CSS 4

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or run via the provided `docker-compose.yml`)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum, set DATABASE_URL.

# 3. Apply database schema
npx prisma migrate deploy
npx prisma generate

# 4. Seed reference data (categories, asset types, departments, warranty periods)
npm run seed

# 5. Create your first admin user
node create-user.js admin <your-password>

# 6. Run the dev server
npm run dev
```

Open <http://localhost:3000> and log in with `admin` / `<your-password>`.

## Project layout

```
app/
  (dashboard)/    # Authenticated app pages: dashboard, inventory, reports, users, settings
  api/            # REST routes (login, products, staff, import, export, etc.)
  components/     # Shared client components
  login/          # Login page
lib/              # prisma client, app branding, import/export helpers, utils
prisma/
  schema.prisma   # Database schema (User, Product, Staff, StaffInventory, ProductService, AuditLog, ...)
  migrations/     # SQL migrations
  seed.js         # Reference-data seed
scripts/
  clear-data.js          # Dev-only: wipe Product/Staff/StaffInventory tables
  debug-create-product.js # Dev-only: smoke-test product create/delete
server/
  auth/           # Session helpers (cookie-based)
  controllers/    # Route handlers grouped by domain
  middleware/     # withApiSession, JSON helpers
  services/       # Audit log, import pipeline, export pipeline
```

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server with HMR |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run seed` | Insert reference data |
| `npx prisma studio` | Browse the database in a UI |
| `npx prisma migrate dev` | Create + apply a new migration |
| `npx prisma migrate deploy` | Apply pending migrations (production-safe) |

## Health check

`GET /api/health` returns `{ ok: true, db: "up" }` when the DB is reachable, `503` otherwise. Wire it up to your uptime monitor.

## Bootstrapping a fresh admin

If everyone is locked out, run `node create-user.js <username> <password>` from a shell with `DATABASE_URL` set. The script upserts on `name`, so re-running it for an existing user resets that user's password.
