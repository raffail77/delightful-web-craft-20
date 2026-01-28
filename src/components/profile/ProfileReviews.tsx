import { Star, Quote } from 'lucide-react';
import type { Review, Recommendation } from '@/types/profile';
import { format } from 'date-fns';

interface ProfileReviewsProps {
  reviews: Review[];
  recommendations: Recommendation[];
}

export const ProfileReviews = ({ reviews, recommendations }: ProfileReviewsProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-gold fill-gold' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Reviews Section */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-xl font-serif font-bold flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-gold" />
          Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">No reviews yet.</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center shrink-0">
                    {review.reviewer?.avatar_url ? (
                      <img
                        src={review.reviewer.avatar_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-navy">
                        {review.reviewer?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {review.reviewer?.full_name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {renderStars(review.rating)}
                    {review.title && (
                      <h4 className="font-medium mt-2">{review.title}</h4>
                    )}
                    {review.content && (
                      <p className="text-sm text-muted-foreground mt-1">{review.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-xl font-serif font-bold flex items-center gap-2 mb-4">
          <Quote className="w-5 h-5 text-gold" />
          Recommendations ({recommendations.length})
        </h2>

        {recommendations.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">No recommendations yet.</p>
        ) : (
          <div className="space-y-6">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center shrink-0">
                    {rec.recommender?.avatar_url ? (
                      <img
                        src={rec.recommender.avatar_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-navy">
                        {rec.recommender?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          {rec.recommender?.full_name || 'Anonymous'}
                        </span>
                        {rec.recommender?.headline && (
                          <p className="text-xs text-muted-foreground">{rec.recommender.headline}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(rec.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {rec.relationship && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {rec.relationship}
                      </p>
                    )}
                    <p className="text-sm mt-2">&ldquo;{rec.content}&rdquo;</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
