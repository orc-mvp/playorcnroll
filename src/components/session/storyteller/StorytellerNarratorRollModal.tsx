/**
 * StorytellerNarratorRollModal — rolagem direta unificada do narrador.
 *
 * Substitui o `NarratorRollModal` (Vampiro) na sala unificada Storyteller.
 * Lê o `narratorRollConfig` do adapter da sessão para:
 *   - Definir dificuldade default (Vampiro 6, Lobisomem 6).
 *   - Permitir 10s explosivos (Lobisomem com surto).
 *   - Mostrar atalhos de pool sistema-específicos (Fúria, Gnose, etc).
 *
 * Compatível com o evento `narrator_roll` já consumido pelos feeds existentes.
 */

import { useEffect, useMemo, useState } from 'react';
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
import { Dices, Minus, Plus, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSystemAdapter } from '@/lib/storyteller/systemRegistry';

export interface StorytellerNarratorRollResult {
  diceCount: number;
  difficulty: number;
  results: number[];
  /** Resultados extras gerados por 10s explosivos (apenas se exploding ligado). */
  extraResults: number[];
  successes: number;
  onesCount: number;
  finalSuccesses: number;
  isBotch: boolean;
  isExceptional: boolean;
  context?: string;
  /** Pool extra escolhido (ex: 'rage', 'gnosis'). undefined = pool livre. */
  poolId?: string;
  /** Se 10s explodiram nessa rolagem. */
  exploded: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ID do sistema da sessão (ex: 'vampiro_v3', 'lobisomem_w20'). */
  gameSystem: string;
  onRollComplete: (result: StorytellerNarratorRollResult) => void;
}

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Rola pool com suporte a 10s explosivos.
 * Quando `exploding=true`, cada 10 (base ou extra) gera nova rolagem
 * recursivamente até não sair mais 10.
 */
function performRoll(pool: number, difficulty: number, exploding: boolean) {
  const baseResults: number[] = [];
  const extraResults: number[] = [];

  for (let i = 0; i < pool; i++) baseResults.push(rollD10());

  if (exploding) {
    let toExplode = baseResults.filter((d) => d === 10).length;
    while (toExplode > 0) {
      const next: number[] = [];
      for (let i = 0; i < toExplode; i++) next.push(rollD10());
      extraResults.push(...next);
      toExplode = next.filter((d) => d === 10).length;
    }
  }

  const all = [...baseResults, ...extraResults];
  const successes = all.filter((d) => d >= difficulty).length;
  const onesCount = all.filter((d) => d === 1).length;
  const finalSuccesses = successes - onesCount;
  const isBotch = successes === 0 && onesCount > 0;
  const isExceptional = finalSuccesses >= 5;

  return {
    baseResults,
    extraResults,
    successes,
    onesCount,
    finalSuccesses,
    isBotch,
    isExceptional,
  };
}

