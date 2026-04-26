import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dices, Lock, Star, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import {
  VampiroCharacterData,
  TestType,
  performRoll,
  getAttributeValue,
  getAbilityValue,
  getVirtueValue,
  calculateHealthPenalty,
} from '@/lib/vampiro/diceUtils';
import { getFormAttributeModifier } from '@/lib/lobisomem/diceUtils';
import type { LobisomemCharacterData } from '@/lib/lobisomem/diceUtils';
import {
  getMetamorphForm,
  applyMetamorphAttribute,
} from '@/lib/metamorfos/formUtils';

interface TestConfig {
  testType: TestType;
  attribute?: string;
  ability?: string;
  virtue?: string;
  diceCount?: number;
  difficulty: number;
  context: string;
  isPrivate: boolean;
  applyHealthPenalty: boolean;
  isSpecialized: boolean;
  targetCharacterIds: string[];
}

interface VampirePendingTestProps {
  sessionId: string;
  sceneId: string | null;
  characterId: string;
  characterName: string;
  vampiroData: VampiroCharacterData;
  testEvent: {
    id: string;
    event_data: TestConfig;
    created_at: string;
  };
  onTestComplete: () => void;
  /** Werewolf: current form for attribute modifiers */
  currentForm?: string;
  /** Game system identifier */
  gameSystem?: string;
}

