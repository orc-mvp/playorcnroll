/**
 * W5PendingTest — Resposta do jogador a um pedido de teste W5 (5ª Edição).
 *
 * Renderiza dados normais e dados de Fúria separados visualmente, calculando
 * o split a partir de `currentRage` (vindo do tracker do participante).
 * Aplica as regras 5ed: pares de 10 = +2, Messy Critical, Brutal Outcome,
 * dificuldade = sucessos necessários.
 *
 * Envia evento `vampire_test_result` (mesmo tipo do clássico para reusar feed)
 * com campos extras `mode='w5-split'`, `rage_dice`, `normal_dice`,
 * `is_messy_critical`, `is_brutal_outcome`.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dices,
  Lock,
  Flame,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { rollW5, type W5RollResult } from '@/lib/lobisomemW5/diceUtils';
import {
  getAttributeValue,
  getAbilityValue,
} from '@/lib/vampiro/diceUtils';
import type { LobisomemCharacterData } from '@/lib/lobisomem/diceUtils';
import { getFormAttributeModifier } from '@/lib/lobisomem/diceUtils';
import { useTranslation } from '@/lib/i18n';

interface TestConfig {
  testType: string;
  attribute?: string;
  ability?: string;
  diceCount?: number;
  difficulty: number;
  context: string;
  isPrivate: boolean;
  isSpecialized?: boolean;
  targetCharacterIds: string[];
}

interface Props {
  sessionId: string;
  sceneId: string | null;
  characterId: string;
  characterName: string;
  /** Sheet do personagem (estrutura W20 reaproveitada no MVP W5). */
  vampiroData: LobisomemCharacterData & { rage?: number; willpower?: number };
  testEvent: {
    id: string;
    event_data: TestConfig;
    created_at: string;
  };
  onTestComplete: () => void;
  /** Forma atual (afeta atributos físicos). */
  currentForm?: string;
  /** Fúria ATUAL do tracker (não a permanente da ficha). */
  currentRage?: number;
}

