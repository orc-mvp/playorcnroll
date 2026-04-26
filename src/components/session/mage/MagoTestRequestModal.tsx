import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n/context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dices, Lock, Heart, Star, Users, ChevronRight, MessageSquare, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ALL_ATTRIBUTES,
  WOD_TALENTS,
  WOD_SKILLS,
  WOD_KNOWLEDGES,
} from '@/lib/vampiro/diceUtils';

/**
 * Modal de solicitação de teste — Mago: A Ascensão (M20)
 *
 * Espelha o WerewolfTestRequestModal, trocando Gnose/Fúria por
 * Arête/Quintessência e adotando o tema roxo do sistema.
 */

export type MagoTestType =
  | 'attribute_ability'
  | 'attribute_only'
  | 'willpower'
  | 'arete'
  | 'quintessence'
  | 'raw_dice';

interface Participant {
  id: string;
  user_id: string;
  character_id: string | null;
  character?: {
    id: string;
    name: string;
  } | null;
}

interface MagoTestRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  onRequestTest: (testConfig: MagoTestConfig) => void;
}

export interface MagoTestConfig {
  testType: MagoTestType;
  attribute?: string;
  ability?: string;
  diceCount?: number;
  difficulty: number;
  context: string;
  isPrivate: boolean;
  applyHealthPenalty: boolean;
  isSpecialized: boolean;
  targetCharacterIds: string[];
}

const TEST_TYPES: { value: MagoTestType; labelKey: string; magoLabelKey?: string }[] = [
  { value: 'attribute_ability', labelKey: 'attributeAbility' },
  { value: 'attribute_only', labelKey: 'attributeOnly' },
  { value: 'willpower', labelKey: 'willpowerOnly' },
  { value: 'arete', labelKey: 'areteOnly', magoLabelKey: 'areteOnly' },
  { value: 'quintessence', labelKey: 'quintessenceOnly', magoLabelKey: 'quintessenceOnly' },
  { value: 'raw_dice', labelKey: 'rawDice' },
];

