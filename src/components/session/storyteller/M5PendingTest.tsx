/**
 * M5PendingTest — Resposta do jogador a um pedido de teste em Mago 5ª Edição.
 *
 * Espelho do W5PendingTest trocando Fúria→Paradoxo (lido do session_paradox)
 * e Brutal Outcome→Backlash (incrementa Paradoxo em +1 automaticamente).
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dices, Lock, Zap, AlertTriangle, Sparkles, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { rollM5, type M5RollResult } from '@/lib/magoM5/diceUtils';
import { getAttributeValue, getAbilityValue } from '@/lib/vampiro/diceUtils';
import type { MagoCharacterData } from '@/lib/mago/spheres';

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
  vampiroData: MagoCharacterData & { arete?: number; willpower?: number };
  testEvent: { id: string; event_data: TestConfig; created_at: string };
  onTestComplete: () => void;
  /** Paradoxo ATUAL do tracker (não permanente). */
  currentParadox?: number;
}

export function M5PendingTest({
  sessionId, sceneId, characterId, characterName, vampiroData, testEvent,
  onTestComplete, currentParadox = 0,
}: Props) {
  const { toast } = useToast();
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<M5RollResult | null>(null);
  const config = testEvent.event_data;

  const calculatePool = (): number => {
    let pool = 0;
    switch (config.testType) {
      case 'raw_dice': pool = config.diceCount || 1; break;
      case 'attribute_ability':
        if (config.attribute && config.ability) {
          pool = getAttributeValue(vampiroData as any, config.attribute) + getAbilityValue(vampiroData as any, config.ability);
        }
        break;
      case 'attribute_only':
        if (config.attribute) pool = getAttributeValue(vampiroData as any, config.attribute);
        break;
      case 'willpower': pool = Math.min(5, vampiroData.willpower ?? 1); break;
      case 'arete': pool = Math.min(5, vampiroData.arete ?? 1); break;
      case 'quintessence': pool = Math.min(5, (vampiroData as any).quintessence ?? 0); break;
      default: pool = 1;
    }
    return Math.max(pool, 1);
  };

  const dicePool = calculatePool();
  // Vontade/Quintessência puras não misturam Paradoxo.
  const effectiveParadox =
    config.testType === 'willpower' || config.testType === 'quintessence'
      ? 0 : Math.min(currentParadox, dicePool);

  const handleRoll = async () => {
    setIsRolling(true);
    await new Promise((r) => setTimeout(r, 600));
    const r = rollM5({ totalDice: dicePool, currentParadox: effectiveParadox, difficulty: config.difficulty });
    setResult(r);

    try {
      await supabase.from('session_events').insert([{
        session_id: sessionId,
        scene_id: sceneId,
        event_type: 'vampire_test_result',
        event_data: JSON.parse(JSON.stringify({
          test_event_id: testEvent.id,
          character_id: characterId,
          character_name: characterName,
          test_config: config,
          dice_pool: dicePool,
          mode: 'm5-split',
          normal_dice: r.normalDice,
          paradox_dice: r.paradoxDice,
          base_successes: r.baseSuccesses,
          crit_bonus: r.critBonus,
          final_successes: r.totalSuccesses,
          is_quiet_critical: r.isQuietCritical,
          is_backlash: r.isBacklash,
          passed: r.passed,
          margin: r.margin,
          is_private: config.isPrivate,
          // Legados para compatibilidade com feeds antigos
          base_results: [...r.normalDice, ...r.paradoxDice],
          extra_results: [],
          successes: r.baseSuccesses,
          ones_count: r.paradoxOnes,
          tens_count: r.normalTens + r.paradoxTens,
          is_botch: r.isBacklash,
          is_exceptional: r.isQuietCritical,
        })),
      }]);

      // Backlash → +1 Paradoxo (clamped a 10)
      if (r.isBacklash) {
        try {
          const { data: row } = await supabase
            .from('session_participants')
            .select('id, session_paradox')
            .eq('session_id', sessionId)
            .eq('character_id', characterId)
            .maybeSingle();
          if (row) {
            const current = (row as any).session_paradox ?? 0;
            const next = Math.min(10, current + 1);
            if (next !== current) {
              await supabase.from('session_participants')
                .update({ session_paradox: next } as any)
                .eq('id', (row as any).id);
              await supabase.from('session_events').insert([{
                session_id: sessionId,
                scene_id: sceneId,
                event_type: 'tracker_update',
                event_data: JSON.parse(JSON.stringify({
                  character_id: characterId,
                  character_name: characterName,
                  tracker: 'paradox',
                  previous: current,
                  next,
                  reason: 'backlash',
                })),
              }]);
            }
          }
        } catch (e) {
          if (import.meta.env.DEV) console.error('M5 paradox increment error', e);
        }
      }

      toast({
        title: r.isBacklash ? 'Backlash' : r.isQuietCritical ? 'Quiet Critical' : r.passed ? 'Sucesso' : 'Falha',
        description: r.isBacklash ? 'Paradoxo +1' : undefined,
      });
    } catch (e) {
      if (import.meta.env.DEV) console.error('M5 test save error', e);
    }
    setIsRolling(false);
  };

  if (result) {
    return (
      <Card className="medieval-card border-2 border-purple-600 animate-in fade-in-50">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            {result.isBacklash ? <XCircle className="w-5 h-5 text-destructive" />
              : result.isQuietCritical ? <Sparkles className="w-5 h-5 text-yellow-500" />
              : result.passed ? <CheckCircle2 className="w-5 h-5 text-green-500" />
              : <AlertCircle className="w-5 h-5 text-muted-foreground" />}
            Resultado (M5)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.normalDice.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medieval text-muted-foreground uppercase">Normais ({result.normalDice.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {result.normalDice.map((d, i) => (
                  <span key={`n-${i}`} className={cn(
                    'inline-flex items-center justify-center w-9 h-9 rounded text-sm font-bold border-2',
                    d === 10 ? 'bg-yellow-500/30 text-yellow-500 border-yellow-400'
                      : d >= 6 ? 'bg-green-500/20 text-green-500 border-green-500'
                      : 'bg-muted text-muted-foreground border-border',
                  )}>{d}</span>
                ))}
              </div>
            </div>
          )}
          {result.paradoxDice.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medieval text-purple-500 uppercase flex items-center gap-1">
                <Zap className="w-3 h-3" /> Paradoxo ({result.paradoxDice.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.paradoxDice.map((d, i) => (
                  <span key={`p-${i}`} className={cn(
                    'inline-flex items-center justify-center w-9 h-9 rounded text-sm font-bold border-2',
                    d === 10 ? 'bg-purple-600/30 text-purple-500 border-purple-500'
                      : d === 1 ? 'bg-purple-900/40 text-purple-300 border-purple-700'
                      : d >= 6 ? 'bg-green-500/20 text-green-500 border-purple-600/60'
                      : 'bg-muted text-muted-foreground border-purple-600/40',
                  )}>{d}</span>
                ))}
              </div>
            </div>
          )}
          <div className="text-center space-y-2 pt-2 border-t border-border">
            {result.isQuietCritical && (
              <Badge className="bg-yellow-500 text-sm px-3 py-1 flex items-center gap-1 mx-auto w-fit">
                <Sparkles className="w-4 h-4" /> Quiet Critical
              </Badge>
            )}
            {result.isBacklash && (
              <Badge variant="destructive" className="text-sm px-3 py-1 flex items-center gap-1 mx-auto w-fit">
                <AlertTriangle className="w-4 h-4" /> Backlash
              </Badge>
            )}
            <div>
              <span className="text-3xl font-bold font-medieval">{result.totalSuccesses}</span>
              <span className="text-sm text-muted-foreground ml-2">/ {result.difficulty} sucessos</span>
            </div>
            <Badge variant={result.passed ? 'default' : 'secondary'}
              className={cn('text-sm px-3 py-1', result.passed && 'bg-green-600')}>
              {result.passed ? 'Sucesso' : 'Falha'}
              {result.margin !== 0 && (
                <span className="ml-1 opacity-80">({result.margin > 0 ? '+' : ''}{result.margin})</span>
              )}
            </Badge>
            {result.critBonus > 0 && (
              <p className="text-xs text-muted-foreground">+{result.critBonus} de crítico (pares de 10)</p>
            )}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={onTestComplete}>OK</Button>
        </CardContent>
      </Card>
    );
  }

  const getLabel = () => {
    if (config.testType === 'attribute_ability') return `${config.attribute ?? ''} + ${config.ability ?? ''}`;
    if (config.testType === 'attribute_only') return config.attribute ?? '';
    if (config.testType === 'willpower') return 'Vontade';
    if (config.testType === 'arete') return 'Arête';
    if (config.testType === 'quintessence') return 'Quintessência';
    if (config.testType === 'raw_dice') return `${config.diceCount ?? 1} dados`;
    return config.testType;
  };

  return (
    <Card className="medieval-card border-2 border-purple-600 animate-pulse-slow">
      <CardHeader className="pb-2">
        <CardTitle className="font-medieval text-base flex items-center gap-2">
          <Dices className="w-5 h-5 text-purple-600" />
          Teste solicitado
          {config.isPrivate && <Lock className="w-4 h-4 text-muted-foreground ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <p className="font-medieval text-purple-600">{getLabel()}</p>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>Sucessos necessários: {config.difficulty}</span>
            <span>•</span>
            <span>Pool: {dicePool}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-600" /> {effectiveParadox} de Paradoxo
            </span>
          </div>
          {config.context && <p className="text-sm text-muted-foreground italic">"{config.context}"</p>}
        </div>
        <Button onClick={handleRoll} disabled={isRolling}
          className="w-full h-14 md:h-10 bg-purple-600 hover:bg-purple-700 text-white" size="lg">
          {isRolling ? <span className="animate-pulse">Rolando...</span>
            : <><Dices className="w-4 h-4 mr-2" /> Rolar</>}
        </Button>
      </CardContent>
    </Card>
  );
}

export default M5PendingTest;
