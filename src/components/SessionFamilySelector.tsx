import { Sword, Drama } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import type { GameSystemFamily } from '@/lib/gameSystems';

/**
 * Seletor de família de sistema usado na criação de sessões.
 *
 * A sessão é definida pela família (sala unificada), não pelo sistema individual:
 *  - `herois_marcados`: sala dedicada de Orc'n Roll (apenas Heróis Marcados).
 *  - `storyteller`: sala unificada WoD que aceita personagens de Vampiro,
 *    Lobisomem, Mago e Metamorfos no mesmo grupo.
 *
 * O sistema específico do PERSONAGEM continua sendo escolhido na ficha
 * (`/character/create`), via `GameSystemSelector`.
 */

interface SessionFamilySelectorProps {
  value: GameSystemFamily | null;
  onChange: (value: GameSystemFamily) => void;
  disabled?: boolean;
}

interface FamilyOption {
  id: GameSystemFamily;
  name: string;
  shortName: string;
  description: { 'pt-BR': string; en: string };
  colorClass: string;
  borderActiveClass: string;
  bgActiveClass: string;
  icon: React.ReactNode;
  features: string[];
}

const FAMILIES: FamilyOption[] = [
  {
    id: 'herois_marcados',
    name: 'Heróis Marcados',
    shortName: 'Orc\'n Roll',
    description: {
      'pt-BR': 'RPG narrativista de fantasia medieval. Sala dedicada com motor 2d6.',
      en: 'Narrative epic medieval fantasy RPG. Dedicated 2d6 room.',
    },
    colorClass: 'bg-primary/20 text-primary',
    borderActiveClass: 'border-primary',
    bgActiveClass: 'bg-primary/10',
    icon: <Sword className="w-8 h-8" />,
    features: ['2d6', 'Marcas', 'Movimentos Heroicos'],
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    shortName: 'World of Darkness',
    description: {
      'pt-BR':
        'Sala unificada do Mundo das Trevas. Aceita personagens de Vampiro, Lobisomem, Mago e Metamorfos no mesmo grupo.',
      en: 'Unified World of Darkness room. Accepts Vampire, Werewolf, Mage and Shifter characters in the same group.',
    },
    colorClass: 'bg-destructive/20 text-destructive',
    borderActiveClass: 'border-destructive',
    bgActiveClass: 'bg-destructive/10',
    icon: <Drama className="w-8 h-8" />,
    features: ['Pool de d10', 'Multissistema', 'Vampiro · Lobisomem · Mago'],
  },
];

export default function SessionFamilySelector({
  value,
  onChange,
  disabled = false,
}: SessionFamilySelectorProps) {
  const { language } = useI18n();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {FAMILIES.map((family) => {
        const isSelected = value === family.id;
        const description =
          family.description[language as 'pt-BR' | 'en'] ||
          family.description['pt-BR'];

        return (
          <button
            key={family.id}
            type="button"
            onClick={() => !disabled && onChange(family.id)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all text-left',
              isSelected
                ? cn(family.borderActiveClass, family.bgActiveClass)
                : 'border-border bg-card hover:border-muted-foreground/50',
              disabled && 'opacity-50 cursor-not-allowed',
              !disabled && 'cursor-pointer',
            )}
          >
            <div className={cn('p-3 rounded-full', family.colorClass)}>
              {family.icon}
            </div>

            <div className="text-center">
              <h3 className="font-medieval text-lg font-semibold">
                {family.name}
              </h3>
              <p className="text-xs text-muted-foreground font-body mt-1">
                {family.shortName}
              </p>
            </div>

            <p className="text-sm text-muted-foreground font-body text-center">
              {description}
            </p>

            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {family.features.map((feature) => (
                <Badge key={feature} variant="outline" className="text-xs">
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