export function W5PendingTest({
  sessionId,
  sceneId,
  characterId,
  characterName,
  vampiroData,
  testEvent,
  onTestComplete,
  currentForm,
  currentRage = 0,
}: Props) {
  const t = useTranslation();
  const { toast } = useToast();
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<W5RollResult | null>(null);

  const config = testEvent.event_data;

  const calculatePool = (): number => {
    let pool = 0;
    switch (config.testType) {
      case 'raw_dice':
        pool = config.diceCount || 1;
        break;
      case 'attribute_ability':
        if (config.attribute && config.ability) {
          let attr = getAttributeValue(vampiroData as any, config.attribute);
          if (currentForm) {
            attr += getFormAttributeModifier(currentForm, config.attribute);
            attr = Math.max(attr, 0);
          }
          pool = attr + getAbilityValue(vampiroData as any, config.ability);
        }
        break;
      case 'attribute_only':
        if (config.attribute) {
          let attr = getAttributeValue(vampiroData as any, config.attribute);
          if (currentForm) {
            attr += getFormAttributeModifier(currentForm, config.attribute);
            attr = Math.max(attr, 0);
          }
          pool = Math.max(attr, 0);
        }
        break;
      case 'willpower':
        pool = Math.min(5, vampiroData.willpower ?? 1);
        break;
      case 'rage':
        pool = Math.min(5, currentRage);
        break;
      case 'harmony':
        pool = Math.min(10, (vampiroData as any).harmony ?? 7);
        break;
      default:
        pool = 1;
    }
    return Math.max(pool, 1);
  };

  const dicePool = calculatePool();
  // 'rage' o pool já É de Fúria; 'willpower' e 'harmony' não misturam Fúria.
  const effectiveRage =
    config.testType === 'rage'
      ? Math.min(currentRage, dicePool)
      : config.testType === 'willpower' || config.testType === 'harmony'
        ? 0
        : Math.min(currentRage, dicePool);

  const handleRoll = async () => {
    setIsRolling(true);
    await new Promise((r) => setTimeout(r, 800));
    const r = rollW5({
      totalDice: dicePool,
      currentRage: effectiveRage,
      difficulty: config.difficulty,
    });
    setResult(r);

    try {
      await supabase.from('session_events').insert([
        {
          session_id: sessionId,
          scene_id: sceneId,
          event_type: 'vampire_test_result',
          event_data: JSON.parse(
            JSON.stringify({
              test_event_id: testEvent.id,
              character_id: characterId,
              character_name: characterName,
              test_config: config,
              dice_pool: dicePool,
              mode: 'w5-split',
              normal_dice: r.normalDice,
              rage_dice: r.rageDice,
              base_successes: r.baseSuccesses,
              crit_bonus: r.critBonus,
              final_successes: r.totalSuccesses,
              is_messy_critical: r.isMessyCritical,
              is_brutal_outcome: r.isBrutalOutcome,
              passed: r.passed,
              margin: r.margin,
              is_private: config.isPrivate,
              // Campos legados pra compatibilidade com o feed clássico:
              base_results: [...r.normalDice, ...r.rageDice],
              extra_results: [],
              successes: r.baseSuccesses,
              ones_count: r.rageOnes,
              tens_count: r.normalTens + r.rageTens,
              is_botch: r.isBrutalOutcome,
              is_exceptional: r.isMessyCritical,
            }),
          ),
        },
      ]);

      // Brutal Outcome → -1 Harmonia (clamped a 0). Lê o valor atual e grava.
      if (r.isBrutalOutcome) {
        try {
          const { data: row } = await supabase
            .from('session_participants')
            .select('id, session_w5_harmony')
            .eq('session_id', sessionId)
            .eq('character_id', characterId)
            .maybeSingle();
          if (row) {
            const current = (row as any).session_w5_harmony ?? 7;
            const next = Math.max(0, current - 1);
            if (next !== current) {
              await supabase
                .from('session_participants')
                .update({ session_w5_harmony: next } as any)
                .eq('id', (row as any).id);
              await supabase.from('session_events').insert([
                {
                  session_id: sessionId,
                  scene_id: sceneId,
                  event_type: 'tracker_update',
                  event_data: JSON.parse(
                    JSON.stringify({
                      character_id: characterId,
                      character_name: characterName,
                      tracker: 'harmony',
                      previous: current,
                      next,
                      reason: 'brutal_outcome',
                    }),
                  ),
                },
              ]);
            }
          }
        } catch (e) {
          if (import.meta.env.DEV) console.error('W5 harmony decrement error', e);
        }
      }

      toast({
        title: r.isBrutalOutcome
          ? 'Brutal Outcome'
          : r.isMessyCritical
            ? 'Messy Critical'
            : r.passed
              ? t.vampiroTests.success
              : t.vampiroTests.failure,
        description: r.isBrutalOutcome ? 'Harmonia -1' : undefined,
      });
    } catch (e) {
      if (import.meta.env.DEV) console.error('W5 test save error', e);
    }

    setIsRolling(false);
  };

  if (result) {
    return (
      <Card className="medieval-card border-2 border-red-600 animate-in fade-in-50">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            {result.isBrutalOutcome ? (
              <XCircle className="w-5 h-5 text-destructive" />
            ) : result.isMessyCritical ? (
              <Sparkles className="w-5 h-5 text-yellow-500" />
            ) : result.passed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
            )}
            Resultado (W5)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.normalDice.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medieval text-muted-foreground uppercase">
                Normais ({result.normalDice.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.normalDice.map((d, i) => (
                  <span
                    key={`n-${i}`}
                    className={cn(
                      'inline-flex items-center justify-center w-9 h-9 rounded text-sm font-bold border-2',
                      d === 10
                        ? 'bg-yellow-500/30 text-yellow-500 border-yellow-400'
                        : d >= 6
                          ? 'bg-green-500/20 text-green-500 border-green-500'
                          : 'bg-muted text-muted-foreground border-border',
                    )}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.rageDice.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medieval text-red-600 uppercase flex items-center gap-1">
                <Flame className="w-3 h-3" /> Fúria ({result.rageDice.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.rageDice.map((d, i) => (
                  <span
                    key={`r-${i}`}
                    className={cn(
                      'inline-flex items-center justify-center w-9 h-9 rounded text-sm font-bold border-2',
                      d === 10
                        ? 'bg-red-600/30 text-red-500 border-red-500'
                        : d === 1
                          ? 'bg-red-900/40 text-red-300 border-red-700'
                          : d >= 6
                            ? 'bg-green-500/20 text-green-500 border-red-600/60'
                            : 'bg-muted text-muted-foreground border-red-600/40',
                    )}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-center space-y-2 pt-2 border-t border-border">
            {result.isMessyCritical && (
              <Badge className="bg-yellow-500 text-sm px-3 py-1 flex items-center gap-1 mx-auto w-fit">
                <Sparkles className="w-4 h-4" /> Messy Critical
              </Badge>
            )}
            {result.isBrutalOutcome && (
              <Badge
                variant="destructive"
                className="text-sm px-3 py-1 flex items-center gap-1 mx-auto w-fit"
              >
                <AlertTriangle className="w-4 h-4" /> Brutal Outcome
              </Badge>
            )}
            <div>
              <span className="text-3xl font-bold font-medieval">
                {result.totalSuccesses}
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                / {result.difficulty} sucessos
              </span>
            </div>
            <Badge
              variant={result.passed ? 'default' : 'secondary'}
              className={cn(
                'text-sm px-3 py-1',
                result.passed && 'bg-green-600',
              )}
            >
              {result.passed ? t.vampiroTests.success : t.vampiroTests.failure}
              {result.margin !== 0 && (
                <span className="ml-1 opacity-80">
                  ({result.margin > 0 ? '+' : ''}
                  {result.margin})
                </span>
              )}
            </Badge>
            {result.critBonus > 0 && (
              <p className="text-xs text-muted-foreground">
                +{result.critBonus} de crítico (pares de 10)
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={onTestComplete}
          >
            OK
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getLabel = () => {
    if (config.testType === 'attribute_ability')
      return `${config.attribute ?? ''} + ${config.ability ?? ''}`;
    if (config.testType === 'attribute_only') return config.attribute ?? '';
    if (config.testType === 'willpower') return 'Vontade';
    if (config.testType === 'rage') return 'Frenesi (Fúria)';
    if (config.testType === 'harmony') return 'Harmonia';
    if (config.testType === 'raw_dice')
      return `${config.diceCount ?? 1} dados`;
    return config.testType;
  };

  return (
    <Card className="medieval-card border-2 border-red-600 animate-pulse-slow">
      <CardHeader className="pb-2">
        <CardTitle className="font-medieval text-base flex items-center gap-2">
          <Dices className="w-5 h-5 text-red-600" />
          {t.vampiroTests.requestTest}
          {config.isPrivate && (
            <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <p className="font-medieval text-red-600">{getLabel()}</p>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>Sucessos necessários: {config.difficulty}</span>
            <span>•</span>
            <span>Pool: {dicePool}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-red-600" />
              {effectiveRage} de Fúria
            </span>
          </div>
          {config.context && (
            <p className="text-sm text-muted-foreground italic">
              "{config.context}"
            </p>
          )}
        </div>

        <Button
          onClick={handleRoll}
          disabled={isRolling}
          className="w-full h-14 md:h-10 bg-red-600 hover:bg-red-700 text-white"
          size="lg"
        >
          {isRolling ? (
            <span className="animate-pulse">{t.vampiroTests.rolling}</span>
          ) : (
            <>
              <Dices className="w-4 h-4 mr-2" /> {t.vampiroTests.rollDice}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default W5PendingTest;
