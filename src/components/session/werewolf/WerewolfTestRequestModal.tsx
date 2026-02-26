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
  ALL_ABILITIES,
} from '@/lib/vampiro/diceUtils';
import type { WerewolfTestType } from '@/lib/lobisomem/diceUtils';

interface Participant {
  id: string;
  user_id: string;
  character_id: string | null;
  character?: {
    id: string;
    name: string;
  } | null;
}

interface WerewolfTestRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  onRequestTest: (testConfig: WerewolfTestConfig) => void;
}

export interface WerewolfTestConfig {
  testType: WerewolfTestType;
  attribute?: string;
  ability?: string;
  difficulty: number;
  context: string;
  isPrivate: boolean;
  applyHealthPenalty: boolean;
  isSpecialized: boolean;
  targetCharacterIds: string[];
}

// Test type options for werewolf (no humanity/virtue, add gnosis/rage)
const TEST_TYPES: { value: WerewolfTestType; labelKey: string }[] = [
  { value: 'attribute_ability', labelKey: 'attributeAbility' },
  { value: 'attribute_only', labelKey: 'attributeOnly' },
  { value: 'willpower', labelKey: 'willpowerOnly' },
  { value: 'gnosis', labelKey: 'gnosisOnly' },
  { value: 'rage', labelKey: 'rageOnly' },
];

