-- Drop existing permissive policies on profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new visibility-aware policy for profiles
-- Public: visible to everyone
-- Members: visible only to authenticated users
-- Private: visible only to the profile owner
CREATE POLICY "Profiles visible based on privacy settings"
ON public.profiles
FOR SELECT
USING (
  -- Owner can always see their own profile
  auth.uid() = user_id
  OR (
    -- Public profiles are visible to everyone
    profile_visibility = 'public'
  )
  OR (
    -- Members-only profiles are visible to authenticated users
    profile_visibility = 'members' AND auth.uid() IS NOT NULL
  )
  -- Private profiles are only visible to owner (handled by first condition)
);

-- Drop existing permissive policy on portfolio_items
DROP POLICY IF EXISTS "Anyone can view portfolio items" ON public.portfolio_items;

-- Create new visibility-aware policy for portfolio_items
-- Portfolio visibility follows the profile's privacy settings
CREATE POLICY "Portfolio visible based on profile privacy settings"
ON public.portfolio_items
FOR SELECT
USING (
  -- Owner can always see their own portfolio
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = portfolio_items.user_id
    AND (
      -- Public profiles: portfolio visible to everyone
      p.profile_visibility = 'public'
      OR (
        -- Members-only profiles: portfolio visible to authenticated users
        p.profile_visibility = 'members' AND auth.uid() IS NOT NULL
      )
      -- Private profiles: portfolio not visible (owner case handled above)
    )
  )
);