/**
 * M5NarratorRollModal — Rolagem direta do narrador para Mago 5ª Edição.
 * Espelho do W5NarratorRollModal trocando Fúria→Paradoxo, paleta para roxo,
 * Messy→Quiet, Brutal→Backlash.
 */

import { useEffect, useState } from 'react';
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
import { Dices, Minus, Plus, Zap, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { rollM5, type M5RollResult } from '@/lib/magoM5/diceUtils';
import type { StorytellerNarratorRollResult } from './StorytellerNarratorRollModal';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRollComplete: (result: StorytellerNarratorRollResult) => void;
}

export function M5NarratorRollModal({ open, onOpenChange, onRollComplete }: Props) {
  const [totalDice, setTotalDice] = useState(5);
  const [paradoxDice, setParadoxDice] = useState(1);
  const [difficulty, setDifficulty] = useState(2);
  const [context, setContext] = useState('');
  const [rollResult, setRollResult] = useState<M5RollResult | null>(null);

  useEffect(() => {
    if (paradoxDice > totalDice) setParadoxDice(totalDice);
  }, [totalDice, paradoxDice]);

  useEffect(() => {
    if (open) {
      setTotalDice(5);
      setParadoxDice(1);
      setDifficulty(2);
      setContext('');
      setRollResult(null);
    }
  }, [open]);

  const handleRoll = () => {
    const r = rollM5({ totalDice, currentParadox: paradoxDice, difficulty });
    setRollResult(r);

    const mapped: StorytellerNarratorRollResult = {
      diceCount: totalDice,
      difficulty,
      results: [...r.normalDice, ...r.paradoxDice],
      extraResults: [],
      successes: r.baseSuccesses,
      onesCount: r.paradoxOnes,
      finalSuccesses: r.totalSuccesses,
      isBotch: r.isBacklash,
      isExceptional: r.isQuietCritical,
      context: context.trim() || undefined,
      poolId: paradoxDice > 0 ? 'paradox' : undefined,
      exploded: false,
      mode: 'm5-split',
      normalDice: r.normalDice,
      paradoxDice: r.paradoxDice,
      critBonus: r.critBonus,
      isQuietCritical: r.isQuietCritical,
      isBacklash: r.isBacklash,
      margin: r.margin,
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
            <Dices className="w-5 h-5 text-purple-500" />
            Rolagem do Narrador (M5)
          </DialogTitle>
          <DialogDescription className="font-body">
            Pool dividido — dados de Paradoxo substituem dados normais.
          </DialogDescription>
        </DialogHeader>

        {!rollResult ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medieval">Pool total (d10)</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setTotalDice(Math.max(1, totalDice - 1))} disabled={totalDice <= 1}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center font-medieval">{totalDice}</span>
                <Button variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setTotalDice(Math.min(30, totalDice + 1))} disabled={totalDice >= 30}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medieval flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                Dados de Paradoxo (0–{Math.min(10, totalDice)})
              </Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setParadoxDice(Math.max(0, paradoxDice - 1))} disabled={paradoxDice <= 0}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center font-medieval text-purple-500">
                  {paradoxDice}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setParadoxDice(Math.min(Math.min(10, totalDice), paradoxDice + 1))}
                  disabled={paradoxDice >= Math.min(10, totalDice)}>
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  ({totalDice - paradoxDice} normais + {paradoxDice} Paradoxo)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medieval">Sucessos necessários</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-10 w-10"
                  onClick={() => setDifficulty(Math.max(1, difficulty - 1))} disabled={difficulty <= 1}>
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center font-medieval">{difficulty}</span>
                <Button variant="outline" size="icon" className="h-10 w-10"
                  onClick={() => setDifficulty(Math.min(10, difficulty + 1))} disabled={difficulty >= 10}>
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medieval">Contexto</Label>
              <Input value={context} onChange={(e) => setContext(e.target.value)}
                placeholder="Opcional" className="font-body text-sm" />
            </div>

            <Button onClick={handleRoll} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              <Dices className="w-4 h-4 mr-2" /> Rolar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medieval text-muted-foreground uppercase">
                Normais ({rollResult.normalDice.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rollResult.normalDice.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                {rollResult.normalDice.map((die, i) => (
                  <span key={`n-${i}`} className={cn(
                    'inline-flex items-center justify-center w-8 h-8 rounded text-sm font-bold',
                    die === 10 ? 'bg-yellow-500/30 text-yellow-500 ring-1 ring-yellow-400'
                      : die >= 6 ? 'bg-green-500/20 text-green-500'
                      : 'bg-muted text-muted-foreground',
                  )}>{die}</span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medieval text-purple-500 uppercase flex items-center gap-1">
                <Zap className="w-3 h-3" /> Paradoxo ({rollResult.paradoxDice.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {rollResult.paradoxDice.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                {rollResult.paradoxDice.map((die, i) => (
                  <span key={`p-${i}`} className={cn(
                    'inline-flex items-center justify-center w-8 h-8 rounded text-sm font-bold ring-2',
                    die === 10 ? 'bg-purple-600/30 text-purple-500 ring-purple-500'
                      : die === 1 ? 'bg-purple-900/40 text-purple-300 ring-purple-700'
                      : die >= 6 ? 'bg-green-500/20 text-green-500 ring-purple-600/40'
                      : 'bg-muted text-muted-foreground ring-purple-600/40',
                  )}>{die}</span>
                ))}
              </div>
            </div>

            <div className="text-center space-y-2 pt-2 border-t border-border">
              {rollResult.isQuietCritical && (
                <Badge className="bg-yellow-500 text-sm px-4 py-1 flex items-center gap-1 mx-auto w-fit">
                  <Sparkles className="w-4 h-4" /> Quiet Critical
                </Badge>
              )}
              {rollResult.isBacklash && (
                <Badge variant="destructive" className="text-sm px-4 py-1 flex items-center gap-1 mx-auto w-fit">
                  <AlertTriangle className="w-4 h-4" /> Backlash
                </Badge>
              )}
              <div>
                <span className="text-3xl font-bold font-medieval">{rollResult.totalSuccesses}</span>
                <span className="text-sm text-muted-foreground ml-2">/ {rollResult.difficulty} sucessos</span>
              </div>
              <Badge variant={rollResult.passed ? 'default' : 'secondary'}
                className={cn('text-sm px-4 py-1', rollResult.passed && 'bg-green-600')}>
                {rollResult.passed ? 'Sucesso' : 'Falha'}
                {rollResult.margin !== 0 && (
                  <span className="ml-1 opacity-80">
                    ({rollResult.margin > 0 ? '+' : ''}{rollResult.margin})
                  </span>
                )}
              </Badge>
              {rollResult.critBonus > 0 && (
                <p className="text-xs text-muted-foreground">+{rollResult.critBonus} de crítico (pares de 10)</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRollResult(null)} className="flex-1">Rerolar</Button>
              <Button onClick={handleClose} className="flex-1">Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default M5NarratorRollModal;
