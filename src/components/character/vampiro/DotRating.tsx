import { cn } from '@/lib/utils';

interface DotRatingProps {
  value: number;
  onChange: (value: number) => void;
  maxValue?: number;
  minValue?: number;
}

export default function DotRating({ 
  value, 
  onChange, 
  maxValue = 10, 
  minValue = 0 
}: DotRatingProps) {
  const handleClick = (index: number) => {
    const clickedValue = index + 1;
    
    // If clicking on current value, toggle down (respecting minValue)
    if (clickedValue === value) {
      onChange(Math.max(minValue, value - 1));
    } else {
      // Otherwise set to clicked position (stack fill)
      onChange(clickedValue);
    }
  };

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
              "w-3.5 h-3.5 rounded-full border-2 transition-all duration-150",
              "hover:scale-110 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1",
              isFilled 
                ? "bg-foreground border-foreground" 
                : "bg-transparent border-muted-foreground/40 hover:border-muted-foreground/60"
            )}
            aria-label={`Set value to ${index + 1}`}
          />
        );
      })}
    </div>
  );
}