export default function WerewolfTestRequestModal({
  open,
  onOpenChange,
  participants,
  onRequestTest,
}: WerewolfTestRequestModalProps) {
  const { t, language } = useI18n();

  const [testType, setTestType] = useState<WerewolfTestType>('attribute_ability');
  const [attribute, setAttribute] = useState<string>('');
  const [ability, setAbility] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(6);
  const [context, setContext] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [applyHealthPenalty, setApplyHealthPenalty] = useState<boolean>(false);
  const [isSpecialized, setIsSpecialized] = useState<boolean>(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [contextOpen, setContextOpen] = useState<boolean>(false);

  const playersWithCharacters = participants.filter(p => p.character_id && p.character);

  const handleSubmit = () => {
    const targetIds = selectAll
      ? playersWithCharacters.map(p => p.character_id!).filter(Boolean)
      : selectedPlayers;

    if (targetIds.length === 0) return;

    const config: WerewolfTestConfig = {
      testType,
      attribute: (testType === 'attribute_ability' || testType === 'attribute_only') ? attribute : undefined,
      ability: testType === 'attribute_ability' ? ability : undefined,
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
      const allIds = playersWithCharacters.map(p => p.character_id!).filter(Boolean);
      setSelectedPlayers(allIds.filter(id => id !== characterId));
      setSelectAll(false);
    } else {
      setSelectedPlayers(prev => {
        const next = prev.includes(characterId)
          ? prev.filter(id => id !== characterId)
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

  const getTestTypeLabel = (type: WerewolfTestType) => {
    switch (type) {
      case 'gnosis': return t.lobisomem?.gnosisOnly || 'Gnose';
      case 'rage': return t.lobisomem?.rageOnly || 'Fúria';
      default: return t.vampiroTests?.[TEST_TYPES.find(tt => tt.value === type)?.labelKey as keyof typeof t.vampiroTests] || type;
    }
  };

  const getButtonLabel = useMemo(() => {
    const getLabel = () => {
      switch (testType) {
        case 'attribute_ability':
          if (!attribute || !ability) return '';
          return `${t.vampiro[attribute as keyof typeof t.vampiro] || attribute} + ${t.vampiro[ability as keyof typeof t.vampiro] || ability}`;
        case 'attribute_only':
          if (!attribute) return '';
          return t.vampiro[attribute as keyof typeof t.vampiro] || attribute;
        case 'willpower':
          return t.vampiro.willpower;
        case 'gnosis':
          return t.lobisomem?.gnosis || 'Gnose';
        case 'rage':
          return t.lobisomem?.rage || 'Fúria';
        default:
          return '';
      }
    };

    const testLabel = getLabel();
    const targetNames = selectAll
      ? playersWithCharacters.map(p => p.character?.name || '').filter(Boolean)
      : selectedPlayers.map(id =>
          playersWithCharacters.find(p => p.character_id === id)?.character?.name || ''
        ).filter(Boolean);

    if (targetNames.length === 0 || !testLabel) return t.vampiroTests.requestTest;

    if (selectAll && playersWithCharacters.length > 1) {
      return language === 'pt-BR' ? `Todos testem ${testLabel}` : `Everyone test ${testLabel}`;
    }
    if (targetNames.length === 1) {
      return language === 'pt-BR'
        ? `${targetNames[0]} faça um teste de ${testLabel}`
        : `${targetNames[0]} make a ${testLabel} test`;
    }
    return language === 'pt-BR'
      ? `${targetNames.join(', ')} testem ${testLabel}`
      : `${targetNames.join(', ')} test ${testLabel}`;
  }, [testType, attribute, ability, selectAll, selectedPlayers, playersWithCharacters, language, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Dices className="w-5 h-5 text-emerald-500" />
            {t.vampiroTests.configureTest}
          </DialogTitle>
          <DialogDescription>
            {t.vampiroTests.difficultyDefault}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Test Type - Horizontal toggle buttons */}
          <div className="flex flex-wrap gap-1.5">
            {TEST_TYPES.map(({ value, labelKey }) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTestType(value)}
                className={cn(
                  "min-h-[36px] text-xs",
                  testType === value && "bg-emerald-500/20 border-emerald-500 text-emerald-600 hover:bg-emerald-500/30"
                )}
              >
                {value === 'gnosis' || value === 'rage'
                  ? getTestTypeLabel(value)
                  : t.vampiroTests[labelKey as keyof typeof t.vampiroTests]
                }
              </Button>
            ))}
          </div>

          {/* Attribute + Ability Grid */}
          {(testType === 'attribute_ability' || testType === 'attribute_only') && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t.vampiroTests.selectAttribute}</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ALL_ATTRIBUTES.map(attr => (
                    <Button
                      key={attr}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAttribute(attr)}
                      className={cn(
                        "min-h-[44px] text-xs font-medium",
                        attribute === attr && "bg-emerald-500/20 border-emerald-500 text-emerald-600 hover:bg-emerald-500/30"
                      )}
                    >
                      {t.vampiro[attr as keyof typeof t.vampiro]}
                    </Button>
                  ))}
                </div>
              </div>

              {testType === 'attribute_ability' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t.vampiroTests.selectAbility}</Label>
                  <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-1">
                    {ALL_ABILITIES.map(ab => (
                      <Button
                        key={ab}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAbility(ab)}
                        className={cn(
                          "min-h-[44px] md:min-h-[36px] text-[10px] md:text-xs font-medium px-1.5",
                          ability === ab && "bg-emerald-500/20 border-emerald-500 text-emerald-600 hover:bg-emerald-500/30"
                        )}
                      >
                        {t.vampiro[ab as keyof typeof t.vampiro]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Difficulty */}
          <div className="flex items-center gap-3">
            <Label className="text-sm whitespace-nowrap">{t.vampiroTests.difficulty}:</Label>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setDifficulty(Math.max(2, difficulty - 1))} disabled={difficulty <= 2}>
              <Minus className="w-5 h-5" />
            </Button>
            <span className="text-2xl font-bold w-10 text-center font-medieval">{difficulty}</span>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={() => setDifficulty(Math.min(10, difficulty + 1))} disabled={difficulty >= 10}>
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Context */}
          <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground gap-2 h-8">
                <ChevronRight className={cn("w-4 h-4 transition-transform", contextOpen && "rotate-90")} />
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">{t.vampiroTests.addContext || "Adicionar contexto (opcional)"}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Textarea placeholder={t.vampiroTests.contextPlaceholder} value={context} onChange={(e) => setContext(e.target.value)} rows={2} className="text-sm" />
            </CollapsibleContent>
          </Collapsible>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Label htmlFor="private-w" className="font-normal cursor-pointer text-sm truncate">{t.vampiroTests.privateTest}</Label>
              </div>
              <Switch id="private-w" checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Heart className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Label htmlFor="health-w" className="font-normal cursor-pointer text-sm truncate">{t.vampiroTests.applyHealthPenalty}</Label>
              </div>
              <Switch id="health-w" checked={applyHealthPenalty} onCheckedChange={setApplyHealthPenalty} />
            </div>
            <div className="flex items-center justify-between gap-2 md:col-span-2">
              <div className="flex items-center gap-2 min-w-0">
                <Star className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Label htmlFor="spec-w" className="font-normal cursor-pointer text-sm truncate">{t.vampiroTests.specializedTest}</Label>
              </div>
              <Switch id="spec-w" checked={isSpecialized} onCheckedChange={setIsSpecialized} />
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
                onClick={() => { setSelectAll(true); setSelectedPlayers([]); }}
                className={cn(
                  "min-h-[44px] md:min-h-[36px] text-xs",
                  selectAll && "bg-emerald-500/20 border-emerald-500 text-emerald-600 hover:bg-emerald-500/30"
                )}
              >
                {t.vampiroTests.allPlayers}
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{playersWithCharacters.length}</Badge>
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
                      "min-h-[44px] md:min-h-[36px] text-xs",
                      isSelected && "bg-emerald-500/20 border-emerald-500 text-emerald-600 hover:bg-emerald-500/30"
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid()}
            className="bg-emerald-500 hover:bg-emerald-600 text-sm"
          >
            <Dices className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate max-w-[200px] md:max-w-[300px]">{getButtonLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
