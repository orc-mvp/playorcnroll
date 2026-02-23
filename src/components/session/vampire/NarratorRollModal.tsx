import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Dices, Minus, Plus } from 'lucide-react';
import { rollD10, calculateSuccesses } from '@/lib/vampiro/diceUtils';
import { cn } from '@/lib/utils';

interface NarratorRollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRollComplete: (result: NarratorRollResult) => void;
}

export interface NarratorRollResult {
  diceCount: number;
  difficulty: number;
  results: number[];
  successes: number;
  onesCount: number;
  finalSuccesses: number;
  isBotch: boolean;
  isExceptional: boolean;
  context?: string;
}

export default function NarratorRollModal({ open, onOpenChange, onRollComplete }: NarratorRollModalProps) {
  const { t } = useI18n();
  const [diceCount, setDiceCount] = useState(1);
  const [difficulty, setDifficulty] = useState(6);
  const [context, setContext] = useState('');
  const [rollResult, setRollResult] = useState<NarratorRollResult | null>(null);

  const handleRoll = () => {
    const results: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      results.push(rollD10());
    }
    const calc = calculateSuccesses(results, difficulty);
    const result: NarratorRollResult = {
      diceCount,
      difficulty,
      results,
      successes: calc.successes,
      onesCount: calc.onesCount,
      finalSuccesses: calc.finalSuccesses,
      isBotch: calc.isBotch,
      isExceptional: calc.isExceptional,
      context: context.trim() || undefined,
    };
    setRollResult(result);
    onRollComplete(result);
  };

  const handleClose = () => {
    setRollResult(null);
    setContext('');
    onOpenChange(false);
  };

  const handleReroll = () => {
    setRollResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Dices className="w-5 h-5 text-destructive" />
            {t.vampiroTests.narratorRoll}
          </DialogTitle>
          <DialogDescription className="font-body">
            {t.vampiroTests.narratorRollDesc}
          </DialogDescription>
        </DialogHeader>

        {!rollResult ? (
          <div className="space-y-4">
            {/* Dice count */}
            <div className="space-y-2">
              <Label className="font-medieval">{t.vampiroTests.diceCount}</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                  disabled={diceCount <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center font-medieval">{diceCount}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDiceCount(Math.min(30, diceCount + 1))}
                  disabled={diceCount >= 30}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">d10</span>
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label className="font-medieval">{t.vampiroTests.difficulty}</Label>
            <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setDifficulty(Math.max(2, difficulty - 1))}
                  disabled={difficulty <= 2}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center font-medieval">{difficulty}</span>
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

            {/* Context */}
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
              className="w-full bg-destructive hover:bg-destructive/90"
            >
              <Dices className="w-4 h-4 mr-2" />
              {t.vampiroTests.rollDice}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dice results */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {rollResult.results.map((die, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded text-sm font-bold",
                    die >= rollResult.difficulty
                      ? 'bg-green-500/20 text-green-500'
                      : die === 1
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {die}
                </span>
              ))}
            </div>

            {/* Result */}
            <div className="text-center space-y-2">
              {rollResult.isBotch ? (
                <Badge variant="destructive" className="text-sm px-4 py-1">
                  {t.vampiroTests.botch}
                </Badge>
              ) : rollResult.isExceptional ? (
                <Badge className="bg-yellow-500 text-sm px-4 py-1">
                  {t.vampiroTests.exceptional}
                </Badge>
              ) : rollResult.finalSuccesses > 0 ? (
                <Badge variant="default" className="bg-green-600 text-sm px-4 py-1">
                  {rollResult.finalSuccesses} {t.vampiroTests.successes}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-sm px-4 py-1">
                  {t.vampiroTests.failure}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                {t.vampiroTests.poolLabel}: {rollResult.diceCount} | {t.vampiroTests.difficultyLabel}: {rollResult.difficulty}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReroll} className="flex-1">
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
