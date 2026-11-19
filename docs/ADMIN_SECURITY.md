# Administrator security

## Seed accounts

`npm run db:seed` creates four accounts on a fresh database. Their names come
from `ADMIN_USERNAME`, `TOURISM_ADMIN_USERNAME`, `EDITOR_USERNAME` and
`DATA_OFFICER_USERNAME`; each password must come from the matching
`*_PASSWORD` variable.

In production (or any `NODE_ENV=production` run) an account is **not created**
when its password variable is missing, shorter than 12 characters, or still a
published placeholder. The build log names the variable that needs a value.
Development and test use fixed, documented passwords for convenience.

The fixed passwords that older deployments used are public. They are rejected
by the login endpoint in production and cannot be chosen for a new account.

## Rotating an existing password

Rotate every account that used a setup password before deploying this change.
Run the command against the production database, not a local PGlite database:

```bash
# DATABASE_URL must point at Neon
DATABASE_URL='postgresql://…' \
  npm run admin:rotate -- cedo_superadmin --password-stdin
# paste the new password when prompted, or:
read -s -p "New password: " PW
printf '%s' "$PW" | DATABASE_URL='postgresql://…' \
  npm run admin:rotate -- cedo_superadmin --password-stdin
```

The script refuses passwords shorter than 12 characters and the published setup
passwords, never echoes the password, and only touches an existing account.
Use `--local` to target the development PGlite database.

Signed-in staff can change their own password from **Staff console → Password &
security**. The same form also appears under **Users, logs & privacy** for
governance users. The endpoint requires the current password and rate-limits
attempts.

## Production environment checklist

| Variable | Required | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | yes | 32+ random characters; rotating it signs everyone out |
| `ADMIN_PASSWORD` | fresh DB only | 12+ characters |
| `TOURISM_ADMIN_PASSWORD` | fresh DB only | 12+ characters |
| `EDITOR_PASSWORD` | fresh DB only | 12+ characters |
| `DATA_OFFICER_PASSWORD` | fresh DB only | 12+ characters |
| `NEXT_PUBLIC_SITE_URL` | optional | Canonical origin; defaults to the Vercel production URL |

The login endpoint and password-change endpoint are rate-limited in memory per
instance. Put a durable limiter (Vercel Firewall or an edge KV counter) in front
of `/api/admin/auth/*` if the console is exposed to the public internet.
