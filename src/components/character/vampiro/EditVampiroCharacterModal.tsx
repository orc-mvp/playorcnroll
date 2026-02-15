import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Shield, Brain, Sparkles, Heart, Users, Moon } from 'lucide-react';
import DotRating from './DotRating';

// Types
interface VampiroData {
  player?: string;
  chronicle?: string;
  nature?: string;
  demeanor?: string;
  clan?: string;
  generation?: string;
  sire?: string;
  attributes?: {
    physical: { strength: number; dexterity: number; stamina: number };
    social: { charisma: number; manipulation: number; appearance: number };
    mental: { perception: number; intelligence: number; wits: number };
  };
  abilities?: {
    talents: Record<string, number>;
    skills: Record<string, number>;
    knowledges: Record<string, number>;
  };
  specializations?: Record<string, string>;
  virtues?: {
    virtueType1: string;
    virtueValue1: number;
    virtueType2: string;
    virtueValue2: number;
    courage: number;
  };
  moralityType?: string;
  pathName?: string;
  humanity?: number;
  willpower?: number;
  disciplines?: Record<string, number>;
  backgrounds?: Record<string, number>;
}

interface Character {
  id: string;
  name: string;
  concept: string | null;
  vampiro_data: VampiroData | null;
}

interface EditVampiroCharacterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character;
  onSave: (updated: Character) => void;
}

const CLANS = [
  { value: 'Brujah', label: 'Brujah' },
  { value: 'Gangrel', label: 'Gangrel' },
  { value: 'Malkavian', label: 'Malkaviano' },
  { value: 'Nosferatu', label: 'Nosferatu' },
  { value: 'Toreador', label: 'Toreador' },
  { value: 'Tremere', label: 'Tremere' },
  { value: 'Ventrue', label: 'Ventrue' },
  { value: 'Lasombra', label: 'Lasombra' },
  { value: 'Tzimisce', label: 'Tzimisce' },
  { value: 'Assamita', label: 'Assamita' },
  { value: 'Setita', label: 'Seguidores de Set' },
  { value: 'Giovanni', label: 'Giovanni' },
  { value: 'Ravnos', label: 'Ravnos' },
  { value: 'Caitiff', label: 'Caitiff' },
];

const ARCHETYPES = [
  'Arquiteto', 'Autocrata', 'Bon Vivant', 'Bravo', 'Burocrata', 'Camaleão',
  'Capitalista', 'Cavaleiro', 'Celebrante', 'Competidor', 'Conformista',
  'Defensor', 'Devasso', 'Diretor', 'Fanático', 'Galante', 'Guru',
  'Idealista', 'Juiz', 'Loner', 'Mártir', 'Masoquista', 'Mediador',
  'Monstro', 'Oportunista', 'Pedagogo', 'Penitente', 'Perfeccionista',
  'Predador', 'Rebelde', 'Sádico', 'Sobrevivente', 'Soldado', 'Tradicionalista',
  'Visionário',
];

const ABILITY_NAMES: Record<string, Record<string, string>> = {
  talents: {
    alertness: 'Prontidão',
    athletics: 'Esportes',
    brawl: 'Briga',
    dodge: 'Esquiva',
    empathy: 'Empatia',
    expression: 'Expressão',
    intimidation: 'Intimidação',
    leadership: 'Liderança',
    streetwise: 'Manha',
    subterfuge: 'Lábia',
  },
  skills: {
    animalKen: 'Empatia c/ Animais',
    crafts: 'Ofícios',
    drive: 'Condução',
    etiquette: 'Etiqueta',
    firearms: 'Armas de Fogo',
    melee: 'Armas Brancas',
    performance: 'Performance',
    security: 'Segurança',
    stealth: 'Furtividade',
    survival: 'Sobrevivência',
  },
  knowledges: {
    academics: 'Acadêmicos',
    computer: 'Computador',
    finance: 'Finanças',
    investigation: 'Investigação',
    law: 'Direito',
    linguistics: 'Linguística',
    medicine: 'Medicina',
    occult: 'Ocultismo',
    politics: 'Política',
    science: 'Ciência',
  },
};

