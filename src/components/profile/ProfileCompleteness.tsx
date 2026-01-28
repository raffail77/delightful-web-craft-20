import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';
import type { Profile, UserCategory, UserSkill, WorkExperience, Education, PortfolioItem } from '@/types/profile';

interface ProfileCompletenessProps {
  profile: Profile | null;
  categories: UserCategory[];
  skills: UserSkill[];
  experience: WorkExperience[];
  education: Education[];
  portfolio: PortfolioItem[];
}

interface CompletionItem {
  label: string;
  completed: boolean;
  weight: number;
}

export const ProfileCompleteness = ({
  profile,
  categories,
  skills,
  experience,
  education,
  portfolio,
}: ProfileCompletenessProps) => {
  const items: CompletionItem[] = [
    { label: 'Profile photo', completed: !!profile?.avatar_url, weight: 15 },
    { label: 'Cover image', completed: !!profile?.cover_url, weight: 5 },
    { label: 'Full name', completed: !!profile?.full_name, weight: 10 },
    { label: 'Professional headline', completed: !!profile?.headline, weight: 10 },
    { label: 'About section', completed: !!(profile?.about || profile?.bio), weight: 10 },
    { label: 'Location', completed: !!profile?.location, weight: 5 },
    { label: 'Professional categories', completed: categories.length > 0, weight: 10 },
    { label: 'Skills', completed: skills.length > 0, weight: 10 },
    { label: 'Work experience', completed: experience.length > 0, weight: 10 },
    { label: 'Education', completed: education.length > 0, weight: 5 },
    { label: 'Portfolio items', completed: portfolio.length > 0, weight: 10 },
  ];

  const completedWeight = items
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.weight, 0);

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const percentage = Math.round((completedWeight / totalWeight) * 100);

  const incompleteItems = items.filter((item) => !item.completed);

  if (percentage === 100) {
    return (
      <div className="glass-card p-4 rounded-2xl bg-green-500/5 border-green-500/20">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Profile Complete!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">Profile Strength</span>
        <span className="text-sm font-bold text-gold">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2 mb-3" />
      
      {incompleteItems.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-2">Complete your profile:</p>
          {incompleteItems.slice(0, 3).map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Circle className="w-3 h-3" />
              <span>{item.label}</span>
            </div>
          ))}
          {incompleteItems.length > 3 && (
            <p className="text-xs text-muted-foreground mt-1">
              +{incompleteItems.length - 3} more items
            </p>
          )}
        </div>
      )}
    </div>
  );
};
