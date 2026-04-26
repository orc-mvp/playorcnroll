/**
 * NoCharacterCard — cartão exibido a jogadores que entraram sem personagem.
 * Genérico via `themeColor`.
 */

import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n/context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  inviteCode?: string;
  themeColor?: string;
}

export function NoCharacterCard({ inviteCode, themeColor = 'destructive' }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <Card className={cn('border', `border-${themeColor}/30`, `bg-${themeColor}/5`)}>
      <CardContent className="flex flex-col items-center text-center py-8 gap-4">
        <AlertTriangle className={cn('w-10 h-10', `text-${themeColor}`)} />
        <p className="text-sm text-muted-foreground">
          {t.sessionRejoin.noCharacterInSession}
        </p>
        <Button
          variant="outline"
          className={cn(`border-${themeColor}/30 text-${themeColor} hover:bg-${themeColor}/10`)}
          onClick={() => navigate(inviteCode ? `/join/${inviteCode}` : '/join')}
        >
          {t.sessionRejoin.rejoinWithCharacter}
        </Button>
      </CardContent>
    </Card>
  );
}
