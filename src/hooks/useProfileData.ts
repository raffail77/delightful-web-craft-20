import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { 
  Profile, 
  UserCategory, 
  UserSkill, 
  UserTool, 
  WorkExperience, 
  Education, 
  Certification, 
  UserLanguage, 
  PortfolioItem, 
  Review, 
  Recommendation, 
  ProfileMetrics,
  ProfessionalCategory
} from '@/types/profile';

export const useProfileData = (userId: string | undefined, isOwnProfile: boolean = false) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [tools, setTools] = useState<UserTool[]>([]);
  const [experience, setExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [languages, setLanguages] = useState<UserLanguage[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('profiles_public')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      const profileData: any = { ...data };
      // For non-owner profiles, the view already masks sensitive fields server-side.
      // Add client-side defaults for fields the view doesn't include.
      if (!isOwnProfile) {
        profileData.show_email = false;
        profileData.show_location = true;
        profileData.is_suspended = null;
        profileData.last_free_credits_at = null;
      }
      setProfile(profileData as Profile);
    }
  }, [userId, isOwnProfile]);

  const fetchCategories = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('user_categories')
      .select('*')
      .eq('user_id', userId);

    if (data) setCategories(data as UserCategory[]);
  }, [userId]);

  const fetchSkills = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId)
      .order('endorsement_count', { ascending: false });

    if (data) setSkills(data as UserSkill[]);
  }, [userId]);

  const fetchTools = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('user_tools')
      .select('*')
      .eq('user_id', userId);

    if (data) setTools(data as UserTool[]);
  }, [userId]);

  const fetchExperience = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('work_experience')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (data) setExperience(data as WorkExperience[]);
  }, [userId]);

  const fetchEducation = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('education')
      .select('*')
      .eq('user_id', userId)
      .order('end_date', { ascending: false, nullsFirst: true });

    if (data) setEducation(data as Education[]);
  }, [userId]);

  const fetchCertifications = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('certifications')
      .select('*')
      .eq('user_id', userId)
      .order('issue_date', { ascending: false });

    if (data) setCertifications(data as Certification[]);
  }, [userId]);

  const fetchLanguages = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('user_languages')
      .select('*')
      .eq('user_id', userId);

    if (data) setLanguages(data as UserLanguage[]);
  }, [userId]);

  const fetchPortfolio = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setPortfolio(data as PortfolioItem[]);
  }, [userId]);

  const fetchReviews = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch reviewer profiles
      const reviewerIds = data.map((r: any) => r.reviewer_id);
      const { data: reviewerProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', reviewerIds);

      const reviewsWithReviewers = data.map((review: any) => ({
        ...review,
        reviewer: reviewerProfiles?.find((p: any) => p.user_id === review.reviewer_id),
      }));

      setReviews(reviewsWithReviewers as Review[]);
    }
  }, [userId]);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('recommendations')
      .select('*')
      .eq('recommendee_id', userId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (data) {
      const recommenderIds = data.map((r: any) => r.recommender_id);
      const { data: recommenderProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, headline')
        .in('user_id', recommenderIds);

      const recsWithRecommenders = data.map((rec: any) => ({
        ...rec,
        recommender: recommenderProfiles?.find((p: any) => p.user_id === rec.recommender_id),
      }));

      setRecommendations(recsWithRecommenders as Recommendation[]);
    }
  }, [userId]);

  const fetchMetrics = useCallback(async () => {
    if (!userId) return;

    const [
      { count: servicesOffered },
      { count: servicesRequested },
      { count: completedContracts },
      { data: reviewsData },
      { count: followersCount },
      { count: followingCount },
    ] = await Promise.all([
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('service_type', 'offer'),
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('service_type', 'request'),
      supabase.from('contracts').select('*', { count: 'exact', head: true }).or(`provider_id.eq.${userId},client_id.eq.${userId}`).eq('status', 'completed'),
      supabase.from('reviews').select('rating').eq('reviewee_id', userId),
      supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);

    const totalReviews = reviewsData?.length || 0;
    const averageRating = totalReviews > 0 
      ? reviewsData!.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;

    setMetrics({
      servicesOffered: servicesOffered || 0,
      servicesRequested: servicesRequested || 0,
      completedContracts: completedContracts || 0,
      averageRating,
      totalReviews,
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
    });
  }, [userId]);

  const checkFollowing = useCallback(async (currentUserId: string) => {
    if (!userId || !currentUserId || userId === currentUserId) return;

    const { data } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .maybeSingle();

    setIsFollowing(!!data);
  }, [userId]);

  const toggleFollow = async (currentUserId: string) => {
    if (!userId || !currentUserId) return;

    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', userId);
    } else {
      await supabase
        .from('followers')
        .insert({ follower_id: currentUserId, following_id: userId });
    }

    setIsFollowing(!isFollowing);
    fetchMetrics();
  };

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchProfile(),
      fetchCategories(),
      fetchSkills(),
      fetchTools(),
      fetchExperience(),
      fetchEducation(),
      fetchCertifications(),
      fetchLanguages(),
      fetchPortfolio(),
      fetchReviews(),
      fetchRecommendations(),
      fetchMetrics(),
    ]);
    setIsLoading(false);
  }, [
    fetchProfile, fetchCategories, fetchSkills, fetchTools, 
    fetchExperience, fetchEducation, fetchCertifications, 
    fetchLanguages, fetchPortfolio, fetchReviews, 
    fetchRecommendations, fetchMetrics
  ]);

  useEffect(() => {
    if (userId) {
      refreshAll();
    }
  }, [userId, refreshAll]);

  return {
    profile,
    categories,
    skills,
    tools,
    experience,
    education,
    certifications,
    languages,
    portfolio,
    reviews,
    recommendations,
    metrics,
    isLoading,
    isFollowing,
    toggleFollow,
    checkFollowing,
    refreshAll,
    refetch: {
      profile: fetchProfile,
      categories: fetchCategories,
      skills: fetchSkills,
      tools: fetchTools,
      experience: fetchExperience,
      education: fetchEducation,
      certifications: fetchCertifications,
      languages: fetchLanguages,
      portfolio: fetchPortfolio,
      reviews: fetchReviews,
      recommendations: fetchRecommendations,
      metrics: fetchMetrics,
    },
  };
};
