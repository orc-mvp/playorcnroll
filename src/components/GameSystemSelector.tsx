import { Sword, Moon, Dog, Star, PawPrint } from 'lucide-react';
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
  herois_marcados: <Sword className="w-6 h-6" />,
  vampiro_v3: <Moon className="w-6 h-6" />,
  lobisomem_w20: <Dog className="w-6 h-6" />,
  mago_m20: <Star className="w-6 h-6" />,
  metamorfos_w20: <PawPrint className="w-6 h-6" />,
};

export default function GameSystemSelector({
  value,
  onChange,
  disabled = false,
  allowUnavailable = false,
}: GameSystemSelectorProps) {
  const { language } = useI18n();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
              'relative flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left',
              isSelected
                ? system.color === 'primary'
                  ? 'border-primary bg-primary/10'
                  : system.color === 'emerald'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : system.color === 'purple'
                  ? 'border-purple-500 bg-purple-500/10'
                  : system.color === 'amber'
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-red-500 bg-red-500/10'
                : 'border-border bg-card hover:border-muted-foreground/50',
              isDisabled && 'opacity-50 cursor-not-allowed',
              !isDisabled && 'cursor-pointer'
            )}
          >
            {!system.available && (
              <Badge
                variant="secondary"
                className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0"
              >
                {language === 'pt-BR' ? 'Em breve' : 'Soon'}
              </Badge>
            )}

            <div
              className={cn(
                'shrink-0 p-2 rounded-md',
                system.color === 'primary'
                  ? 'bg-primary/20 text-primary'
                  : system.color === 'emerald'
                  ? 'bg-emerald-500/20 text-emerald-500'
                  : system.color === 'purple'
                  ? 'bg-purple-500/20 text-purple-500'
                  : system.color === 'amber'
                  ? 'bg-amber-500/20 text-amber-500'
                  : 'bg-red-500/20 text-red-500'
              )}
            >
              {systemIcons[system.id]}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-medieval text-sm font-semibold leading-tight truncate pr-12">
                {system.name}
              </h3>
              <p className="text-[11px] text-muted-foreground font-body mt-0.5 line-clamp-2">
                {description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