export function StorytellerNarratorRollModal({
  open,
  onOpenChange,
  gameSystem,
  onRollComplete,
}: Props) {
  const { t } = useI18n();
  const adapter = useMemo(() => getSystemAdapter(gameSystem), [gameSystem]);
  const config = adapter.narratorRollConfig;

  const [diceCount, setDiceCount] = useState(1);
  const [difficulty, setDifficulty] = useState(config.defaultDifficulty);
  const [context, setContext] = useState('');
  const [exploding, setExploding] = useState(false);
  const [poolId, setPoolId] = useState<string | undefined>(undefined);
  const [rollResult, setRollResult] =
    useState<StorytellerNarratorRollResult | null>(null);

  // Reseta defaults sempre que troca de sistema/abre o modal
  useEffect(() => {
    if (open) {
      setDifficulty(config.defaultDifficulty);
      setExploding(false);
      setPoolId(undefined);
      setRollResult(null);
      setContext('');
    }
  }, [open, config.defaultDifficulty]);

  const handleSelectPool = (id: string | undefined) => {
    setPoolId(id);
    if (id) {
      const pool = config.extraPools.find((p) => p.id === id);
      if (pool?.defaultDifficulty) setDifficulty(pool.defaultDifficulty);
    } else {
      setDifficulty(config.defaultDifficulty);
    }
  };

  const handleRoll = () => {
    const calc = performRoll(diceCount, difficulty, exploding);
    const result: StorytellerNarratorRollResult = {
      diceCount,
      difficulty,
      results: calc.baseResults,
      extraResults: calc.extraResults,
      successes: calc.successes,
      onesCount: calc.onesCount,
      finalSuccesses: calc.finalSuccesses,
      isBotch: calc.isBotch,
      isExceptional: calc.isExceptional,
      context: context.trim() || undefined,
      poolId,
      exploded: exploding && calc.extraResults.length > 0,
    };
    setRollResult(result);
    onRollComplete(result);
  };

  const handleClose = () => {
    setRollResult(null);
    setContext('');
    setExploding(false);
    setPoolId(undefined);
    onOpenChange(false);
  };

  const handleReroll = () => setRollResult(null);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Dices className={cn('w-5 h-5', adapter.color)} />
            {t.vampiroTests.narratorRoll}
          </DialogTitle>
          <DialogDescription className="font-body">
            {t.vampiroTests.narratorRollDesc}
          </DialogDescription>
        </DialogHeader>

        {!rollResult ? (
          <div className="space-y-4">
            {/* Atalhos de pool sistema-específicos */}
            {config.extraPools.length > 0 && (
              <div className="space-y-2">
                <Label className="font-medieval text-xs uppercase text-muted-foreground">
                  Pool
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={poolId === undefined ? 'default' : 'outline'}
                    onClick={() => handleSelectPool(undefined)}
                  >
                    Livre
                  </Button>
                  {config.extraPools.map((pool) => (
                    <Button
                      key={pool.id}
                      type="button"
                      size="sm"
                      variant={poolId === pool.id ? 'default' : 'outline'}
                      onClick={() => handleSelectPool(pool.id)}
                    >
                      {pool.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Dice count */}
            <div className="space-y-2">
              <Label className="font-medieval">
                {t.vampiroTests.diceCount}
              </Label>
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
                <span className="text-2xl font-bold w-12 text-center font-medieval">
                  {diceCount}
                </span>
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
              <Label className="font-medieval">
                {t.vampiroTests.difficulty}
              </Label>
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

            {/* Exploding 10s */}
            {config.allowExploding10s && (
              <div className="flex items-center justify-between rounded border p-3">
                <div className="flex items-center gap-2">
                  <Flame className={cn('w-4 h-4', adapter.color)} />
                  <Label className="font-medieval cursor-pointer">
                    10s explosivos
                  </Label>
                </div>
                <Switch checked={exploding} onCheckedChange={setExploding} />
              </div>
            )}

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
              className={cn(
                'w-full',
                gameSystem === 'lobisomem_w20'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-destructive hover:bg-destructive/90',
              )}
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
                  key={`b-${i}`}
                  className={cn(
                    'inline-flex items-center justify-center w-8 h-8 rounded text-sm font-bold',
                    die >= rollResult.difficulty
                      ? 'bg-green-500/20 text-green-500'
                      : die === 1
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {die}
                </span>
              ))}
              {rollResult.extraResults.map((die, i) => (
                <span
                  key={`x-${i}`}
                  className={cn(
                    'inline-flex items-center justify-center w-8 h-8 rounded text-sm font-bold ring-2 ring-amber-400/60',
                    die >= rollResult.difficulty
                      ? 'bg-green-500/20 text-green-500'
                      : die === 1
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-muted text-muted-foreground',
                  )}
                  title="Dado extra (10 explosivo)"
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
                  {rollResult.finalSuccesses} {t.vampiroTests.successes} —{' '}
                  {t.vampiroTests.exceptional}
                </Badge>
              ) : rollResult.finalSuccesses > 0 ? (
                <Badge
                  variant="default"
                  className="bg-green-600 text-sm px-4 py-1"
                >
                  {rollResult.finalSuccesses} {t.vampiroTests.successes}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-sm px-4 py-1">
                  {t.vampiroTests.failure}
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                {t.vampiroTests.poolLabel}: {rollResult.diceCount} |{' '}
                {t.vampiroTests.difficultyLabel}: {rollResult.difficulty}
                {rollResult.exploded && ' | 10s explosivos'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReroll}
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

export default StorytellerNarratorRollModal;
