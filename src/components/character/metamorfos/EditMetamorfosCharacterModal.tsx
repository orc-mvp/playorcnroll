/**
 * Edit modal — Metamorfos (W20).
 *
 * Reusa toda a estrutura do Lobisomem (atributos, habilidades, dons, antecedentes,
 * vantagens) MAS substitui Tribo/Auspício por "Espécie" (texto livre) e adiciona
 * a aba "Formas" para gerenciar até 4 formas de guerra customizadas + Hominídeo
 * implícita. O delta de atributo segue a regra:
 *  - vazio = sem alteração
 *  - número (+/-) = soma/subtrai do atributo base
 *  - 0 literal = zera o atributo enquanto a forma estiver ativa
 *
 * As mudanças são gravadas em `vampiro_data.metamorph_forms` e
 * `vampiro_data.metamorph_species`. O save dispara realtime via UPDATE em
 * `characters` (mesmo canal que Lobisomem já escuta na sala Storyteller).
 */

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent } from '@/components/ui/tabs';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PawPrint, User, Shield, Brain, Star, BookOpen, Sparkles, Plus, X, Info } from 'lucide-react';
import DotRating from '@/components/character/vampiro/DotRating';
import type { LobisomemCharacterData, MetamorphForm } from '@/lib/lobisomem/diceUtils';

interface Character {
  id: string;
  name: string;
  concept: string | null;
  vampiro_data: LobisomemCharacterData | null;
}

interface EditMetamorfosCharacterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character;
  onSave: (updated: Character) => void;
}

const ABILITY_NAMES: Record<string, Record<string, string>> = {
  talents: {
    alertness: 'Prontidão', athletics: 'Esportes', brawl: 'Briga', dodge: 'Esquiva', primalUrge: 'Instinto Primitivo',
    empathy: 'Empatia', expression: 'Expressão', intimidation: 'Intimidação',
    leadership: 'Liderança', subterfuge: 'Lábia',
  },
  skills: {
    animalKen: 'Empatia c/ Animais', crafts: 'Ofícios', drive: 'Condução',
    etiquette: 'Etiqueta', firearms: 'Armas de Fogo', melee: 'Armas Brancas',
    performance: 'Performance', security: 'Segurança', stealth: 'Furtividade',
    survival: 'Sobrevivência',
  },
  knowledges: {
    academics: 'Acadêmicos', computer: 'Computador', enigmas: 'Enigmas',
    investigation: 'Investigação', law: 'Direito', linguistics: 'Linguística',
    medicine: 'Medicina', occult: 'Ocultismo', politics: 'Política', rituals: 'Rituais', science: 'Ciência',
  },
};

const BACKGROUNDS = [
  { key: 'allies', labelPt: 'Aliados', labelEn: 'Allies' },
  { key: 'ancestors', labelPt: 'Ancestrais', labelEn: 'Ancestors' },
  { key: 'contacts', labelPt: 'Contatos', labelEn: 'Contacts' },
  { key: 'fetish', labelPt: 'Fetiche', labelEn: 'Fetish' },
  { key: 'kinfolk', labelPt: 'Parentes', labelEn: 'Kinfolk' },
  { key: 'mentor', labelPt: 'Mentor', labelEn: 'Mentor' },
  { key: 'resources', labelPt: 'Recursos', labelEn: 'Resources' },
  { key: 'rites', labelPt: 'Rituais', labelEn: 'Rites' },
  { key: 'totemPersonal', labelPt: 'Totem (Pessoal)', labelEn: 'Totem (Personal)' },
];

const MAX_CUSTOM_FORMS = 4;

/** Lista canônica de atributos editáveis por forma (todos os 9). */
const FORM_ATTRIBUTES: { key: keyof NonNullable<MetamorphForm['modifiers']>; i18nKey: string }[] = [
  { key: 'strength', i18nKey: 'formAttrStrength' },
  { key: 'dexterity', i18nKey: 'formAttrDexterity' },
  { key: 'stamina', i18nKey: 'formAttrStamina' },
  { key: 'charisma', i18nKey: 'formAttrCharisma' },
  { key: 'manipulation', i18nKey: 'formAttrManipulation' },
  { key: 'appearance', i18nKey: 'formAttrAppearance' },
  { key: 'perception', i18nKey: 'formAttrPerception' },
  { key: 'intelligence', i18nKey: 'formAttrIntelligence' },
  { key: 'wits', i18nKey: 'formAttrWits' },
];

