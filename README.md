# AthleteOS

Full-stack SaaS MVP for multi-discipline training tracking with strict category-isolated data contexts.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL (Neon)
- ORM: Prisma
- Auth: JWT + bcrypt
- Billing: Stripe Checkout + Webhooks

## Project Structure

- `apps/frontend` - React UI, routing, dashboard, trackers, notes, analytics
- `apps/backend` - Express API, Prisma schema, auth, Stripe, protected routes
- `packages/shared` - reserved for shared packages

## Core Rule Implemented

The selected category drives all tracker, notes, goals, techniques, and analytics requests.

- Category-scoped pages always send `categoryId`
- Backend routes always enforce `userId`
- Records are isolated by both `userId` and `categoryId`

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`
- `GET /api/auth/me`

### Categories

- `GET /api/categories`
- `POST /api/categories`

### Sessions

- `GET /api/sessions`
- `POST /api/sessions`
- `PUT /api/sessions/:id`
- `DELETE /api/sessions/:id`

### Techniques

- `GET /api/techniques`
- `GET /api/techniques/progression`
- `POST /api/techniques`

### Notes

- `GET /api/notes`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

### Goals

- `GET /api/goals`
- `POST /api/goals`
- `PUT /api/goals/:id`

### Dashboard / Analytics

- `GET /api/dashboard`
- `GET /api/analytics`

### Subscription / Billing

- `GET /api/subscription`
- `POST /api/billing/create-checkout-session`
- `POST /api/webhooks/stripe`

## Setup

1. Install dependencies

```bash
npm install
cd apps/backend && npm install
cd ../frontend && npm install
```

2. Configure environment files

- Copy `apps/backend/.env.example` to `apps/backend/.env`
- Copy `apps/frontend/.env.example` to `apps/frontend/.env`

3. Prisma + Neon

```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev --name init
```

4. Run app

```bash
# from repo root
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Stripe Webhook (local)

Use Stripe CLI to forward events:

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

Set `STRIPE_WEBHOOK_SECRET` to the generated signing secret.

## Production Notes

- Set secure, long `JWT_SECRET`
- Set strict CORS `FRONTEND_URL`
- Use HTTPS and secure env management
- Run migrations in CI/CD before deployment
- Consider moving token storage to HttpOnly cookies for higher security hardening

## Current MVP Coverage

- Auth, password reset (basic token flow), JWT middleware
- Stripe subscription checkout + webhook status sync
- Premium paywall locks trackers when inactive
- Category-specific sessions, techniques, notes, goals, analytics
- Advanced notes filtering: keyword, tag, category, date, pinned
- Dashboard with streak, weekly count, subscription status
- Dark mode, responsive SaaS UI, mobile-first layouts
