/**
 * NoCharacterCard — cartão exibido a jogadores que entraram sem personagem.
 * Tema é passado como classes tailwind completas para evitar quebra do JIT.
 */

import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n/context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeClasses {
  cardBorder: string; // ex: 'border-destructive/30'
  cardBg: string;     // ex: 'bg-destructive/5'
  iconText: string;   // ex: 'text-destructive'
  buttonBorder: string; // 'border-destructive/30 text-destructive hover:bg-destructive/10'
}

const THEMES: Record<string, ThemeClasses> = {
  vampire: {
    cardBorder: 'border-destructive/30',
    cardBg: 'bg-destructive/5',
    iconText: 'text-destructive',
    buttonBorder: 'border-destructive/30 text-destructive hover:bg-destructive/10',
  },
  werewolf: {
    cardBorder: 'border-emerald-500/30',
    cardBg: 'bg-emerald-500/5',
    iconText: 'text-emerald-500',
    buttonBorder: 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10',
  },
};

interface Props {
  inviteCode?: string;
  themeKey?: 'vampire' | 'werewolf';
}

export function NoCharacterCard({ inviteCode, themeKey = 'vampire' }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const theme = THEMES[themeKey];
  return (
    <Card className={cn('border', theme.cardBorder, theme.cardBg)}>
      <CardContent className="flex flex-col items-center text-center py-8 gap-4">
        <AlertTriangle className={cn('w-10 h-10', theme.iconText)} />
        <p className="text-sm text-muted-foreground">
          {t.sessionRejoin.noCharacterInSession}
        </p>
        <Button
          variant="outline"
          className={cn(theme.buttonBorder)}
          onClick={() => navigate(inviteCode ? `/join/${inviteCode}` : '/join')}
        >
          {t.sessionRejoin.rejoinWithCharacter}
        </Button>
      </CardContent>
    </Card>
  );
}
