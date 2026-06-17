/**
 * W5NarratorRollModal — Rolagem direta do narrador para Lobisomem 5ª Edição.
 *
 * Mecânica:
 *  - Pool total + dados de Fúria (cor diferente, substituem dados normais).
 *  - Dificuldade = NÚMERO DE SUCESSOS necessários (não TN por dado).
 *  - Cada 6+ = 1 sucesso. Pares de 10 = +2 sucessos cada.
 *  - Messy Critical: pelo menos um par com 10 de Fúria envolvido.
 *  - Brutal Outcome: falha com pelo menos um 1 em dado de Fúria.
 *
 * Emite o mesmo evento `narrator_roll` que o modal clássico, mas com
 * campos extras no `event_data` (rage_dice, normal_dice, is_messy,
 * is_brutal, mode='w5-split') — o feed exibe o resumo padrão e os
 * jogadores veem dados normais/Fúria separados em futura iteração do feed.
 */

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Dices, Minus, Plus, Flame, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { rollW5, type W5RollResult } from '@/lib/lobisomemW5/diceUtils';
import type { StorytellerNarratorRollResult } from './StorytellerNarratorRollModal';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRollComplete: (result: StorytellerNarratorRollResult) => void;
}

export function W5NarratorRollModal({ open, onOpenChange, onRollComplete }: Props) {
  const { t } = useI18n();
  const [totalDice, setTotalDice] = useState(5);
  const [rageDice, setRageDice] = useState(2);
  const [difficulty, setDifficulty] = useState(2);
  const [context, setContext] = useState('');
  const [rollResult, setRollResult] = useState<W5RollResult | null>(null);

  // Mantém Rage ≤ Total automaticamente
  useEffect(() => {
    if (rageDice > totalDice) setRageDice(totalDice);
  }, [totalDice, rageDice]);

  useEffect(() => {
    if (open) {
      setTotalDice(5);
      setRageDice(2);
      setDifficulty(2);
      setContext('');
      setRollResult(null);
    }
  }, [open]);

  const handleRoll = () => {
    const result = rollW5({ totalDice, currentRage: rageDice, difficulty });
    setRollResult(result);

    // Mapeia para o shape esperado por StorytellerSession.onRollComplete.
    // Combina os dados em `results` (normais primeiro) + `extraResults` vazio
    // para compatibilidade com o feed clássico.
    const mapped: StorytellerNarratorRollResult = {
      diceCount: totalDice,
      difficulty,
      results: [...result.normalDice, ...result.rageDice],
      extraResults: [],
      successes: result.baseSuccesses,
      onesCount: result.rageOnes,
      finalSuccesses: result.totalSuccesses,
      isBotch: result.isBrutalOutcome,
      isExceptional: result.isMessyCritical,
      context: context.trim() || undefined,
      poolId: rageDice > 0 ? 'rage' : undefined,
      exploded: false,
      mode: 'w5-split',
      normalDice: result.normalDice,
      rageDice: result.rageDice,
      critBonus: result.critBonus,
      isMessyCritical: result.isMessyCritical,
      isBrutalOutcome: result.isBrutalOutcome,
      margin: result.margin,
    };
    onRollComplete(mapped);
  };

  const handleClose = () => {
    setRollResult(null);
    setContext('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Dices className="w-5 h-5 text-red-600" />
            Rolagem do Narrador (W5)
          </DialogTitle>
          <DialogDescription className="font-body">
            Pool dividido — dados de Fúria substituem dados normais.
          </DialogDescription>
        </DialogHeader>

        {!rollResult ? (
          <div className="space-y-4">
            {/* Total dice */}
            <div className="space-y-2">
              <Label className="font-medieval">Pool total (d10)</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setTotalDice(Math.max(1, totalDice - 1))}
                  disabled={totalDice <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center font-medieval">
                  {totalDice}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setTotalDice(Math.min(30, totalDice + 1))}
                  disabled={totalDice >= 30}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Rage dice */}
            <div className="space-y-2">
              <Label className="font-medieval flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600" />
                Dados de Fúria (0–{Math.min(5, totalDice)})
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setRageDice(Math.max(0, rageDice - 1))}
                  disabled={rageDice <= 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center font-medieval text-red-600">
                  {rageDice}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setRageDice(Math.min(Math.min(5, totalDice), rageDice + 1))
                  }
                  disabled={rageDice >= Math.min(5, totalDice)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  ({totalDice - rageDice} normais + {rageDice} de Fúria)
                </span>
              </div>
            </div>

            {/* Difficulty = sucessos necessários */}
            <div className="space-y-2">
              <Label className="font-medieval">Sucessos necessários</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setDifficulty(Math.max(1, difficulty - 1))}
                  disabled={difficulty <= 1}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center font-medieval">
                  {difficulty}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setDifficulty(Math.min(10, difficulty + 1))}
                  disabled={difficulty >= 10}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medieval">{t.vampiroTests.context}</Label>
              <Input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder={t.vampiroTests.contextPlaceholder}
                className="font-body text-sm"
              />
            </div>

            <Button
              onClick={handleRoll}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Dices className="w-4 h-4 mr-2" />
              Rolar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dados normais */}
            <div className="space-y-2">
              <p className="text-xs font-medieval text-muted-foreground uppercase">
                Normais ({rollResult.normalDice.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rollResult.normalDice.length === 0 && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
                {rollResult.normalDice.map((die, i) => (
                  <span
                    key={`n-${i}`}
                    className={cn(
                      'inline-flex items-center justify-center w-8 h-8 rounded text-sm font-bold',
                      die === 10
                        ? 'bg-yellow-500/30 text-yellow-500 ring-1 ring-yellow-400'
                        : die >= 6
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {die}
                  </span>
                ))}
              </div>
            </div>

            {/* Dados de Fúria */}
            <div className="space-y-2">
              <p className="text-xs font-medieval text-red-600 uppercase flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Fúria ({rollResult.rageDice.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rollResult.rageDice.length === 0 && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
                {rollResult.rageDice.map((die, i) => (
                  <span
                    key={`r-${i}`}
                    className={cn(
                      'inline-flex items-center justify-center w-8 h-8 rounded text-sm font-bold ring-2',
                      die === 10
                        ? 'bg-red-600/30 text-red-600 ring-red-500'
                        : die === 1
                          ? 'bg-red-900/40 text-red-300 ring-red-700'
                          : die >= 6
                            ? 'bg-green-500/20 text-green-500 ring-red-600/40'
                            : 'bg-muted text-muted-foreground ring-red-600/40',
                    )}
                  >
                    {die}
                  </span>
                ))}
              </div>
            </div>

            {/* Resultado */}
            <div className="text-center space-y-2 pt-2 border-t border-border">
              {rollResult.isMessyCritical && (
                <Badge className="bg-yellow-500 text-sm px-4 py-1 flex items-center gap-1 mx-auto w-fit">
                  <Sparkles className="w-4 h-4" />
                  Messy Critical
                </Badge>
              )}
              {rollResult.isBrutalOutcome && (
                <Badge variant="destructive" className="text-sm px-4 py-1 flex items-center gap-1 mx-auto w-fit">
                  <AlertTriangle className="w-4 h-4" />
                  Brutal Outcome
                </Badge>
              )}
              <div>
                <span className="text-3xl font-bold font-medieval">
                  {rollResult.totalSuccesses}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  / {rollResult.difficulty} sucessos
                </span>
              </div>
              <Badge
                variant={rollResult.passed ? 'default' : 'secondary'}
                className={cn(
                  'text-sm px-4 py-1',
                  rollResult.passed && 'bg-green-600',
                )}
              >
                {rollResult.passed ? 'Sucesso' : 'Falha'}
                {rollResult.margin !== 0 && (
                  <span className="ml-1 opacity-80">
                    ({rollResult.margin > 0 ? '+' : ''}
                    {rollResult.margin})
                  </span>
                )}
              </Badge>
              {rollResult.critBonus > 0 && (
                <p className="text-xs text-muted-foreground">
                  +{rollResult.critBonus} de crítico (pares de 10)
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setRollResult(null)}
                className="flex-1"
              >
                {t.vampiroTests.reroll}
              </Button>
              <Button onClick={handleClose} className="flex-1">
                {t.common.close}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default W5NarratorRollModal;
