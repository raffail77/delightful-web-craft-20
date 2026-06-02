-- Enumerated types used across the schema.
-- Wrap each in a guarded block so re-runs on an existing DB don't fail.

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.contract_status AS ENUM (
    'proposed', 'pending_payment', 'accepted', 'in_progress',
    'completed', 'disputed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('credits', 'stripe', 'both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.professional_category AS ENUM (
    'web_developer', 'software_engineer', 'ui_ux_designer', 'graphic_artist',
    'digital_marketer', 'social_media_consultant', 'content_creator',
    'data_analyst', 'mobile_app_developer', 'video_editor', 'photographer',
    'business_consultant', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.service_type AS ENUM ('offer', 'request');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'cancelled', 'disputed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM ('service_payment', 'refund', 'bonus', 'adjustment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
