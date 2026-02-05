import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dices, Lock, Heart, Star, Users } from 'lucide-react';
import {
  TestType,
  ALL_ATTRIBUTES,
  ALL_ABILITIES,
  VIRTUES,
  PHYSICAL_ATTRIBUTES,
  SOCIAL_ATTRIBUTES,
  MENTAL_ATTRIBUTES,
  TALENTS,
  SKILLS,
  KNOWLEDGES,
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

export default function VampireTestRequestModal({
  open,
  onOpenChange,
  participants,
  onRequestTest,
}: VampireTestRequestModalProps) {
  const t = useTranslation();
  
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
  const [selectAll, setSelectAll] = useState<boolean>(true);

  // Filter participants with characters
  const playersWithCharacters = participants.filter(p => p.character_id && p.character);

  const handleSubmit = () => {
    const targetIds = selectAll 
      ? playersWithCharacters.map(p => p.character_id!).filter(Boolean)
      : selectedPlayers;

    if (targetIds.length === 0) return;

    const config: TestConfig = {
      testType,
      attribute: testType === 'attribute_ability' ? attribute : undefined,
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
    setSelectAll(true);
  };

  const togglePlayer = (characterId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
    setSelectAll(false);
  };

  const isValid = () => {
    if (testType === 'attribute_ability' && (!attribute || !ability)) return false;
    if (testType === 'virtue' && !virtue) return false;
    const targetCount = selectAll ? playersWithCharacters.length : selectedPlayers.length;
    return targetCount > 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Dices className="w-5 h-5 text-destructive" />
            {t.vampiroTests.configureTest}
          </DialogTitle>
          <DialogDescription>
            {t.vampiroTests.difficultyDefault}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto max-h-[60vh]">
          {/* Test Type */}
          <div className="space-y-2">
            <Label>{t.vampiroTests.testType}</Label>
            <Select value={testType} onValueChange={(v) => setTestType(v as TestType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attribute_ability">{t.vampiroTests.attributeAbility}</SelectItem>
                <SelectItem value="willpower">{t.vampiroTests.willpowerOnly}</SelectItem>
                <SelectItem value="humanity">{t.vampiroTests.humanityOnly}</SelectItem>
                <SelectItem value="virtue">{t.vampiroTests.virtueOnly}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attribute + Ability selectors */}
          {testType === 'attribute_ability' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t.vampiroTests.selectAttribute}</Label>
                <Select value={attribute} onValueChange={setAttribute}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.vampiroTests.selectAttribute} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t.vampiro.physical}</SelectLabel>
                      {PHYSICAL_ATTRIBUTES.map(attr => (
                        <SelectItem key={attr} value={attr}>
                          {t.vampiro[attr]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>{t.vampiro.social}</SelectLabel>
                      {SOCIAL_ATTRIBUTES.map(attr => (
                        <SelectItem key={attr} value={attr}>
                          {t.vampiro[attr]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>{t.vampiro.mental}</SelectLabel>
                      {MENTAL_ATTRIBUTES.map(attr => (
                        <SelectItem key={attr} value={attr}>
                          {t.vampiro[attr]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t.vampiroTests.selectAbility}</Label>
                <Select value={ability} onValueChange={setAbility}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.vampiroTests.selectAbility} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t.vampiro.talents}</SelectLabel>
                      {TALENTS.map(ab => (
                        <SelectItem key={ab} value={ab}>
                          {t.vampiro[ab]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>{t.vampiro.skills}</SelectLabel>
                      {SKILLS.map(ab => (
                        <SelectItem key={ab} value={ab}>
                          {t.vampiro[ab]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>{t.vampiro.knowledges}</SelectLabel>
                      {KNOWLEDGES.map(ab => (
                        <SelectItem key={ab} value={ab}>
                          {t.vampiro[ab]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Virtue selector */}
          {testType === 'virtue' && (
            <div className="space-y-2">
              <Label>{t.vampiroTests.selectVirtue}</Label>
              <Select value={virtue} onValueChange={setVirtue}>
                <SelectTrigger>
                  <SelectValue placeholder={t.vampiroTests.selectVirtue} />
                </SelectTrigger>
                <SelectContent>
                  {VIRTUES.map(v => (
                    <SelectItem key={v} value={v}>
                      {t.vampiro[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Difficulty */}
          <div className="space-y-2">
            <Label>{t.vampiroTests.difficulty}</Label>
            <Input
              type="number"
              min={2}
              max={10}
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value) || 6)}
              className="w-24"
            />
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label>{t.vampiroTests.context}</Label>
            <Textarea
              placeholder={t.vampiroTests.contextPlaceholder}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
            />
          </div>

          {/* Switches */}
          <div className="space-y-3 pt-2">
            {/* Private Test */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="private" className="font-normal cursor-pointer">
                    {t.vampiroTests.privateTest}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t.vampiroTests.privateTestDesc}
                  </p>
                </div>
              </div>
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>

            {/* Health Penalty */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="health" className="font-normal cursor-pointer">
                    {t.vampiroTests.applyHealthPenalty}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t.vampiroTests.healthPenaltyDesc}
                  </p>
                </div>
              </div>
              <Switch
                id="health"
                checked={applyHealthPenalty}
                onCheckedChange={setApplyHealthPenalty}
              />
            </div>

            {/* Specialized Test */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="specialized" className="font-normal cursor-pointer">
                    {t.vampiroTests.specializedTest}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t.vampiroTests.specializedTestDesc}
                  </p>
                </div>
              </div>
              <Switch
                id="specialized"
                checked={isSpecialized}
                onCheckedChange={setIsSpecialized}
              />
            </div>
          </div>

          {/* Player Selection */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Label>{t.vampiroTests.selectPlayers}</Label>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="all-players"
                  checked={selectAll}
                  onCheckedChange={(checked) => {
                    setSelectAll(checked === true);
                    if (checked) setSelectedPlayers([]);
                  }}
                />
                <Label htmlFor="all-players" className="font-normal cursor-pointer">
                  {t.vampiroTests.allPlayers}
                </Label>
                <Badge variant="secondary" className="text-xs">
                  {playersWithCharacters.length}
                </Badge>
              </div>

              {!selectAll && (
                <div className="pl-6 space-y-1">
                  {playersWithCharacters.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`player-${p.character_id}`}
                        checked={selectedPlayers.includes(p.character_id!)}
                        onCheckedChange={() => togglePlayer(p.character_id!)}
                      />
                      <Label 
                        htmlFor={`player-${p.character_id}`} 
                        className="font-normal cursor-pointer"
                      >
                        {p.character?.name || 'Unknown'}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isValid()}
            className="bg-destructive hover:bg-destructive/90"
          >
            <Dices className="w-4 h-4 mr-1" />
            {t.vampiroTests.requestTest}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
