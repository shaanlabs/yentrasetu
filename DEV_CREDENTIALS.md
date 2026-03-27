# YantraSetu — Development Credentials

> ⚠️ **For local development only. Do NOT use in production.**

## Admin Account

| Field    | Value              |
|----------|--------------------|
| Phone    | `9000000001`       |
| Password | `admin@123`        |
| Email    | `admin@yantrasetu.dev` |
| Role     | `admin`            |

### How to seed

```bash
cd backend
node src/seed-admin.js
```

This creates (or promotes) the admin user in your local SQLite database.

## Test User Account

Register via `/register` with any phone number, e.g.:

| Field    | Value          |
|----------|----------------|
| Phone    | `9999999999`   |
| Password | `test1234`     |

> OTPs are logged to the backend console in dev mode.
