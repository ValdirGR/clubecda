# Critical Database Safety Rules

## 🚫 STRICT PROHIBITIONS

### 1. NO DATABASE RESETS
- **NEVER** run commands that reset, drop, or purge the database in any environment that isn't explicitly confirmed as "local ephemeral".
- **FORBIDDEN COMMANDS**:
  - `npx prisma db push` (unless `--accept-data-loss` is NOT needed, but even then, assume unsafe)
  - `npx prisma migrate reset`
  - `DROP DATABASE`
  - `TRUNCATE TABLE`

### 2. PRODUCTION PROTECTION
- Treat **ALL** connected databases as PRODUCTION unless proven otherwise (e.g., localhost with no critical data).
- The current environment (servidor Engeplus) is **PRODUCTION**.

## ✅ MANDATORY PROCEDURES

### 1. SCHEMA CHANGES
- **ALWAYS** use `npx prisma migrate dev` for local development.
- **ALWAYS** use `npx prisma migrate deploy` for production updates.
- If a migration fails or requires data loss:
  1. **STOP** immediately.
  2. **REPORT** the specific conflict to the user.
  3. **PROPOSE** a manual SQL `ALTER TABLE` script as a safe alternative.
  4. **WAIT** for explicit user permission.

### 2. DATA RECOVERY
- If a schema mismatch occurs (like missing columns):
  - **DO NOT** reset the database to fix it.
  - Create a "safe repair script" using raw SQL (`ALTER TABLE ADD COLUMN ...`) to patch the schema non-destructively.

## 🛑 EMERGENCY PROTOCOL
- If a destructive command is suggested by a tool or output: **REJECT IT**.
- Reply: "I cannot execute this command because it risks data loss in production. I will look for a non-destructive alternative."
