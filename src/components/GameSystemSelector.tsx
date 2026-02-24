import { Sword, Moon, Dog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { GAME_SYSTEMS, GameSystemId } from '@/lib/gameSystems';
import { Badge } from '@/components/ui/badge';

interface GameSystemSelectorProps {
  value: GameSystemId | null;
  onChange: (value: GameSystemId) => void;
  disabled?: boolean;
  allowUnavailable?: boolean;
}

const systemIcons: Record<GameSystemId, React.ReactNode> = {
  herois_marcados: <Sword className="w-8 h-8" />,
  vampiro_v3: <Moon className="w-8 h-8" />,
  lobisomem_w20: <Dog className="w-8 h-8" />,
};

export default function GameSystemSelector({
  value,
  onChange,
  disabled = false,
  allowUnavailable = false,
}: GameSystemSelectorProps) {
  const { language } = useI18n();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {GAME_SYSTEMS.map((system) => {
        const isSelected = value === system.id;
        const isDisabled = disabled || (!allowUnavailable && !system.available);
        const description = system.description[language as 'pt-BR' | 'en'] || system.description['pt-BR'];

        return (
          <button
            key={system.id}
            type="button"
            onClick={() => !isDisabled && onChange(system.id)}
            disabled={isDisabled}
            className={cn(
              'relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all text-left',
              isSelected
                ? system.color === 'primary'
                  ? 'border-primary bg-primary/10'
                  : system.color === 'emerald'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-red-500 bg-red-500/10'
                : 'border-border bg-card hover:border-muted-foreground/50',
              isDisabled && 'opacity-50 cursor-not-allowed',
              !isDisabled && 'cursor-pointer'
            )}
          >
            {!system.available && (
              <Badge 
                variant="secondary" 
                className="absolute top-2 right-2 text-xs"
              >
                Em breve
              </Badge>
            )}
            
            <div
              className={cn(
                'p-3 rounded-full',
                system.color === 'primary'
                  ? 'bg-primary/20 text-primary'
                  : system.color === 'emerald'
                  ? 'bg-emerald-500/20 text-emerald-500'
                  : 'bg-red-500/20 text-red-500'
              )}
            >
              {systemIcons[system.id]}
            </div>

            <div className="text-center">
              <h3 className="font-medieval text-lg font-semibold">
                {system.name}
              </h3>
              <p className="text-xs text-muted-foreground font-body mt-1">
                {system.shortName}
              </p>
            </div>

            <p className="text-sm text-muted-foreground font-body text-center">
              {description}
            </p>

            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {system.features.slice(0, 3).map((feature) => (
                <Badge
                  key={feature}
                  variant="outline"
                  className="text-xs"
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
