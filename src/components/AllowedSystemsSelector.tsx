import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { getAllAdapters } from '@/lib/storyteller/systemRegistry';
import type { StorytellerSystemId } from '@/lib/storyteller/types';

/**
 * Seletor de quais sistemas WoD são aceitos numa sessão Storyteller.
 *
 * Cada sistema disponível no `systemRegistry` (Vampiro, Lobisomem, e futuros
 * Mago/Metamorfos quando ficarem `available: true`) aparece como um cartão
 * clicável. Sistemas indisponíveis (ainda em desenvolvimento) aparecem
 * desabilitados com badge "Em breve" para sinalizar a roadmap.
 *
 * O valor é um array de IDs (`StorytellerSystemId[]`) que será gravado em
 * `sessions.allowed_systems` e usado por `filterCompatibleCharacters` no
 * lobby para restringir a lista de personagens disponíveis.
 */

interface AllowedSystemsSelectorProps {
  value: StorytellerSystemId[];
  onChange: (value: StorytellerSystemId[]) => void;
  disabled?: boolean;
}

export default function AllowedSystemsSelector({
  value,
  onChange,
  disabled = false,
}: AllowedSystemsSelectorProps) {
  const { language } = useI18n();
  const adapters = getAllAdapters();

  const toggle = (id: StorytellerSystemId) => {
    if (disabled) return;
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const lang = (language as 'pt-BR' | 'en') || 'pt-BR';
  const comingSoon = lang === 'pt-BR' ? 'Em breve' : 'Coming soon';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {adapters.map((adapter) => {
        const isSelected = value.includes(adapter.id);
        const isDisabled = disabled || !adapter.available;

        return (
          <button
            key={adapter.id}
            type="button"
            onClick={() => adapter.available && toggle(adapter.id)}
            disabled={isDisabled}
            aria-pressed={isSelected}
            className={cn(
              'relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left',
              isSelected
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-muted-foreground/50',
              isDisabled && 'opacity-50 cursor-not-allowed',
              !isDisabled && 'cursor-pointer',
            )}
          >
            <div
              className={cn(
                'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground/40',
              )}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medieval font-semibold">
                  {adapter.fullLabel}
                </h4>
                {!adapter.available && (
                  <Badge variant="outline" className="text-xs">
                    {comingSoon}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-body mt-1">
                {adapter.shortLabel}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
