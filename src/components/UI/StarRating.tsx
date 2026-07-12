import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, count, size = 'sm' }: StarRatingProps) {
  const px = size === 'sm' ? 12 : 16;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={px}
            className={i <= Math.round(rating) ? 'text-orange-500 fill-orange-500' : 'text-gray-300 fill-gray-300'}
          />
        ))}
      </div>
      {count !== undefined && <span className="text-gray-500 text-xs">({count})</span>}
    </div>
  );
}
