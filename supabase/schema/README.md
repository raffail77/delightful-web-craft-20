# Database Schema

Hand-maintained, idempotent reference of the **current** production schema.
This is the source you should apply when migrating to a fresh Supabase
project (self-hosted or new cloud project). The numbered files in
`supabase/migrations/` are kept as **history only** — do not replay them on
a fresh project; apply the files in this folder instead.

## Apply order

```
psql "$DATABASE_URL" -f supabase/schema/01_enums.sql
psql "$DATABASE_URL" -f supabase/schema/02_functions.sql
psql "$DATABASE_URL" -f supabase/schema/03_tables/profiles.sql
psql "$DATABASE_URL" -f supabase/schema/03_tables/user_roles.sql
# ...then every other file in 03_tables/ (order inside the folder
# does not matter — there are no cross-table FKs)
psql "$DATABASE_URL" -f supabase/schema/04_views.sql
psql "$DATABASE_URL" -f supabase/schema/05_storage.sql
psql "$DATABASE_URL" -f supabase/schema/06_realtime.sql
```

Or in one shot:

```bash
for f in \
  supabase/schema/01_enums.sql \
  supabase/schema/02_functions.sql \
  supabase/schema/03_tables/*.sql \
  supabase/schema/04_views.sql \
  supabase/schema/05_storage.sql \
  supabase/schema/06_realtime.sql
do
  echo ">> $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

## What's in each folder / file

| Path                              | Contents                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `01_enums.sql`                    | All custom enum types (idempotent via `DO $$ ... EXCEPTION WHEN duplicate_object`).                 |
| `02_functions.sql`                | Every `public.*` function — triggers helpers, RPCs, `has_role`, `handle_new_user`, etc.             |
| `03_tables/<table>.sql`           | One file per table: `CREATE TABLE`, indexes, `GRANT`s, `ENABLE RLS`, `CREATE POLICY`, triggers.     |
| `04_views.sql`                    | `profiles_public` (intentionally `SECURITY DEFINER` to mask PII).                                   |
| `05_storage.sql`                  | Storage buckets and `storage.objects` policies.                                                     |
| `06_realtime.sql`                 | Publication membership + `realtime.messages` RLS for per-user channel scoping.                      |

## Conventions used here

- **No `ALTER TABLE ... ADD COLUMN`**. Each table file is the full,
  current definition.
- **Every `CREATE TABLE`** is immediately followed by `GRANT`s, then
  `ENABLE ROW LEVEL SECURITY`, then `CREATE POLICY` statements.
- `anon` is granted `SELECT` only on tables with a public-read policy.
- `service_role` always has `ALL` (used by edge functions / RPCs).
- `SECURITY DEFINER` functions all `SET search_path = public`.

## Critical invariants

- **`profiles`**: owner-only direct `SELECT`. Cross-user reads must go
  through `profiles_public`.
- **`contracts`**: financial/state columns (`status`, `*_confirmed`,
  `agreed_credits`, `escrow_*`, `provider_id`, `client_id`,
  `payment_method`, `stripe_payment_intent_id`, `transaction_id`,
  `completed_at`) have `UPDATE` privilege **revoked** at the column level
  from `anon` and `authenticated`. All transitions must go through the
  `SECURITY DEFINER` RPCs (`accept_contract_with_escrow`,
  `pay_contract_stripe`, `cancel_contract_with_escrow`,
  `complete_contract`).
- **`messages`**: rate-limited to 10 per minute per sender via
  `check_message_rate_limit` trigger.
- **Realtime**: a user can only subscribe to `messages:<their-uid>` and
  `contracts:<their-uid>` topics.

## Things NOT covered by SQL (configure in Supabase Dashboard)

- Auth providers (email/password, Google OAuth)
- Auth redirect URLs
- Edge function secrets (`STRIPE_SECRET_KEY`, `LOVABLE_API_KEY`, etc.)
- Cron schedule for `daily-free-credits` and `auto_cancel_unpaid_contracts`
- `handle_new_user` trigger on `auth.users` — add via Dashboard:
  `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`