/**
 * Converte string do input para `number | undefined`.
 * - "" / espaços → undefined (sem alteração)
 * - "0" → 0 (sentinela: zera o atributo)
 * - número válido (incluindo negativos) → number
 * - lixo → undefined
 */
function parseModifier(raw: string): number | undefined {
  const v = raw.trim();
  if (v === '' || v === '+' || v === '-') return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n);
}

/** Renderização inversa: number → string para o input. */
function modifierToInput(v: number | undefined): string {
  if (v === undefined) return '';
  return String(v);
}

export function EditMetamorfosCharacterModal({
  open,
  onOpenChange,
  character,
  onSave,
}: EditMetamorfosCharacterModalProps) {
  const { t, language } = useI18n();
  const { toast } = useToast();
  const tMeta = (t as any).metamorfos as Record<string, string>;
  const tWolf = t.lobisomem as Record<string, string>;

  const [name, setName] = useState(character.name);
  const [concept, setConcept] = useState(character.concept || '');
  const [data, setData] = useState<LobisomemCharacterData>(character.vampiro_data || {});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');


  useEffect(() => {
    setName(character.name);
    setConcept(character.concept || '');
    setData(character.vampiro_data || {});
  }, [character]);

  const updateField = <K extends keyof LobisomemCharacterData>(key: K, value: LobisomemCharacterData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const updateAttribute = (category: 'physical' | 'social' | 'mental', attr: string, value: number) => {
    setData(prev => ({
      ...prev,
      attributes: {
        physical: prev.attributes?.physical || { strength: 1, dexterity: 1, stamina: 1 },
        social: prev.attributes?.social || { charisma: 1, manipulation: 1, appearance: 1 },
        mental: prev.attributes?.mental || { perception: 1, intelligence: 1, wits: 1 },
        [category]: { ...prev.attributes?.[category], [attr]: value },
      },
    }));
  };

  const updateAbility = (category: 'talents' | 'skills' | 'knowledges', ability: string, value: number) => {
    setData(prev => ({
      ...prev,
      abilities: {
        talents: prev.abilities?.talents || {},
        skills: prev.abilities?.skills || {},
        knowledges: prev.abilities?.knowledges || {},
        [category]: { ...prev.abilities?.[category], [ability]: value },
      },
    }));
  };

  const updateBackground = (key: string, value: number) => {
    setData(prev => ({ ...prev, backgrounds: { ...prev.backgrounds, [key]: value } }));
  };

  const updateGift = (level: number, index: number, value: string) => {
    const gifts = { ...(data.gifts || {}) };
    const levelGifts = [...(gifts[level] || [])];
    levelGifts[index] = value;
    gifts[level] = levelGifts;
    setData(prev => ({ ...prev, gifts }));
  };

  const addGift = (level: number) => {
    const gifts = { ...(data.gifts || {}) };
    gifts[level] = [...(gifts[level] || []), ''];
    setData(prev => ({ ...prev, gifts }));
  };

  const removeGift = (level: number, index: number) => {
    const gifts = { ...(data.gifts || {}) };
    const levelGifts = [...(gifts[level] || [])];
    levelGifts.splice(index, 1);
    gifts[level] = levelGifts;
    setData(prev => ({ ...prev, gifts }));
  };

  // ---- Formas customizadas ----
  const forms: MetamorphForm[] = data.metamorph_forms || [];

  const addForm = () => {
    if (forms.length >= MAX_CUSTOM_FORMS) return;
    const newForm: MetamorphForm = {
      id: `form_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: '',
      difficulty: 0,
      modifiers: {},
    };
    setData(prev => ({ ...prev, metamorph_forms: [...(prev.metamorph_forms || []), newForm] }));
  };

  const removeForm = (id: string) => {
    setData(prev => ({ ...prev, metamorph_forms: (prev.metamorph_forms || []).filter(f => f.id !== id) }));
  };

  const updateFormName = (id: string, value: string) => {
    setData(prev => ({
      ...prev,
      metamorph_forms: (prev.metamorph_forms || []).map(f => f.id === id ? { ...f, name: value } : f),
    }));
  };

  const updateFormDifficulty = (id: string, value: string) => {
    const n = value.trim() === '' ? 0 : Math.trunc(Number(value));
    const safe = Number.isFinite(n) ? n : 0;
    setData(prev => ({
      ...prev,
      metamorph_forms: (prev.metamorph_forms || []).map(f => f.id === id ? { ...f, difficulty: safe } : f),
    }));
  };

  const updateFormModifier = (id: string, attr: keyof NonNullable<MetamorphForm['modifiers']>, raw: string) => {
    const parsed = parseModifier(raw);
    setData(prev => ({
      ...prev,
      metamorph_forms: (prev.metamorph_forms || []).map(f => {
        if (f.id !== id) return f;
        const nextMods = { ...(f.modifiers || {}) };
        if (parsed === undefined) {
          delete nextMods[attr];
        } else {
          nextMods[attr] = parsed;
        }
        return { ...f, modifiers: nextMods };
      }),
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: t.editVampiro.nameRequired, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Sanitiza formas: remove vazias sem nome para não poluir a lista.
      const cleanedForms = (data.metamorph_forms || []).filter(f => f.name.trim().length > 0 || (f.modifiers && Object.keys(f.modifiers).length > 0));
      const finalData: LobisomemCharacterData = {
        ...data,
        metamorph_forms: cleanedForms,
      };

      const { error } = await supabase
        .from('characters')
        .update({
          name: name.trim(),
          concept: concept.trim() || null,
          vampiro_data: JSON.parse(JSON.stringify(finalData)),
        })
        .eq('id', character.id);

      if (error) throw error;

      const updated: Character = {
        ...character,
        name: name.trim(),
        concept: concept.trim() || null,
        vampiro_data: finalData,
      };

      onSave(updated);
      toast({ title: t.editVampiro.characterUpdated });
      onOpenChange(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating shifter:', error);
      toast({ title: t.editVampiro.errorSaving, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const attributes = data.attributes || {
    physical: { strength: 1, dexterity: 1, stamina: 1 },
    social: { charisma: 1, manipulation: 1, appearance: 1 },
    mental: { perception: 1, intelligence: 1, wits: 1 },
  };
  const abilities = data.abilities || { talents: {}, skills: {}, knowledges: {} };
  const backgrounds = data.backgrounds || {};
  const gifts = data.gifts || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-medieval flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-amber-500" />
            {tMeta.editCharacter}
          </DialogTitle>
          <DialogDescription className="font-body">
            {tMeta.editInfo}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full font-medieval shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">
                <div className="flex items-center gap-2"><User className="w-4 h-4" />{tWolf.tabBasic}</div>
              </SelectItem>
              <SelectItem value="forms">
                <div className="flex items-center gap-2"><PawPrint className="w-4 h-4" />{tMeta.tabForms}</div>
              </SelectItem>
              <SelectItem value="attributes">
                <div className="flex items-center gap-2"><Shield className="w-4 h-4" />{tWolf.tabAttributes}</div>
              </SelectItem>
              <SelectItem value="abilities">
                <div className="flex items-center gap-2"><Brain className="w-4 h-4" />{tWolf.tabAbilities}</div>
              </SelectItem>
              <SelectItem value="gifts">
                <div className="flex items-center gap-2"><Star className="w-4 h-4" />{tWolf.tabGifts}</div>
              </SelectItem>
              <SelectItem value="backgrounds">
                <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" />{tWolf.tabBackgrounds}</div>
              </SelectItem>
              <SelectItem value="meritsflaws">
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" />{t.meritsFlaws.title}</div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 mt-4 min-h-0">
              {/* Basic Info */}
              <TabsContent value="basic" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.character.name} *</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.vampiro.player}</Label>
                      <Input value={data.player || ''} onChange={(e) => updateField('player', e.target.value)} className="font-body" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.vampiro.chronicle}</Label>
                      <Input value={data.chronicle || ''} onChange={(e) => updateField('chronicle', e.target.value)} className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{tMeta.species}</Label>
                      <Input
                        value={data.metamorph_species || ''}
                        onChange={(e) => updateField('metamorph_species', e.target.value)}
                        placeholder={tMeta.speciesPlaceholder}
                        className="font-body"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{tWolf.pack}</Label>
                      <Input value={data.pack || ''} onChange={(e) => updateField('pack', e.target.value)} className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{tWolf.totem}</Label>
                      <Input value={data.totem || ''} onChange={(e) => updateField('totem', e.target.value)} className="font-body" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.vampiro.nature}</Label>
                      <Input value={data.nature || ''} onChange={(e) => updateField('nature', e.target.value)} className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.vampiro.demeanor}</Label>
                      <Input value={data.demeanor || ''} onChange={(e) => updateField('demeanor', e.target.value)} className="font-body" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.character.concept}</Label>
                    <Input value={concept} onChange={(e) => setConcept(e.target.value)} className="font-body" />
                  </div>

                  {/* Gnose, Fúria, Vontade */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{tWolf.gnosis}</span>
                      <DotRating value={data.gnosis || 1} onChange={(val) => updateField('gnosis', val)} maxValue={10} minValue={1} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{tWolf.rage}</span>
                      <DotRating value={data.rage || 1} onChange={(val) => updateField('rage', val)} maxValue={10} minValue={1} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{tWolf.willpowerLabel}</span>
                      <DotRating value={data.willpower || 1} onChange={(val) => updateField('willpower', val)} maxValue={10} minValue={1} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Formas customizadas */}
              <TabsContent value="forms" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medieval text-sm flex items-center gap-2">
                      <PawPrint className="w-4 h-4 text-amber-500" />
                      {tMeta.formsTitle}
                    </h4>
                    <p className="text-xs text-muted-foreground font-body">{tMeta.formsDesc}</p>
                  </div>

                  {/* Hominídeo (implícita, somente leitura) */}
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-amber-500/50 text-amber-500">{tMeta.hominidName}</Badge>
                      <span className="text-xs text-muted-foreground font-body">{tMeta.hominidLockedDesc}</span>
                    </div>
                  </div>

                  {forms.length === 0 && (
                    <p className="text-xs text-muted-foreground font-body italic text-center py-2">
                      {tMeta.noCustomFormsHint}
                    </p>
                  )}

                  {forms.map((form, idx) => (
                    <div key={form.id} className="rounded-lg border border-border p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={form.name}
                          onChange={(e) => updateFormName(form.id, e.target.value)}
                          placeholder={tMeta.formNamePlaceholder}
                          className="font-body flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-destructive"
                          onClick={() => removeForm(form.id)}
                          aria-label={tMeta.removeForm}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 items-center">
                        <Label className="font-medieval text-xs">{tWolf.formDifficulty}</Label>
                        <Input
                          type="number"
                          value={form.difficulty ?? 0}
                          onChange={(e) => updateFormDifficulty(form.id, e.target.value)}
                          className="font-body h-8"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <span className="font-medieval text-xs text-muted-foreground">
                            {language === 'pt-BR' ? 'Modificadores de Atributo' : 'Attribute Modifiers'}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-body text-xs">{tMeta.modifierTooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {FORM_ATTRIBUTES.map(({ key, i18nKey }) => (
                            <div key={key} className="space-y-1">
                              <Label className="font-body text-[11px] text-muted-foreground">
                                {tMeta[i18nKey] || tWolf[i18nKey] || String(key)}
                              </Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={modifierToInput(form.modifiers?.[key])}
                                onChange={(e) => updateFormModifier(form.id, key, e.target.value)}
                                placeholder="—"
                                className="font-body h-8 text-center"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {forms.length < MAX_CUSTOM_FORMS ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addForm}
                      className="w-full"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {tMeta.addForm}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground font-body italic text-center">
                      {tMeta.maxFormsReached}
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Attributes */}
              <TabsContent value="attributes" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                  {[
                    { cat: 'physical', label: t.vampiro.physical, items: [
                      { key: 'strength', label: t.vampiro.strength },
                      { key: 'dexterity', label: t.vampiro.dexterity },
                      { key: 'stamina', label: t.vampiro.stamina },
                    ]},
                    { cat: 'social', label: t.vampiro.social, items: [
                      { key: 'charisma', label: t.vampiro.charisma },
                      { key: 'manipulation', label: t.vampiro.manipulation },
                      { key: 'appearance', label: t.vampiro.appearance },
                    ]},
                    { cat: 'mental', label: t.vampiro.mental, items: [
                      { key: 'perception', label: t.vampiro.perception },
                      { key: 'intelligence', label: t.vampiro.intelligence },
                      { key: 'wits', label: t.vampiro.wits },
                    ]},
                  ].map(({ cat, label, items }) => (
                    <div key={cat}>
                      <h4 className="font-medieval text-sm text-muted-foreground mb-3">{label}</h4>
                      <div className="space-y-2">
                        {items.map(attr => (
                          <div key={attr.key} className="flex items-center justify-between">
                            <span className="font-body text-sm">{attr.label}</span>
                            <DotRating
                              value={(attributes as any)[cat][attr.key] || 1}
                              onChange={(val) => updateAttribute(cat as any, attr.key, val)}
                              maxValue={5}
                              minValue={1}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Abilities */}
              <TabsContent value="abilities" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                  {(['talents', 'skills', 'knowledges'] as const).map((cat) => (
                    <div key={cat}>
                      <h4 className="font-medieval text-sm text-muted-foreground mb-3">{t.vampiro[cat]}</h4>
                      <div className="space-y-2">
                        {Object.entries(ABILITY_NAMES[cat]).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="font-body text-sm">{(t.vampiro as any)[key] || label}</span>
                            <DotRating
                              value={(abilities[cat] as Record<string, number>)?.[key] || 0}
                              onChange={(val) => updateAbility(cat, key, val)}
                              maxValue={5}
                              minValue={0}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Gifts */}
              <TabsContent value="gifts" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const levelGifts = gifts[level] || [];
                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medieval text-sm text-muted-foreground">
                            {(tWolf.giftLevel as string).replace('{level}', String(level))}
                          </h4>
                          <Button type="button" variant="ghost" size="sm" onClick={() => addGift(level)}>
                            <Plus className="w-3 h-3 mr-1" /> {tWolf.addGift}
                          </Button>
                        </div>
                        {levelGifts.map((gift: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              value={gift}
                              onChange={(e) => updateGift(level, i, e.target.value)}
                              placeholder={tWolf.giftPlaceholder}
                              className="font-body flex-1"
                            />
                            <Button type="button" variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeGift(level, i)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Backgrounds */}
              <TabsContent value="backgrounds" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  {BACKGROUNDS.map((bg) => (
                    <div key={bg.key} className="flex items-center justify-between">
                      <span className="font-body text-sm">{language === 'pt-BR' ? bg.labelPt : bg.labelEn}</span>
                      <DotRating value={backgrounds[bg.key] || 0} onChange={(val) => updateBackground(bg.key, val)} maxValue={10} minValue={0} />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Merits & Flaws */}
              <TabsContent value="meritsflaws" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <MeritsFlawsSelector
                  gameSystem="lobisomem_w20"
                  selected={(data.merits_flaws || []) as SelectedMeritFlaw[]}
                  onChange={(next) => setData((prev) => ({ ...prev, merits_flaws: next }))}
                  freebieBudget={15}
                  variant="edit"
                  accent="amber"
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 shrink-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white">
            {saving ? t.editVampiro.saving : t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
