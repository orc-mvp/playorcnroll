/**
 * StorytellerRequestTestCard — bloco único e compartilhado de "Pedir Teste"
 * (e "Rolar" para narrador) para a sala unificada Storyteller.
 *
 * Renderizado uma única vez no topo da sidebar — tanto para narradores quanto
 * para jogadores. Para jogadores, só aparece o botão de "Pedir Teste"
 * (rolagem direta é restrita ao narrador via `StorytellerNarratorRollModal`).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface Props {
  isNarrator: boolean;
  /** Tema baseado no sistema da sessão. */
  theme: {
    border: string;
    iconText: string;
    primaryBg: string;
    outlineBorder: string;
    outlineHover: string;
  };
  onRequestTest: () => void;
  onRequestRoll?: () => void;
  /** Desabilita "Pedir Teste" quando não há alvos válidos (ex.: jogador sem ficha). */
  disabledRequestTest?: boolean;
}

export function StorytellerRequestTestCard({
  isNarrator,
  theme,
  onRequestTest,
  onRequestRoll,
  disabledRequestTest,
}: Props) {
  const { t } = useI18n();

  return (
    <Card className={cn('medieval-card', theme.border)}>
      <CardHeader className="pb-3">
        <CardTitle className="font-medieval text-base flex items-center gap-2">
          <Dices className={cn('w-4 h-4', theme.iconText)} />
          {t.vampiroTests.requestTest}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={onRequestTest}
          disabled={disabledRequestTest}
          className={cn('w-full', theme.primaryBg)}
        >
          <Dices className="w-4 h-4 mr-2" />
          {t.vampiroTests.test}
        </Button>
        {isNarrator && onRequestRoll && (
          <Button
            onClick={onRequestRoll}
            variant="outline"
            className={cn('w-full', theme.outlineBorder, theme.outlineHover)}
          >
            <Dices className="w-4 h-4 mr-2" />
            {t.vampiroTests.roll}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