export default function MagoTestRequestModal({
  open,
  onOpenChange,
  participants,
  onRequestTest,
}: MagoTestRequestModalProps) {
  const { t, language } = useI18n();

  const [testType, setTestType] = useState<MagoTestType>('attribute_ability');
  const [attribute, setAttribute] = useState<string>('');
  const [ability, setAbility] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(6);
  const [context, setContext] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [applyHealthPenalty, setApplyHealthPenalty] = useState<boolean>(false);
  const [isSpecialized, setIsSpecialized] = useState<boolean>(false);
  const [diceCount, setDiceCount] = useState<number>(1);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [contextOpen, setContextOpen] = useState<boolean>(false);

  const playersWithCharacters = participants.filter((p) => p.character_id && p.character);

  const handleSubmit = () => {
    const targetIds = selectAll
      ? playersWithCharacters.map((p) => p.character_id!).filter(Boolean)
      : selectedPlayers;

    if (targetIds.length === 0) return;

    const config: MagoTestConfig = {
      testType,
      attribute:
        testType === 'attribute_ability' || testType === 'attribute_only' ? attribute : undefined,
      ability: testType === 'attribute_ability' ? ability : undefined,
      diceCount: testType === 'raw_dice' ? diceCount : undefined,
      difficulty,
      context,
      isPrivate,
      applyHealthPenalty,
      isSpecialized,
      targetCharacterIds: targetIds,
    };

    onRequestTest(config);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTestType('attribute_ability');
    setAttribute('');
    setAbility('');
    setDifficulty(6);
    setDiceCount(1);
    setContext('');
    setIsPrivate(false);
    setApplyHealthPenalty(false);
    setIsSpecialized(false);
    setSelectedPlayers([]);
    setSelectAll(false);
    setContextOpen(false);
  };

  const togglePlayer = (characterId: string) => {
    if (selectAll) {
      const allIds = playersWithCharacters.map((p) => p.character_id!).filter(Boolean);
      setSelectedPlayers(allIds.filter((id) => id !== characterId));
      setSelectAll(false);
    } else {
      setSelectedPlayers((prev) => {
        const next = prev.includes(characterId)
          ? prev.filter((id) => id !== characterId)
          : [...prev, characterId];
        if (next.length === playersWithCharacters.length) {
          setSelectAll(true);
          return [];
        }
        return next;
      });
    }
  };

  const isValid = () => {
    if (testType === 'attribute_ability' && (!attribute || !ability)) return false;
    if (testType === 'attribute_only' && !attribute) return false;
    const targetCount = selectAll ? playersWithCharacters.length : selectedPlayers.length;
    return targetCount > 0;
  };

  const getTestTypeLabel = (type: MagoTestType) => {
    if (type === 'arete') return t.mago?.areteOnly || 'Arête';
    if (type === 'quintessence') return t.mago?.quintessenceOnly || 'Quintessência';
    const def = TEST_TYPES.find((tt) => tt.value === type);
    return t.vampiroTests?.[def?.labelKey as keyof typeof t.vampiroTests] || type;
  };

  const getButtonLabel = useMemo(() => {
    const getLabel = () => {
      switch (testType) {
        case 'attribute_ability':
          if (!attribute || !ability) return '';
          return `${t.vampiro[attribute as keyof typeof t.vampiro] || attribute} + ${
            t.vampiro[ability as keyof typeof t.vampiro] || ability
          }`;
        case 'attribute_only':
          if (!attribute) return '';
          return t.vampiro[attribute as keyof typeof t.vampiro] || attribute;
        case 'willpower':
          return t.vampiro.willpower;
        case 'arete':
          return t.mago?.areteOnly || 'Arête';
        case 'quintessence':
          return t.mago?.quintessenceOnly || 'Quintessência';
        case 'raw_dice':
          return `${diceCount} ${t.vampiroTests.rawDice}`;
        default:
          return '';
      }
    };

    const testLabel = getLabel();
    const targetNames = selectAll
      ? playersWithCharacters.map((p) => p.character?.name || '').filter(Boolean)
      : selectedPlayers
          .map(
            (id) => playersWithCharacters.find((p) => p.character_id === id)?.character?.name || '',
          )
          .filter(Boolean);

    if (targetNames.length === 0 || !testLabel) return t.vampiroTests.requestTest;

    if (selectAll && playersWithCharacters.length > 1) {
      return language === 'pt-BR'
        ? `Todos testem ${testLabel}`
        : `Everyone test ${testLabel}`;
    }
    if (targetNames.length === 1) {
      return language === 'pt-BR'
        ? `${targetNames[0]} faça um teste de ${testLabel}`
        : `${targetNames[0]} make a ${testLabel} test`;
    }
    return language === 'pt-BR'
      ? `${targetNames.join(', ')} testem ${testLabel}`
      : `${targetNames.join(', ')} test ${testLabel}`;
  }, [testType, attribute, ability, diceCount, selectAll, selectedPlayers, playersWithCharacters, language, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Dices className="w-5 h-5 text-purple-500" />
            {t.vampiroTests.configureTest}
          </DialogTitle>
          <DialogDescription>{t.vampiroTests.difficultyDefault}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Test Type */}
          <div className="flex flex-wrap gap-1.5">
            {TEST_TYPES.map(({ value, labelKey }) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTestType(value)}
                className={cn(
                  'min-h-[36px] text-xs',
                  testType === value &&
                    'bg-purple-500/20 border-purple-500 text-purple-600 hover:bg-purple-500/30',
                )}
              >
                {value === 'arete' || value === 'quintessence'
                  ? getTestTypeLabel(value)
                  : t.vampiroTests[labelKey as keyof typeof t.vampiroTests]}
              </Button>
            ))}
          </div>

          {/* Attribute + Ability */}
          {(testType === 'attribute_ability' || testType === 'attribute_only') && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t.vampiroTests.selectAttribute}
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ALL_ATTRIBUTES.map((attr) => (
                    <Button
                      key={attr}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAttribute(attr)}
                      className={cn(
                        'min-h-[44px] text-xs font-medium',
                        attribute === attr &&
                          'bg-purple-500/20 border-purple-500 text-purple-600 hover:bg-purple-500/30',
                      )}
                    >
                      {t.vampiro[attr as keyof typeof t.vampiro]}
                    </Button>
                  ))}
                </div>
              </div>

              {testType === 'attribute_ability' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t.vampiroTests.selectAbility}
                  </Label>
                  {(
                    [
                      { label: t.vampiro.talents, abilities: WOD_TALENTS },
                      { label: t.vampiro.skills, abilities: WOD_SKILLS },
                      { label: t.vampiro.knowledges, abilities: WOD_KNOWLEDGES },
                    ] as const
                  ).map(({ label, abilities }) => (
                    <div key={label}>
                      <span className="text-[10px] font-medieval text-muted-foreground/70 uppercase tracking-wider">
                        {label}
                      </span>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-1 mt-0.5">
                        {abilities.map((ab) => (
                          <Button
                            key={ab}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAbility(ab)}
                            className={cn(
                              'min-h-[44px] md:min-h-[36px] text-[10px] md:text-xs font-medium px-1.5',
                              ability === ab &&
                                'bg-purple-500/20 border-purple-500 text-purple-600 hover:bg-purple-500/30',
                            )}
                          >
                            {t.vampiro[ab as keyof typeof t.vampiro]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Raw Dice */}
          {testType === 'raw_dice' && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t.vampiroTests.rawDicePool}</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                  disabled={diceCount <= 1}
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="text-2xl font-bold w-10 text-center font-medieval">{diceCount}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setDiceCount(Math.min(20, diceCount + 1))}
                  disabled={diceCount >= 20}
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Difficulty */}
          <div className="flex items-center gap-3">
            <Label className="text-sm whitespace-nowrap">{t.vampiroTests.difficulty}:</Label>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setDifficulty(Math.max(2, difficulty - 1))}
              disabled={difficulty <= 2}
            >
              <Minus className="w-5 h-5" />
            </Button>
            <span className="text-2xl font-bold w-10 text-center font-medieval">{difficulty}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setDifficulty(Math.min(10, difficulty + 1))}
              disabled={difficulty >= 10}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Context */}
          <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground gap-2 h-8"
              >
                <ChevronRight
                  className={cn('w-4 h-4 transition-transform', contextOpen && 'rotate-90')}
                />
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">
                  {t.vampiroTests.addContext || 'Adicionar contexto (opcional)'}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Textarea
                placeholder={t.vampiroTests.contextPlaceholder}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Label
                  htmlFor="private-m"
                  className="font-normal cursor-pointer text-sm truncate"
                >
                  {t.vampiroTests.privateTest}
                </Label>
              </div>
              <Switch id="private-m" checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Heart className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Label htmlFor="health-m" className="font-normal cursor-pointer text-sm truncate">
                  {t.vampiroTests.applyHealthPenalty}
                </Label>
              </div>
              <Switch
                id="health-m"
                checked={applyHealthPenalty}
                onCheckedChange={setApplyHealthPenalty}
              />
            </div>
            <div className="flex items-center justify-between gap-2 md:col-span-2">
              <div className="flex items-center gap-2 min-w-0">
                <Star className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Label htmlFor="spec-m" className="font-normal cursor-pointer text-sm truncate">
                  {t.vampiroTests.specializedTest}
                </Label>
              </div>
              <Switch id="spec-m" checked={isSpecialized} onCheckedChange={setIsSpecialized} />
            </div>
          </div>

          {/* Player Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">{t.vampiroTests.selectPlayers}</Label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectAll(true);
                  setSelectedPlayers([]);
                }}
                className={cn(
                  'min-h-[44px] md:min-h-[36px] text-xs',
                  selectAll &&
                    'bg-purple-500/20 border-purple-500 text-purple-600 hover:bg-purple-500/30',
                )}
              >
                {t.vampiroTests.allPlayers}
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">
                  {playersWithCharacters.length}
                </Badge>
              </Button>
              {playersWithCharacters.map((p) => {
                const isSelected = selectAll || selectedPlayers.includes(p.character_id!);
                return (
                  <Button
                    key={p.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => togglePlayer(p.character_id!)}
                    className={cn(
                      'min-h-[44px] md:min-h-[36px] text-xs',
                      isSelected &&
                        'bg-purple-500/20 border-purple-500 text-purple-600 hover:bg-purple-500/30',
                    )}
                  >
                    {p.character?.name || 'Unknown'}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid()}
            className="bg-purple-500 hover:bg-purple-600 text-sm"
          >
            <Dices className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate max-w-[200px] md:max-w-[300px]">{getButtonLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
