export type ProfessionalCategory = 
  | 'web_developer'
  | 'software_engineer'
  | 'ui_ux_designer'
  | 'graphic_artist'
  | 'digital_marketer'
  | 'social_media_consultant'
  | 'content_creator'
  | 'data_analyst'
  | 'mobile_app_developer'
  | 'video_editor'
  | 'photographer'
  | 'business_consultant'
  | 'other';

export const CATEGORY_LABELS: Record<ProfessionalCategory, string> = {
  web_developer: 'Web Developer',
  software_engineer: 'Software Engineer',
  ui_ux_designer: 'UI/UX Designer',
  graphic_artist: 'Graphic Artist',
  digital_marketer: 'Digital Marketer',
  social_media_consultant: 'Social Media Consultant',
  content_creator: 'Content Creator',
  data_analyst: 'Data Analyst',
  mobile_app_developer: 'Mobile App Developer',
  video_editor: 'Video Editor',
  photographer: 'Photographer',
  business_consultant: 'Business Consultant',
  other: 'Other',
};

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  headline: string | null;
  location: string | null;
  availability_status: string | null;
  bio: string | null;
  about: string | null;
  skills: string[] | null;
  time_credits: number;
  response_time_hours: number | null;
  is_verified: boolean;
  profile_visibility: string;
  show_email: boolean;
  show_location: boolean;
  profile_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCategory {
  id: string;
  user_id: string;
  category: ProfessionalCategory;
  custom_category: string | null;
  created_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency_level: number;
  category: ProfessionalCategory | null;
  endorsement_count: number;
  created_at: string;
}

export interface UserTool {
  id: string;
  user_id: string;
  tool_name: string;
  proficiency_level: number;
  created_at: string;
}

export interface WorkExperience {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Education {
  id: string;
  user_id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  grade: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: string;
  user_id: string;
  name: string;
  issuing_organization: string;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  created_at: string;
}

export interface UserLanguage {
  id: string;
  user_id: string;
  language: string;
  proficiency: string;
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  project_url: string | null;
  image_url: string | null;
  media_type: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  contract_id: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Endorsement {
  id: string;
  endorser_id: string;
  skill_id: string;
  created_at: string;
  endorser?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Recommendation {
  id: string;
  recommender_id: string;
  recommendee_id: string;
  relationship: string | null;
  content: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  recommender?: {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
}

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface ProfileMetrics {
  servicesOffered: number;
  servicesRequested: number;
  completedContracts: number;
  averageRating: number;
  totalReviews: number;
  followersCount: number;
  followingCount: number;
}
