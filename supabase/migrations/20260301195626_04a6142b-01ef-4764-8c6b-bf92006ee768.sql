
-- Add is_suspended column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Admin can view all profiles (including private ones)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any profile (edit details, suspend)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any profile
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all services (including inactive)
CREATE POLICY "Admins can view all services"
ON public.services FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any service (approve/reject/deactivate)
CREATE POLICY "Admins can update any service"
ON public.services FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete any service
CREATE POLICY "Admins can delete any service"
ON public.services FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.reviews FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete fake/inappropriate reviews
CREATE POLICY "Admins can delete any review"
ON public.reviews FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any review (moderate)
CREATE POLICY "Admins can update any review"
ON public.reviews FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any contract (manage status)
CREATE POLICY "Admins can update any contract"
ON public.contracts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete contracts
CREATE POLICY "Admins can delete any contract"
ON public.contracts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all messages for moderation
CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
