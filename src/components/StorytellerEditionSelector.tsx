/**
 * Seletor de Edição (Clássico vs 5ª Edição) para salas Storyteller.
 *
 * A escolha é EXCLUDENTE — uma sala 5ed só aceita personagens 5ed, e
 * vice-versa. Isso porque o motor de dados é diferente (5ed usa pool
 * dividido com dados de Fúria/Fome e críticos em pares de 10).
 *
 * Renderizado entre o `SessionFamilySelector` (storyteller selecionado)
 * e o `AllowedSystemsSelector` (que filtra adapters pela edição).
 */

import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import { Drama, Moon } from 'lucide-react';
import type { StorytellerEdition } from '@/lib/storyteller/types';

interface EditionSelectorProps {
  value: StorytellerEdition | null;
  onChange: (value: StorytellerEdition) => void;
  disabled?: boolean;
}

interface EditionOption {
  id: StorytellerEdition;
  name: { 'pt-BR': string; en: string };
  shortName: string;
  description: { 'pt-BR': string; en: string };
  badge: { 'pt-BR': string; en: string };
  icon: React.ReactNode;
  colorClass: string;
  borderActiveClass: string;
  bgActiveClass: string;
}

const EDITIONS: EditionOption[] = [
  {
    id: 'classic',
    name: { 'pt-BR': 'Clássico', en: 'Classic' },
    shortName: 'V3 · W20 · M20',
    description: {
      'pt-BR':
        'Mundo das Trevas Clássico. Vampiro V3, Lobisomem W20, Mago M20 e Metamorfos. Pool de d10 contra TN, 10s explosivos opcionais.',
      en: 'Classic World of Darkness. Vampire V3, Werewolf W20, Mage M20 and Shifters. d10 pool vs TN, optional exploding 10s.',
    },
    badge: { 'pt-BR': 'Multissistema', en: 'Multi-system' },
    icon: <Drama className="w-8 h-8" />,
    colorClass: 'bg-destructive/20 text-destructive',
    borderActiveClass: 'border-destructive',
    bgActiveClass: 'bg-destructive/10',
  },
  {
    id: '5ed',
    name: { 'pt-BR': '5ª Edição', en: '5th Edition' },
    shortName: 'W5',
    description: {
      'pt-BR':
        'Lobisomem 5ª Edição. Pool dividido com dados de Fúria, dificuldade em sucessos, Messy Critical e Brutal Outcome. Não mistura com sistemas Clássicos.',
      en: 'Werewolf 5th Edition. Split pool with Rage dice, success-based difficulty, Messy Critical and Brutal Outcome. Does not mix with Classic systems.',
    },
    badge: { 'pt-BR': 'Pool dividido', en: 'Split pool' },
    icon: <Moon className="w-8 h-8" />,
    colorClass: 'bg-red-600/20 text-red-600',
    borderActiveClass: 'border-red-600',
    bgActiveClass: 'bg-red-600/10',
  },
];

export default function StorytellerEditionSelector({
  value,
  onChange,
  disabled = false,
}: EditionSelectorProps) {
  const { language } = useI18n();
  const lang = (language as 'pt-BR' | 'en') || 'pt-BR';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {EDITIONS.map((ed) => {
        const isSelected = value === ed.id;
        return (
          <button
            key={ed.id}
            type="button"
            onClick={() => !disabled && onChange(ed.id)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-left',
              isSelected
                ? cn(ed.borderActiveClass, ed.bgActiveClass)
                : 'border-border bg-card hover:border-muted-foreground/50',
              disabled && 'opacity-50 cursor-not-allowed',
              !disabled && 'cursor-pointer',
            )}
          >
            <div className={cn('p-2 rounded-full', ed.colorClass)}>
              {ed.icon}
            </div>
            <div className="text-center">
              <h3 className="font-medieval text-base font-semibold leading-tight">
                {ed.name[lang]}
              </h3>
              <p className="text-[11px] text-muted-foreground font-body mt-0.5">
                {ed.shortName}
              </p>
            </div>
            <p className="text-xs text-muted-foreground font-body text-center leading-snug">
              {ed.description[lang]}
            </p>
            <Badge variant="outline" className="text-[10px]">
              {ed.badge[lang]}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
