import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  reviewerId: string;
  revieweeId: string;
  revieweeName: string;
  onComplete: () => void;
}

export const ReviewDialog = ({
  open,
  onOpenChange,
  contractId,
  reviewerId,
  revieweeId,
  revieweeName,
  onComplete,
}: ReviewDialogProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) {
      toast({ title: 'Error', description: 'Please select a rating', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      contract_id: contractId,
      rating,
      title: title || null,
      content: content || null,
    });

    setIsSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already reviewed', description: 'You have already left a review for this contract' });
      } else {
        toast({ title: 'Error', description: 'Failed to submit review', variant: 'destructive' });
      }
      return;
    }

    toast({ title: 'Thank you!', description: 'Your review has been submitted' });
    onOpenChange(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a Review for {revieweeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Star Rating */}
          <div>
            <Label className="mb-2 block">Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-gold fill-gold'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="review-title">Title (optional)</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="review-content">Your Review (optional)</Label>
            <Textarea
              id="review-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share details about your experience..."
              rows={4}
            />
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
