CREATE TYPE public.contract_status AS ENUM (
  'proposed',
  'pending_payment',
  'accepted',
  'in_progress',
  'completed',
  'disputed',
  'cancelled'
);