export function EditVampiroCharacterModal({
  open,
  onOpenChange,
  character,
  onSave,
}: EditVampiroCharacterModalProps) {
  const { t, language } = useI18n();
  const { toast } = useToast();

  const [name, setName] = useState(character.name);
  const [concept, setConcept] = useState(character.concept || '');
  const [vampiroData, setVampiroData] = useState<VampiroData>(character.vampiro_data || {});
  const [saving, setSaving] = useState(false);

  // Reset form when character changes
  useEffect(() => {
    setName(character.name);
    setConcept(character.concept || '');
    setVampiroData(character.vampiro_data || {});
  }, [character]);

  const updateVampiroField = <K extends keyof VampiroData>(key: K, value: VampiroData[K]) => {
    setVampiroData(prev => ({ ...prev, [key]: value }));
  };

  const updateAttribute = (category: 'physical' | 'social' | 'mental', attr: string, value: number) => {
    setVampiroData(prev => ({
      ...prev,
      attributes: {
        physical: prev.attributes?.physical || { strength: 1, dexterity: 1, stamina: 1 },
        social: prev.attributes?.social || { charisma: 1, manipulation: 1, appearance: 1 },
        mental: prev.attributes?.mental || { perception: 1, intelligence: 1, wits: 1 },
        [category]: {
          ...prev.attributes?.[category],
          [attr]: value,
        },
      },
    }));
  };

  const updateAbility = (category: 'talents' | 'skills' | 'knowledges', ability: string, value: number) => {
    setVampiroData(prev => ({
      ...prev,
      abilities: {
        talents: prev.abilities?.talents || {},
        skills: prev.abilities?.skills || {},
        knowledges: prev.abilities?.knowledges || {},
        [category]: {
          ...prev.abilities?.[category],
          [ability]: value,
        },
      },
    }));
  };

  const updateVirtue = (key: string, value: number | string) => {
    setVampiroData(prev => ({
      ...prev,
      virtues: {
        ...prev.virtues,
        virtueType1: prev.virtues?.virtueType1 || 'conscience',
        virtueValue1: prev.virtues?.virtueValue1 || 1,
        virtueType2: prev.virtues?.virtueType2 || 'selfControl',
        virtueValue2: prev.virtues?.virtueValue2 || 1,
        courage: prev.virtues?.courage || 1,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: t.editVampiro.nameRequired,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('characters')
        .update({
          name: name.trim(),
          concept: concept.trim() || null,
          vampiro_data: JSON.parse(JSON.stringify(vampiroData)),
        })
        .eq('id', character.id);

      if (error) throw error;

      const updated: Character = {
        ...character,
        name: name.trim(),
        concept: concept.trim() || null,
        vampiro_data: vampiroData,
      };

      onSave(updated);
      toast({
        title: t.editVampiro.characterUpdated,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating character:', error);
      toast({
        title: t.editVampiro.errorSaving,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const attributes = vampiroData.attributes || {
    physical: { strength: 1, dexterity: 1, stamina: 1 },
    social: { charisma: 1, manipulation: 1, appearance: 1 },
    mental: { perception: 1, intelligence: 1, wits: 1 },
  };

  const abilities = vampiroData.abilities || { talents: {}, skills: {}, knowledges: {} };
  const virtues = vampiroData.virtues || {
    virtueType1: 'conscience',
    virtueValue1: 1,
    virtueType2: 'selfControl',
    virtueValue2: 1,
    courage: 1,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            {t.editVampiro.editCharacter}
          </DialogTitle>
          <DialogDescription className="font-body">
            {t.editVampiro.editVampireInfo}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="basic" className="font-medieval text-xs">
              <User className="w-3 h-3 mr-1" />
              {t.editVampiro.tabBasic}
            </TabsTrigger>
            <TabsTrigger value="attributes" className="font-medieval text-xs">
              <Shield className="w-3 h-3 mr-1" />
              {t.editVampiro.tabAttributes}
            </TabsTrigger>
            <TabsTrigger value="abilities" className="font-medieval text-xs">
              <Brain className="w-3 h-3 mr-1" />
              {t.editVampiro.tabAbilities}
            </TabsTrigger>
            <TabsTrigger value="virtues" className="font-medieval text-xs">
              <Heart className="w-3 h-3 mr-1" />
              {t.editVampiro.tabVirtues}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-4 min-h-0">
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.character.name} *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.editVampiro.characterName}
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.player}</Label>
                    <Input
                      value={vampiroData.player || ''}
                      onChange={(e) => updateVampiroField('player', e.target.value)}
                      placeholder={t.editVampiro.playerName}
                      className="font-body"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.chronicle}</Label>
                    <Input
                      value={vampiroData.chronicle || ''}
                      onChange={(e) => updateVampiroField('chronicle', e.target.value)}
                      placeholder={t.editVampiro.chronicleName}
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.clan}</Label>
                    <Select
                      value={vampiroData.clan || ''}
                      onValueChange={(val) => updateVampiroField('clan', val)}
                    >
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder={t.editVampiro.selectClan} />
                      </SelectTrigger>
                      <SelectContent>
                        {CLANS.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.nature}</Label>
                    <Select
                      value={vampiroData.nature || ''}
                      onValueChange={(val) => updateVampiroField('nature', val)}
                    >
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder={t.editVampiro.select} />
                      </SelectTrigger>
                      <SelectContent>
                        {ARCHETYPES.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.demeanor}</Label>
                    <Select
                      value={vampiroData.demeanor || ''}
                      onValueChange={(val) => updateVampiroField('demeanor', val)}
                    >
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder={t.editVampiro.select} />
                      </SelectTrigger>
                      <SelectContent>
                        {ARCHETYPES.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.generation}</Label>
                    <Select
                      value={vampiroData.generation || ''}
                      onValueChange={(val) => updateVampiroField('generation', val)}
                    >
                      <SelectTrigger className="font-body">
                        <SelectValue placeholder={t.editVampiro.select} />
                      </SelectTrigger>
                      <SelectContent>
                        {[8, 9, 10, 11, 12, 13].map(g => (
                          <SelectItem key={g} value={String(g)}>{g}ª Geração</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.vampiro.sire}</Label>
                    <Input
                      value={vampiroData.sire || ''}
                      onChange={(e) => updateVampiroField('sire', e.target.value)}
                      placeholder={t.editVampiro.sireName}
                      className="font-body"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-medieval">{t.character.concept}</Label>
                  <Input
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder={t.editVampiro.conceptPlaceholder}
                    className="font-body"
                  />
                </div>
                </div>
              </TabsContent>

              {/* Attributes Tab */}
              <TabsContent value="attributes" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                {/* Physical */}
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">{t.vampiro.physical}</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'strength', label: t.vampiro.strength },
                      { key: 'dexterity', label: t.vampiro.dexterity },
                      { key: 'stamina', label: t.vampiro.stamina },
                    ].map(attr => (
                      <div key={attr.key} className="flex items-center justify-between">
                        <span className="font-body text-sm">{attr.label}</span>
                        <DotRating
                          value={attributes.physical[attr.key as keyof typeof attributes.physical] || 1}
                          onChange={(val) => updateAttribute('physical', attr.key, val)}
                          maxValue={5}
                          minValue={1}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social */}
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">{t.vampiro.social}</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'charisma', label: t.vampiro.charisma },
                      { key: 'manipulation', label: t.vampiro.manipulation },
                      { key: 'appearance', label: t.vampiro.appearance },
                    ].map(attr => (
                      <div key={attr.key} className="flex items-center justify-between">
                        <span className="font-body text-sm">{attr.label}</span>
                        <DotRating
                          value={attributes.social[attr.key as keyof typeof attributes.social] || 1}
                          onChange={(val) => updateAttribute('social', attr.key, val)}
                          maxValue={5}
                          minValue={1}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mental */}
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">{t.vampiro.mental}</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'perception', label: t.vampiro.perception },
                      { key: 'intelligence', label: t.vampiro.intelligence },
                      { key: 'wits', label: t.vampiro.wits },
                    ].map(attr => (
                      <div key={attr.key} className="flex items-center justify-between">
                        <span className="font-body text-sm">{attr.label}</span>
                        <DotRating
                          value={attributes.mental[attr.key as keyof typeof attributes.mental] || 1}
                          onChange={(val) => updateAttribute('mental', attr.key, val)}
                          maxValue={5}
                          minValue={1}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </TabsContent>

              {/* Abilities Tab */}
              <TabsContent value="abilities" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                {/* Talents */}
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                    {t.vampiro.talents}{' '}
                    <span className="text-muted-foreground/60">({Object.values(abilities.talents).reduce((s, v) => s + (v || 0), 0)})</span>
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(ABILITY_NAMES.talents).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="font-body text-sm">{t.vampiro[key as keyof typeof t.vampiro] || label}</span>
                        <DotRating
                          value={abilities.talents[key] || 0}
                          onChange={(val) => updateAbility('talents', key, val)}
                          maxValue={5}
                          minValue={0}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                    {t.vampiro.skills}{' '}
                    <span className="text-muted-foreground/60">({Object.values(abilities.skills).reduce((s, v) => s + (v || 0), 0)})</span>
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(ABILITY_NAMES.skills).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="font-body text-sm">{t.vampiro[key as keyof typeof t.vampiro] || label}</span>
                        <DotRating
                          value={abilities.skills[key] || 0}
                          onChange={(val) => updateAbility('skills', key, val)}
                          maxValue={5}
                          minValue={0}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Knowledges */}
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                    {t.vampiro.knowledges}{' '}
                    <span className="text-muted-foreground/60">({Object.values(abilities.knowledges).reduce((s, v) => s + (v || 0), 0)})</span>
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(ABILITY_NAMES.knowledges).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="font-body text-sm">{t.vampiro[key as keyof typeof t.vampiro] || label}</span>
                        <DotRating
                          value={abilities.knowledges[key] || 0}
                          onChange={(val) => updateAbility('knowledges', key, val)}
                          maxValue={5}
                          minValue={0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </TabsContent>

              {/* Virtues Tab */}
              <TabsContent value="virtues" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">{t.vampiro.virtues}</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">
                        {virtues.virtueType1 === 'conscience' ? t.vampiro.conscience : t.vampiro.conviction}
                      </span>
                      <DotRating
                        value={virtues.virtueValue1 || 1}
                        onChange={(val) => updateVirtue('virtueValue1', val)}
                        maxValue={5}
                        minValue={1}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">
                        {virtues.virtueType2 === 'selfControl' ? t.vampiro.selfControl : t.vampiro.instinct}
                      </span>
                      <DotRating
                        value={virtues.virtueValue2 || 1}
                        onChange={(val) => updateVirtue('virtueValue2', val)}
                        maxValue={5}
                        minValue={1}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{t.vampiro.courage}</span>
                      <DotRating
                        value={virtues.courage || 1}
                        onChange={(val) => updateVirtue('courage', val)}
                        maxValue={5}
                        minValue={1}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                    {vampiroData.moralityType === 'path' ? `${t.vampiro.path}: ${vampiroData.pathName}` : t.vampiro.humanity}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">{t.editVampiro.value}</span>
                    <DotRating
                      value={vampiroData.humanity || 1}
                      onChange={(val) => updateVampiroField('humanity', val)}
                      maxValue={10}
                      minValue={0}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medieval text-sm text-muted-foreground mb-3">{t.vampiro.willpower}</h4>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">{t.editVampiro.value}</span>
                    <DotRating
                      value={vampiroData.willpower || 1}
                      onChange={(val) => updateVampiroField('willpower', val)}
                      maxValue={10}
                      minValue={1}
                    />
                  </div>
                </div>
                </div>
              </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0 shrink-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t.editVampiro.saving : t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
