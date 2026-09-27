# Nunes Connect Backend

## Stack
- Next.js App Router
- PostgreSQL
- Prisma ORM
- Zod validation

## Core data domains
- Staff users and roles
- Customers and communication consent
- Conversations and messages
- Campaigns and recipients
- Instrument wallet
- Service jobs
- Calibration schedules
- Leads
- Channel opt-outs
- Audit logs

## Setup

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL`.
4. Run:

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

## API foundation
- GET /api/health
- GET/POST /api/customers
- GET/POST /api/conversations
- GET/POST /api/messages
- GET/POST /api/leads
- GET /api/dashboard

## Next milestone
- Authentication and staff sessions
- Campaign CRUD + recipient builder
- Calibration reminder scheduler
- Service workflow mutations
- Customer portal APIs
- Email/WhatsApp providers
- Real-time message delivery
