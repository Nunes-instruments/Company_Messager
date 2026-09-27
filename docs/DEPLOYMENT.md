# Production Deployment — Nunes Connect

## Current production architecture

GitHub:
- Nunes-instruments/Company_Messager
- Production branch: main

Application:
- Next.js 15
- Prisma ORM

Database:
- Neon PostgreSQL
- Database name: company_messager
- Region: ap-southeast-1
- Stored separately from the Visitor Management application's database.

## Vercel one-time import

1. In Vercel choose **Add New → Project**.
2. Import:
   `Nunes-instruments/Company_Messager`
3. Framework should be auto-detected as **Next.js**.
4. Keep root directory as `./`.
5. Add the environment variable:
   - `DATABASE_URL`
   - value: the Neon connection string for the `company_messager` database.
6. Add:
   - `NEXT_PUBLIC_APP_NAME=Nunes Connect`
   - `NEXT_PUBLIC_COMPANY_NAME=Nunes Instrumentation`
7. Apply DATABASE_URL to Production and Preview.
8. Deploy.

## Verification

After deployment open:

`/api/health`

Expected response:

```json
{
  "ok": true,
  "app": "Nunes Connect",
  "database": "connected"
}
```

Then test:

- `/campaigns`
- `/service`
- `/calibration`

## Continuous deployment

Once Git integration is active:
- GitHub `main` → Production deployment
- future development should use a feature/testing branch before merging to `main`.

## Important

Never commit the Neon connection string or any API secret to GitHub.
