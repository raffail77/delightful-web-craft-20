-- Update profiles table with LinkedIn-style fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url text,
ADD COLUMN IF NOT EXISTS headline text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available',
ADD COLUMN IF NOT EXISTS about text,
ADD COLUMN IF NOT EXISTS response_time_hours integer,
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'public',
ADD COLUMN IF NOT EXISTS show_email boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_location boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS profile_slug text UNIQUE;

-- Create professional categories enum
CREATE TYPE public.professional_category AS ENUM (
  'web_developer',
  'software_engineer',
  'ui_ux_designer',
  'graphic_artist',
  'digital_marketer',
  'social_media_consultant',
  'content_creator',
  'data_analyst',
  'mobile_app_developer',
  'video_editor',
  'photographer',
  'business_consultant',
  'other'
);

-- User professional categories (many-to-many)
CREATE TABLE public.user_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category professional_category NOT NULL,
  custom_category text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Skills with proficiency levels
CREATE TABLE public.user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  proficiency_level integer DEFAULT 3 CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  category professional_category,
  endorsement_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

-- Tools and technologies
CREATE TABLE public.user_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  proficiency_level integer DEFAULT 3 CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tool_name)
);

-- Work experience
CREATE TABLE public.work_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Education
CREATE TABLE public.education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution text NOT NULL,
  degree text NOT NULL,
  field_of_study text,
  start_date date,
  end_date date,
  grade text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Certifications
CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuing_organization text NOT NULL,
  issue_date date,
  expiry_date date,
  credential_id text,
  credential_url text,
  created_at timestamptz DEFAULT now()
);

-- Languages
CREATE TABLE public.user_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL,
  proficiency text NOT NULL DEFAULT 'conversational',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, language)
);

-- Portfolio items
CREATE TABLE public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  project_url text,
  image_url text,
  media_type text DEFAULT 'image',
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reviews/Ratings
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(reviewer_id, contract_id)
);

-- Endorsements (for skills)
CREATE TABLE public.endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.user_skills(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(endorser_id, skill_id)
);

-- Recommendations (text recommendations from other users)
CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship text,
  content text NOT NULL,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Followers
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_categories
CREATE POLICY "Anyone can view user categories" ON public.user_categories FOR SELECT USING (true);
CREATE POLICY "Users can manage their own categories" ON public.user_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON public.user_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON public.user_categories FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_skills
CREATE POLICY "Anyone can view user skills" ON public.user_skills FOR SELECT USING (true);
CREATE POLICY "Users can manage their own skills" ON public.user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own skills" ON public.user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own skills" ON public.user_skills FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_tools
CREATE POLICY "Anyone can view user tools" ON public.user_tools FOR SELECT USING (true);
CREATE POLICY "Users can manage their own tools" ON public.user_tools FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tools" ON public.user_tools FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tools" ON public.user_tools FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for work_experience
CREATE POLICY "Anyone can view work experience" ON public.work_experience FOR SELECT USING (true);
CREATE POLICY "Users can manage their own experience" ON public.work_experience FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own experience" ON public.work_experience FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own experience" ON public.work_experience FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for education
CREATE POLICY "Anyone can view education" ON public.education FOR SELECT USING (true);
CREATE POLICY "Users can manage their own education" ON public.education FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own education" ON public.education FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own education" ON public.education FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for certifications
CREATE POLICY "Anyone can view certifications" ON public.certifications FOR SELECT USING (true);
CREATE POLICY "Users can manage their own certifications" ON public.certifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own certifications" ON public.certifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own certifications" ON public.certifications FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_languages
CREATE POLICY "Anyone can view languages" ON public.user_languages FOR SELECT USING (true);
CREATE POLICY "Users can manage their own languages" ON public.user_languages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own languages" ON public.user_languages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own languages" ON public.user_languages FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for portfolio_items
CREATE POLICY "Anyone can view portfolio items" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Users can manage their own portfolio" ON public.portfolio_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own portfolio" ON public.portfolio_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own portfolio" ON public.portfolio_items FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- RLS Policies for endorsements
CREATE POLICY "Anyone can view endorsements" ON public.endorsements FOR SELECT USING (true);
CREATE POLICY "Users can endorse skills" ON public.endorsements FOR INSERT WITH CHECK (auth.uid() = endorser_id);
CREATE POLICY "Users can remove their endorsements" ON public.endorsements FOR DELETE USING (auth.uid() = endorser_id);

-- RLS Policies for recommendations
CREATE POLICY "Anyone can view visible recommendations" ON public.recommendations FOR SELECT USING (is_visible = true OR auth.uid() = recommendee_id);
CREATE POLICY "Users can give recommendations" ON public.recommendations FOR INSERT WITH CHECK (auth.uid() = recommender_id);
CREATE POLICY "Users can update their given recommendations" ON public.recommendations FOR UPDATE USING (auth.uid() = recommender_id);
CREATE POLICY "Users can delete their given recommendations" ON public.recommendations FOR DELETE USING (auth.uid() = recommender_id);

-- RLS Policies for followers
CREATE POLICY "Anyone can view followers" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- Create indexes for performance
CREATE INDEX idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX idx_work_experience_user_id ON public.work_experience(user_id);
CREATE INDEX idx_education_user_id ON public.education(user_id);
CREATE INDEX idx_portfolio_items_user_id ON public.portfolio_items(user_id);
CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX idx_followers_following_id ON public.followers(following_id);
CREATE INDEX idx_profiles_slug ON public.profiles(profile_slug);

-- Function to generate unique profile slug
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  new_slug text;
  counter integer := 0;
BEGIN
  IF NEW.profile_slug IS NULL AND NEW.full_name IS NOT NULL THEN
    base_slug := lower(regexp_replace(NEW.full_name, '[^a-zA-Z0-9]', '-', 'g'));
    new_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM profiles WHERE profile_slug = new_slug AND user_id != NEW.user_id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.profile_slug := new_slug;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate profile slug
CREATE TRIGGER generate_profile_slug_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_profile_slug();

-- Function to update endorsement count
CREATE OR REPLACE FUNCTION public.update_endorsement_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_skills SET endorsement_count = endorsement_count + 1 WHERE id = NEW.skill_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_skills SET endorsement_count = endorsement_count - 1 WHERE id = OLD.skill_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_endorsement_count_trigger
AFTER INSERT OR DELETE ON public.endorsements
FOR EACH ROW
EXECUTE FUNCTION public.update_endorsement_count();