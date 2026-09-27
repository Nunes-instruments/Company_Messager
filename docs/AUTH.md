# Nunes Connect Staff Authentication

## Roles

### ADMIN
- Full staff workspace access
- Create / disable staff users
- Change staff roles
- Reset staff passwords
- Create and execute campaigns
- Generate customer portal links
- Access operational modules

### MANAGER
- Operational access
- Create and execute campaigns
- Generate customer portal links
- Customer / lead / service / calibration workflows
- Cannot manage staff accounts

### STAFF
- Customer messaging
- Customer records
- Leads and follow-up
- Service and calibration workflows
- Cannot create/execute campaigns through protected APIs
- Cannot manage staff accounts
- Cannot generate secure customer portal links

## Required environment variables

- DATABASE_URL
- AUTH_SECRET
- ADMIN_ACTION_SECRET

AUTH_SECRET must be a long random value, ideally 32+ characters.

ADMIN_ACTION_SECRET is only used for the one-time initial Admin setup.
After an Admin password is configured, the bootstrap endpoint refuses further setup attempts.

## First-time setup

1. Configure the environment variables.
2. Open /setup-admin.
3. Enter ADMIN_ACTION_SECRET.
4. Choose the Owner/Admin email and password.
5. Open /login.
6. Sign in.
7. Admin can then create Manager and Staff accounts from /staff.

## Session behavior

- Staff sessions are stored in PostgreSQL.
- Browser receives an HttpOnly signed session cookie.
- Session lifetime: 12 hours.
- Disabled users cannot authenticate.
- Password reset or disabling an account invalidates that user's existing sessions.
- Login/logout/staff changes are audit logged.
