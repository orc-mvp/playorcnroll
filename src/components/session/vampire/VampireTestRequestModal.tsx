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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dices, Lock, Heart, Star, Users, ChevronRight, MessageSquare, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TestType,
  ALL_ATTRIBUTES,
  ALL_ABILITIES,
  VIRTUES,
} from '@/lib/vampiro/diceUtils';

interface Participant {
  id: string;
  user_id: string;
  character_id: string | null;
  character?: {
    id: string;
    name: string;
  } | null;
}

interface VampireTestRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  onRequestTest: (testConfig: TestConfig) => void;
}

export interface TestConfig {
  testType: TestType;
  attribute?: string;
  ability?: string;
  virtue?: string;
  difficulty: number;
  context: string;
  isPrivate: boolean;
  applyHealthPenalty: boolean;
  isSpecialized: boolean;
  targetCharacterIds: string[];
}

// Test type options for the toggle buttons
const TEST_TYPES: { value: TestType; labelKey: string }[] = [
  { value: 'attribute_ability', labelKey: 'attributeAbility' },
  { value: 'attribute_only', labelKey: 'attributeOnly' },
  { value: 'willpower', labelKey: 'willpowerOnly' },
  { value: 'humanity', labelKey: 'humanityOnly' },
  { value: 'virtue', labelKey: 'virtueOnly' },
];

export default function VampireTestRequestModal({
  open,
  onOpenChange,
  participants,
  onRequestTest,
}: VampireTestRequestModalProps) {
  const { t, language } = useI18n();
  
  const [testType, setTestType] = useState<TestType>('attribute_ability');
  const [attribute, setAttribute] = useState<string>('');
  const [ability, setAbility] = useState<string>('');
  const [virtue, setVirtue] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(6);
  const [context, setContext] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [applyHealthPenalty, setApplyHealthPenalty] = useState<boolean>(false);
  const [isSpecialized, setIsSpecialized] = useState<boolean>(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [contextOpen, setContextOpen] = useState<boolean>(false);

  // Filter participants with characters
  const playersWithCharacters = participants.filter(p => p.character_id && p.character);

  const handleSubmit = () => {
    const targetIds = selectAll 
      ? playersWithCharacters.map(p => p.character_id!).filter(Boolean)
      : selectedPlayers;

    if (targetIds.length === 0) return;

    const config: TestConfig = {
      testType,
      attribute: (testType === 'attribute_ability' || testType === 'attribute_only') ? attribute : undefined,
      ability: testType === 'attribute_ability' ? ability : undefined,
      virtue: testType === 'virtue' ? virtue : undefined,
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
    setVirtue('');
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
      // Switching from "all" to individual: select everyone except the toggled one
      const allIds = playersWithCharacters.map(p => p.character_id!).filter(Boolean);
      setSelectedPlayers(allIds.filter(id => id !== characterId));
      setSelectAll(false);
    } else {
      setSelectedPlayers(prev => {
        const next = prev.includes(characterId)
          ? prev.filter(id => id !== characterId)
          : [...prev, characterId];
        // If all are selected individually, switch to selectAll
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
    if (testType === 'virtue' && !virtue) return false;
    const targetCount = selectAll ? playersWithCharacters.length : selectedPlayers.length;
    return targetCount > 0;
  };

  // Generate dynamic button label with character names and test type
  const getButtonLabel = useMemo(() => {
    // Get test type label
    const getTestTypeLabel = () => {
      switch (testType) {
        case 'attribute_ability':
          if (!attribute || !ability) return '';
          const attrLabel = t.vampiro[attribute as keyof typeof t.vampiro] || attribute;
          const abilLabel = t.vampiro[ability as keyof typeof t.vampiro] || ability;
          return `${attrLabel} + ${abilLabel}`;
        case 'attribute_only':
          if (!attribute) return '';
          return t.vampiro[attribute as keyof typeof t.vampiro] || attribute;
        case 'willpower':
          return t.vampiro.willpower;
        case 'humanity':
          return t.vampiro.humanity;
        case 'virtue':
          if (!virtue) return '';
          return t.vampiro[virtue as keyof typeof t.vampiro] || virtue;
        default:
          return '';
      }
    };

    const testLabel = getTestTypeLabel();
    
    // Get target names
    const targetNames = selectAll 
      ? playersWithCharacters.map(p => p.character?.name || '').filter(Boolean)
      : selectedPlayers.map(id => 
          playersWithCharacters.find(p => p.character_id === id)?.character?.name || ''
        ).filter(Boolean);

    if (targetNames.length === 0 || !testLabel) {
      return t.vampiroTests.requestTest;
    }

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
  }, [testType, attribute, ability, virtue, selectAll, selectedPlayers, playersWithCharacters, language, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Dices className="w-5 h-5 text-destructive" />
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
                  testType === value && "bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30"
                )}
              >
                {t.vampiroTests[labelKey as keyof typeof t.vampiroTests]}
              </Button>
            ))}
          </div>

          {/* Attribute + Ability Grid */}
          {(testType === 'attribute_ability' || testType === 'attribute_only') && (
            <div className="space-y-3">
              {/* Attributes Grid - 3x3 */}
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
                        attribute === attr && "bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30"
                      )}
                    >
                      {t.vampiro[attr as keyof typeof t.vampiro]}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Abilities Grid - Only for attribute_ability */}
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
                        ability === ab && "bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30"
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

          {/* Virtue Grid */}
          {testType === 'virtue' && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t.vampiroTests.selectVirtue}</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {VIRTUES.map(v => (
                  <Button
                    key={v}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVirtue(v)}
                    className={cn(
                      "min-h-[44px] text-xs font-medium",
                      virtue === v && "bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30"
                    )}
                  >
                    {t.vampiro[v as keyof typeof t.vampiro]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty - Inline */}
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

          {/* Collapsible Context */}
          <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground gap-2 h-8"
              >
                <ChevronRight className={cn("w-4 h-4 transition-transform", contextOpen && "rotate-90")} />
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">{t.vampiroTests.addContext || "Adicionar contexto (opcional)"}</span>
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

          {/* Options - 2 column grid on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg">
            {/* Private Test */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Label htmlFor="private" className="font-normal cursor-pointer text-sm truncate">
                  {t.vampiroTests.privateTest}
                </Label>
              </div>
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>

            {/* Health Penalty */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Heart className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Label htmlFor="health" className="font-normal cursor-pointer text-sm truncate">
                  {t.vampiroTests.applyHealthPenalty}
                </Label>
              </div>
              <Switch
                id="health"
                checked={applyHealthPenalty}
                onCheckedChange={setApplyHealthPenalty}
              />
            </div>

            {/* Specialized Test */}
            <div className="flex items-center justify-between gap-2 md:col-span-2">
              <div className="flex items-center gap-2 min-w-0">
                <Star className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Label htmlFor="specialized" className="font-normal cursor-pointer text-sm truncate">
                  {t.vampiroTests.specializedTest}
                </Label>
              </div>
              <Switch
                id="specialized"
                checked={isSpecialized}
                onCheckedChange={setIsSpecialized}
              />
            </div>
          </div>

          {/* Player Selection - Toggle Buttons */}
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
                  "min-h-[44px] md:min-h-[36px] text-xs",
                  selectAll && "bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30"
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
                      "min-h-[44px] md:min-h-[36px] text-xs",
                      isSelected && "bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30"
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
            className="bg-destructive hover:bg-destructive/90 text-sm"
          >
            <Dices className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate max-w-[200px] md:max-w-[300px]">{getButtonLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
