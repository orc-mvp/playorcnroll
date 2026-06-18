import { cn } from '@/lib/utils';

interface DotRatingProps {
  value: number;
  onChange?: (value: number) => void;
  maxValue?: number;
  minValue?: number;
  /** Read-only mode — disables clicks, renders smaller static dots. */
  readOnly?: boolean;
}

export default function DotRating({
  value,
  onChange,
  maxValue = 10,
  minValue = 0,
  readOnly = false,
}: DotRatingProps) {
  const handleClick = (index: number) => {
    if (readOnly || !onChange) return;
    const clickedValue = index + 1;
    if (clickedValue === value) {
      onChange(Math.max(minValue, value - 1));
    } else {
      onChange(clickedValue);
    }
  };

  if (readOnly) {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: maxValue }, (_, index) => (
          <div
            key={index}
            className={cn(
              'w-3 h-3 rounded-full border-2',
              index < value
                ? 'bg-foreground border-foreground'
                : 'bg-transparent border-muted-foreground/40',
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: maxValue }, (_, index) => {
        const isFilled = index < value;
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            className={cn(
              'w-3.5 h-3.5 rounded-full border-2 transition-all duration-150',
              'hover:scale-110 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1',
              isFilled
                ? 'bg-foreground border-foreground'
                : 'bg-transparent border-muted-foreground/40 hover:border-muted-foreground/60',
            )}
            aria-label={`Set value to ${index + 1}`}
          />
        );
      })}
    </div>
  );
}
