import React, { useState } from 'react';
import { Star, MessageSquare, X } from 'lucide-react';
import {
  useTicketSatisfactionRating,
  useCreateSatisfactionRating,
  useUpdateSatisfactionRating,
  TicketSatisfactionRatingDto,
  CreateTicketSatisfactionRatingDto,
  UpdateTicketSatisfactionRatingDto
} from '../../services/ticketEnhancementsApi';

interface SatisfactionRatingWidgetProps {
  ticketId: number;
  ticketStatus?: string;
  readOnly?: boolean;
}

export function SatisfactionRatingWidget({ ticketId, ticketStatus, readOnly = false }: SatisfactionRatingWidgetProps) {
  const { data: rating, isLoading } = useTicketSatisfactionRating(ticketId);
  const createMutation = useCreateSatisfactionRating();
  const updateMutation = useUpdateSatisfactionRating();

  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(rating?.rating || 0);
  const [comment, setComment] = useState(rating?.comment || '');
  const [hoveredRating, setHoveredRating] = useState(0);

  // Only show rating widget for closed/resolved tickets
  const isResolved = ticketStatus?.toLowerCase() === 'closed' || ticketStatus?.toLowerCase() === 'resolved';

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  // Don't show if ticket is not resolved and no rating exists
  if (!isResolved && !rating) {
    return null;
  }

  const handleSubmit = async () => {
    if (selectedRating === 0) return;

    if (rating) {
      await updateMutation.mutateAsync({
        id: rating.id,
        data: {
          rating: selectedRating,
          comment: comment || undefined,
        },
      });
    } else {
      await createMutation.mutateAsync({
        ticketId,
        rating: selectedRating,
        comment: comment || undefined,
      });
    }
    setShowRatingForm(false);
  };

  const getRatingLabel = (value: number): string => {
    switch (value) {
      case 1: return 'Very Dissatisfied';
      case 2: return 'Dissatisfied';
      case 3: return 'Neutral';
      case 4: return 'Satisfied';
      case 5: return 'Very Satisfied';
      default: return 'Rate your experience';
    }
  };

  const getRatingColor = (value: number): string => {
    switch (value) {
      case 1: return 'text-gray-500';
      case 2: return 'text-orange-500';
      case 3: return 'text-yellow-500';
      case 4: return 'text-lime-500';
      case 5: return 'text-green-500';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Star className="h-4 w-4" />
          Satisfaction Rating
        </h3>
      </div>

      <div className="p-4">
        {rating && !showRatingForm ? (
          <div className="text-center">
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 ${
                    star <= rating.rating
                      ? `${getRatingColor(rating.rating)} fill-current`
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className={`text-sm font-medium ${getRatingColor(rating.rating)}`}>
              {getRatingLabel(rating.rating)}
            </p>
            {rating.comment && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600 text-left">{rating.comment}</p>
                </div>
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              Rated by {rating.userName} on {new Date(rating.ratedAt).toLocaleDateString()}
            </div>
            {!readOnly && (
              <button
                onClick={() => {
                  setSelectedRating(rating.rating);
                  setComment(rating.comment || '');
                  setShowRatingForm(true);
                }}
                className="mt-3 text-sm text-gray-600 hover:text-gray-700"
              >
                Update Rating
              </button>
            )}
          </div>
        ) : showRatingForm || (!rating && isResolved && !readOnly) ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-3">How satisfied are you with the resolution?</p>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setSelectedRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= (hoveredRating || selectedRating)
                          ? `${getRatingColor(hoveredRating || selectedRating)} fill-current`
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className={`text-sm font-medium ${getRatingColor(hoveredRating || selectedRating)}`}>
                {getRatingLabel(hoveredRating || selectedRating)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Tell us more about your experience..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              {showRatingForm && (
                <button
                  type="button"
                  onClick={() => setShowRatingForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={selectedRating === 0 || createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Rating will be available after ticket resolution
          </p>
        )}
      </div>
    </div>
  );
}

// Compact inline version for ticket lists
export function SatisfactionRatingBadge({ rating }: { rating: number }) {
  const getRatingColor = (value: number): string => {
    if (value >= 4) return 'bg-green-100 text-green-700';
    if (value >= 3) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-gray-700';
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getRatingColor(rating)}`}>
      <Star className="h-3 w-3 fill-current" />
      {rating}/5
    </span>
  );
}

export default SatisfactionRatingWidget;
