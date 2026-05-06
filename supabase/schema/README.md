# Refactored Schema

Clean, organized SQL files generated from the migration history. To set up a fresh Supabase
project, run the files in this order in the SQL editor:

1. `01_enums/` — all custom types (run all files first; required by tables/functions)
2. `02_functions/utility_functions.sql` — `update_updated_at_column`, `has_role`, `handle_new_user`
3. `03_tables/` — each table + its RLS policies (any order, but `profiles` and `user_roles` first
   if you want to be safe)
4. `02_functions/` — remaining business-logic functions (depend on tables existing)
5. `04_triggers/` — triggers wiring functions to tables
6. `05_storage/` — storage buckets and storage policies

The existing `supabase/migrations/` folder is untouched — your live Lovable Cloud DB is unaffected.
This folder is for self-hosting / fresh deployments only.
