import { useState } from "react";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  size = "md", 
  disabled = false 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const handleStarClick = (starRating: number) => {
    if (!disabled) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (!disabled) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  return (
    <div 
      className="flex gap-1"
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        const isHovered = star <= hoverRating;
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            disabled={disabled}
            className={`transition-all duration-200 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${
              isHovered && !disabled ? 'scale-110' : 'scale-100'
            }`}
            aria-label={`Rate ${star} stars`}
            aria-pressed={isFilled}
          >
            <svg
              className={`${sizeClasses[size]} ${
                isFilled 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-gray-300 fill-gray-300'
              } transition-colors duration-200`}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