export function VampirePendingTest({
  sessionId,
  sceneId,
  characterId,
  characterName,
  vampiroData,
  testEvent,
  onTestComplete,
  currentForm,
  gameSystem,
}: VampirePendingTestProps) {
  const t = useTranslation();
  const { toast } = useToast();

  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<{
    baseResults: number[];
    extraResults: number[];
    successes: number;
    onesCount: number;
    tensCount: number;
    finalSuccesses: number;
    isBotch: boolean;
    isExceptional: boolean;
  } | null>(null);

  const config = testEvent.event_data;

  // Calculate dice pool
  const calculatePool = (): number => {
    let pool = 0;
    const isWerewolf = gameSystem === 'lobisomem_w20';
    const isMetamorph = gameSystem === 'metamorfos_w20';
    const lobData = (isWerewolf || isMetamorph)
      ? (vampiroData as unknown as LobisomemCharacterData)
      : null;
    const metamorphForm = isMetamorph ? getMetamorphForm(lobData, currentForm) : null;

    switch (config.testType) {
      case 'raw_dice':
        pool = config.diceCount || 1;
        break;
      case 'attribute_ability':
        if (config.attribute && config.ability) {
          let attrVal = getAttributeValue(vampiroData, config.attribute);
          if (isWerewolf && currentForm) {
            attrVal += getFormAttributeModifier(currentForm, config.attribute);
            attrVal = Math.max(attrVal, 0);
          } else if (isMetamorph) {
            attrVal = applyMetamorphAttribute(metamorphForm, config.attribute, attrVal);
          }
          pool = attrVal + getAbilityValue(vampiroData, config.ability);
        }
        break;
      case 'attribute_only':
        if (config.attribute) {
          let attrVal = getAttributeValue(vampiroData, config.attribute);
          if (isWerewolf && currentForm) {
            attrVal += getFormAttributeModifier(currentForm, config.attribute);
            attrVal = Math.max(attrVal, 0);
          } else if (isMetamorph) {
            attrVal = applyMetamorphAttribute(metamorphForm, config.attribute, attrVal);
          }
          pool = Math.max(attrVal, 0);
        }
        break;
      case 'willpower':
        pool = ((isWerewolf || isMetamorph) ? lobData?.willpower : vampiroData.willpower) || 1;
        break;
      case 'humanity':
        pool = (vampiroData as VampiroCharacterData).humanity || 1;
        break;
      case 'virtue':
        if (config.virtue) {
          pool = getVirtueValue(vampiroData, config.virtue);
        }
        break;
      default:
        // Werewolf/Metamorph-specific test types
        if ((config.testType as string) === 'gnosis') {
          pool = lobData?.gnosis ?? 1;
        } else if ((config.testType as string) === 'rage') {
          pool = lobData?.rage ?? 1;
        } else if ((config.testType as string) === 'arete') {
          // Mago: pool = Arête (1-10)
          pool = (vampiroData as any).arete ?? 1;
        } else if ((config.testType as string) === 'quintessence') {
          // Mago: pool = Quintessência (0-20)
          pool = (vampiroData as any).quintessence ?? 1;
        }
        break;
    }

    // Apply health penalty if enabled
    // TODO: Get actual health damage from character state

    return Math.max(pool, 1);
  };

  const dicePool = calculatePool();

  const handleRoll = async () => {
    setIsRolling(true);

    // Simulate dice rolling delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result = performRoll(dicePool, config.difficulty, config.isSpecialized);
    setRollResult(result);

    // Save result to session events
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
          base_results: result.baseResults,
          extra_results: result.extraResults,
          successes: result.successes,
          ones_count: result.onesCount,
          tens_count: result.tensCount,
          final_successes: result.finalSuccesses,
          is_botch: result.isBotch,
          is_exceptional: result.isExceptional,
          is_private: config.isPrivate,
        })),
      }]);

      toast({
        title: result.isBotch
          ? t.vampiroTests.botch
          : result.isExceptional
            ? t.vampiroTests.exceptional
            : result.finalSuccesses > 0
              ? t.vampiroTests.success
              : t.vampiroTests.failure,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error saving test result:', error);
    }

    setIsRolling(false);
  };

  // Get test label
  const getTestLabel = () => {
    if (config.testType === 'attribute_ability') {
      const attrLabel = t.vampiro[config.attribute as keyof typeof t.vampiro] || config.attribute;
      const abilityLabel = t.vampiro[config.ability as keyof typeof t.vampiro] || config.ability;
      return `${attrLabel} + ${abilityLabel}`;
    }
    if (config.testType === 'attribute_only') {
      const attrLabel = t.vampiro[config.attribute as keyof typeof t.vampiro] || config.attribute;
      return attrLabel;
    }
    if (config.testType === 'willpower') return t.vampiro.willpower;
    if (config.testType === 'humanity') return t.vampiro.humanity;
    if (config.testType === 'virtue') {
      return t.vampiro[config.virtue as keyof typeof t.vampiro] || config.virtue;
    }
    if (config.testType === 'raw_dice') {
      return `${config.diceCount || 1} ${t.vampiroTests.rawDice}`;
    }
    return '';
  };

  if (rollResult) {
    return (
      <Card className="medieval-card border-2 border-destructive animate-in fade-in-50">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            {rollResult.isBotch ? (
              <XCircle className="w-5 h-5 text-destructive" />
            ) : rollResult.isExceptional ? (
              <Star className="w-5 h-5 text-yellow-500" />
            ) : rollResult.finalSuccesses > 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
            )}
            {t.vampiroTests.result}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Dice Results */}
          <div className="flex flex-wrap gap-1 justify-center">
            {rollResult.baseResults.map((die, i) => (
              <div
                key={`base-${i}`}
                className={`w-12 h-12 md:w-8 md:h-8 rounded flex items-center justify-center font-bold text-sm border-2 ${
                  die >= config.difficulty
                    ? 'bg-green-500/20 border-green-500 text-green-500'
                    : die === 1
                      ? 'bg-destructive/20 border-destructive text-destructive'
                      : 'bg-muted border-border text-muted-foreground'
                }`}
              >
                {die}
              </div>
            ))}
            {rollResult.extraResults.map((die, i) => (
              <div
                key={`extra-${i}`}
                className={`w-12 h-12 md:w-8 md:h-8 rounded flex items-center justify-center font-bold text-sm border-2 border-dashed ${
                  die >= config.difficulty
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                    : die === 1
                      ? 'bg-destructive/20 border-destructive text-destructive'
                      : 'bg-muted border-border text-muted-foreground'
                }`}
                title={t.vampiroTests.extraDice}
              >
                {die}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground text-xs">{t.vampiroTests.successes}</p>
              <p className="font-bold text-green-500">{rollResult.successes}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-xs">{t.vampiroTests.ones}</p>
              <p className="font-bold text-destructive">{rollResult.onesCount}</p>
            </div>
            {config.isSpecialized && (
              <div className="text-center">
                <p className="text-muted-foreground text-xs">{t.vampiroTests.tens}</p>
                <p className="font-bold text-yellow-500">{rollResult.tensCount}</p>
              </div>
            )}
          </div>

          {/* Final Result */}
          <div className="text-center pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">{t.vampiroTests.finalResult}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              {rollResult.isBotch ? (
                <Badge variant="destructive" className="text-base px-4 py-1">
                  {t.vampiroTests.botch}
                </Badge>
              ) : rollResult.isExceptional ? (
                <Badge className="bg-yellow-500 text-base px-4 py-1">
                  {t.vampiroTests.exceptional}
                </Badge>
              ) : rollResult.finalSuccesses > 0 ? (
                <Badge variant="default" className="bg-green-600 text-base px-4 py-1">
                  {rollResult.finalSuccesses} {t.vampiroTests.successes}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-base px-4 py-1">
                  {t.vampiroTests.failure}
                </Badge>
              )}
            </div>
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

  return (
    <Card className="medieval-card border-2 border-destructive animate-pulse-slow">
      <CardHeader className="pb-2">
        <CardTitle className="font-medieval text-base flex items-center gap-2">
          <Dices className="w-5 h-5 text-destructive" />
          {t.vampiroTests.requestTest}
          {config.isPrivate && (
            <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Test Info */}
        <div className="space-y-1">
          <p className="font-medieval text-destructive">{getTestLabel()}</p>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span>
              {t.vampiroTests.difficulty}: {config.difficulty}
            </span>
            <span>•</span>
            <span>
              {t.vampiroTests.dicePool}: {dicePool}
            </span>
          </div>
          {config.context && (
            <p className="text-sm text-muted-foreground italic">"{config.context}"</p>
          )}
        </div>

        {/* Modifiers */}
        <div className="flex flex-wrap gap-1">
          {config.isSpecialized && (
            <Badge variant="outline" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              {t.vampiroTests.specialization}
            </Badge>
          )}
          {config.applyHealthPenalty && (
            <Badge variant="outline" className="text-xs text-destructive">
              {t.vampiroTests.healthPenalty}
            </Badge>
          )}
        </div>

        {/* Roll Button */}
        <Button
          onClick={handleRoll}
          disabled={isRolling}
          className="w-full h-14 md:h-10 bg-destructive hover:bg-destructive/90"
          size="lg"
        >
          {isRolling ? (
            <span className="animate-pulse">{t.vampiroTests.rolling}</span>
          ) : (
            <>
              <Dices className="w-4 h-4 mr-2" />
              {t.vampiroTests.rollDice}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
