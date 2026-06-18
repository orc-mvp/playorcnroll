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
import { Dog, User, Shield, Brain, Star, BookOpen, Sparkles, Plus, X } from 'lucide-react';
import DotRating from '@/components/character/vampiro/DotRating';
import MeritsFlawsSelector, { type SelectedMeritFlaw } from '@/components/character/storyteller/shared/MeritsFlawsSelector';
import AttributesEditor, { type AttributeValues } from '@/components/character/storyteller/shared/AttributesEditor';
import AbilitiesEditor, { type AbilityValues } from '@/components/character/storyteller/shared/AbilitiesEditor';
import RenownBlock from '@/components/character/storyteller/shared/RenownBlock';
import { getTraitOverrides } from '@/lib/storyteller/traitOverrides';
import { TRIBES, AUSPICES, BREEDS, RANKS } from '@/lib/lobisomem/tribes';
import type { LobisomemCharacterData } from '@/lib/lobisomem/diceUtils';

interface Character {
  id: string;
  name: string;
  concept: string | null;
  vampiro_data: LobisomemCharacterData | null;
  game_system?: string;
}

interface EditLobisomemCharacterModalProps {
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
  { key: 'numen', labelPt: 'Numen', labelEn: 'Numen' },
  { key: 'prophecy', labelPt: 'Profecia', labelEn: 'Prophecy' },
  { key: 'pureBreed', labelPt: 'Raça Pura', labelEn: 'Pure Breed' },
  { key: 'resources', labelPt: 'Recursos', labelEn: 'Resources' },
  { key: 'rites', labelPt: 'Rituais', labelEn: 'Rites' },
  { key: 'spiritHeritage', labelPt: 'Herança Espiritual', labelEn: 'Spirit Heritage' },
  { key: 'touched', labelPt: 'Tocado', labelEn: 'Touched' },
  { key: 'totemPersonal', labelPt: 'Totem (Pessoal)', labelEn: 'Totem (Personal)' },
];

// Tribe key mapping for i18n
const TRIBE_I18N: Record<string, string> = {
  'Black Furies': 'tribe_blackFuries', 'Black Spiral Dancers': 'tribe_blackSpiralDancers', 'Bone Gnawers': 'tribe_boneGnawers',
  'Children of Gaia': 'tribe_childrenOfGaia', 'Fianna': 'tribe_fianna',
  'Get of Fenris': 'tribe_getOfFenris', 'Glass Walkers': 'tribe_glassWalkers',
  'Red Talons': 'tribe_redTalons', 'Shadow Lords': 'tribe_shadowLords',
  'Silent Striders': 'tribe_silentStriders', 'Silver Fangs': 'tribe_silverFangs',
  'Stargazers': 'tribe_stargazers', 'Uktena': 'tribe_uktena', 'Wendigo': 'tribe_wendigo',
};
const AUSPICE_I18N: Record<string, string> = {
  'Ragabash': 'auspice_ragabash', 'Theurge': 'auspice_theurge', 'Philodox': 'auspice_philodox',
  'Galliard': 'auspice_galliard', 'Ahroun': 'auspice_ahroun',
};
const BREED_I18N: Record<string, string> = {
  'Homid': 'breed_homid', 'Metis': 'breed_metis', 'Lupus': 'breed_lupus',
};
const RANK_I18N: Record<string, string> = {
  'Cliath': 'rank_cliath', 'Fostern': 'rank_fostern', 'Adren': 'rank_adren',
  'Athro': 'rank_athro', 'Elder': 'rank_elder',
};

export function EditLobisomemCharacterModal({
  open,
  onOpenChange,
  character,
  onSave,
}: EditLobisomemCharacterModalProps) {
  const { t, language } = useI18n();
  const { toast } = useToast();
  const isW5 = character.game_system === 'lobisomem_w5';

  const [name, setName] = useState(character.name);
  const [concept, setConcept] = useState(character.concept || '');
  const [lobData, setLobData] = useState<LobisomemCharacterData>(character.vampiro_data || {});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    setName(character.name);
    setConcept(character.concept || '');
    setLobData(character.vampiro_data || {});
  }, [character]);

  const updateField = <K extends keyof LobisomemCharacterData>(key: K, value: LobisomemCharacterData[K]) => {
    setLobData(prev => ({ ...prev, [key]: value }));
  };

  const updateAttribute = (category: 'physical' | 'social' | 'mental', attr: string, value: number) => {
    setLobData(prev => ({
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
    setLobData(prev => ({
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
    setLobData(prev => ({ ...prev, backgrounds: { ...prev.backgrounds, [key]: value } }));
  };

  const updateGiftField = (
    level: number,
    index: number,
    field: 'name' | 'description',
    value: string,
  ) => {
    const gifts = { ...(lobData.gifts || {}) } as Record<number, any[]>;
    const levelGifts = [...(gifts[level] || [])];
    const current = levelGifts[index];
    const normalized =
      typeof current === 'string'
        ? { name: current, description: '' }
        : { name: current?.name ?? '', description: current?.description ?? '' };
    normalized[field] = value;
    levelGifts[index] = normalized;
    gifts[level] = levelGifts;
    setLobData(prev => ({ ...prev, gifts } as any));
  };

  const addGift = (level: number) => {
    const gifts = { ...(lobData.gifts || {}) } as Record<number, any[]>;
    gifts[level] = [...(gifts[level] || []), { name: '', description: '' }];
    setLobData(prev => ({ ...prev, gifts } as any));
  };

  const removeGift = (level: number, index: number) => {
    const gifts = { ...(lobData.gifts || {}) } as Record<number, any[]>;
    const levelGifts = [...(gifts[level] || [])];
    levelGifts.splice(index, 1);
    gifts[level] = levelGifts;
    setLobData(prev => ({ ...prev, gifts } as any));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: t.editVampiro.nameRequired, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('characters')
        .update({
          name: name.trim(),
          concept: concept.trim() || null,
          vampiro_data: JSON.parse(JSON.stringify(lobData)),
        })
        .eq('id', character.id);

      if (error) throw error;

      const updated: Character = {
        ...character,
        name: name.trim(),
        concept: concept.trim() || null,
        vampiro_data: lobData,
      };

      onSave(updated);
      toast({ title: t.editVampiro.characterUpdated });
      onOpenChange(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating character:', error);
      toast({ title: t.editVampiro.errorSaving, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const attributes = lobData.attributes || {
    physical: { strength: 1, dexterity: 1, stamina: 1 },
    social: { charisma: 1, manipulation: 1, appearance: 1 },
    mental: { perception: 1, intelligence: 1, wits: 1 },
  };
  const abilities = lobData.abilities || { talents: {}, skills: {}, knowledges: {} };
  const backgrounds = lobData.backgrounds || {};
  const gifts = lobData.gifts || {};

  const getI18nLabel = (value: string, map: Record<string, string>) => {
    const key = map[value];
    return key ? ((t.lobisomem as any)[key] || value) : value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl md:max-w-3xl lg:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Dog className="w-5 h-5 text-emerald-500" />
            {t.lobisomem.editCharacter}
          </DialogTitle>
          <DialogDescription className="font-body">
            {t.lobisomem.editWerewolfInfo}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full font-medieval shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">
                <div className="flex items-center gap-2"><User className="w-4 h-4" />{t.lobisomem.tabBasic}</div>
              </SelectItem>
              <SelectItem value="attributes">
                <div className="flex items-center gap-2"><Shield className="w-4 h-4" />{t.lobisomem.tabAttributes}</div>
              </SelectItem>
              <SelectItem value="abilities">
                <div className="flex items-center gap-2"><Brain className="w-4 h-4" />{t.lobisomem.tabAbilities}</div>
              </SelectItem>
              <SelectItem value="gifts">
                <div className="flex items-center gap-2"><Star className="w-4 h-4" />{t.lobisomem.tabGifts}</div>
              </SelectItem>
              <SelectItem value="backgrounds">
                <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" />{t.lobisomem.tabBackgrounds}</div>
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
                      <Input value={lobData.player || ''} onChange={(e) => updateField('player', e.target.value)} className="font-body" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.vampiro.chronicle}</Label>
                      <Input value={lobData.chronicle || ''} onChange={(e) => updateField('chronicle', e.target.value)} className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.lobisomem.tribe}</Label>
                      <Select value={lobData.tribe || ''} onValueChange={(val) => updateField('tribe', val)}>
                        <SelectTrigger className="font-body"><SelectValue placeholder={t.lobisomem.selectTribe} /></SelectTrigger>
                        <SelectContent>
                          {TRIBES.map(tribe => (
                            <SelectItem key={tribe} value={tribe}>{getI18nLabel(tribe, TRIBE_I18N)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.lobisomem.auspice}</Label>
                      <Select value={lobData.auspice || ''} onValueChange={(val) => updateField('auspice', val)}>
                        <SelectTrigger className="font-body"><SelectValue placeholder={t.lobisomem.selectAuspice} /></SelectTrigger>
                        <SelectContent>
                          {AUSPICES.map(a => (
                            <SelectItem key={a} value={a}>{getI18nLabel(a, AUSPICE_I18N)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.lobisomem.breed}</Label>
                      <Select value={lobData.breed || ''} onValueChange={(val) => updateField('breed', val)}>
                        <SelectTrigger className="font-body"><SelectValue placeholder={t.lobisomem.selectBreed} /></SelectTrigger>
                        <SelectContent>
                          {BREEDS.map(b => (
                            <SelectItem key={b} value={b}>{getI18nLabel(b, BREED_I18N)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.lobisomem.rank}</Label>
                      <Select value={lobData.rank || ''} onValueChange={(val) => updateField('rank', val)}>
                        <SelectTrigger className="font-body"><SelectValue placeholder={t.lobisomem.selectRank} /></SelectTrigger>
                        <SelectContent>
                          {RANKS.map(r => (
                            <SelectItem key={r} value={r}>{getI18nLabel(r, RANK_I18N)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.lobisomem.pack}</Label>
                      <Input value={lobData.pack || ''} onChange={(e) => updateField('pack', e.target.value)} className="font-body" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.lobisomem.totem}</Label>
                      <Input value={lobData.totem || ''} onChange={(e) => updateField('totem', e.target.value)} className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.character.concept}</Label>
                      <Input value={concept} onChange={(e) => setConcept(e.target.value)} className="font-body" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.vampiro.nature}</Label>
                      <Input value={lobData.nature || ''} onChange={(e) => updateField('nature', e.target.value)} className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.vampiro.demeanor}</Label>
                      <Input value={lobData.demeanor || ''} onChange={(e) => updateField('demeanor', e.target.value)} className="font-body" />
                    </div>
                  </div>

                  {/* Pools vitais */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    {!isW5 && (
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm">{t.lobisomem.gnosis}</span>
                        <DotRating value={lobData.gnosis || 1} onChange={(val) => updateField('gnosis', val)} maxValue={10} minValue={1} />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{t.lobisomem.rage}</span>
                      <DotRating
                        value={Math.min(lobData.rage || 1, isW5 ? 5 : 10)}
                        onChange={(val) => updateField('rage', val)}
                        maxValue={isW5 ? 5 : 10}
                        minValue={isW5 ? 0 : 1}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{t.lobisomem.willpowerLabel}</span>
                      <DotRating
                        value={Math.min(lobData.willpower || 1, isW5 ? 5 : 10)}
                        onChange={(val) => updateField('willpower', val)}
                        maxValue={isW5 ? 5 : 10}
                        minValue={isW5 ? 0 : 1}
                      />
                    </div>
                    {isW5 && (
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm">
                          {language === 'pt-BR' ? 'Harmonia' : 'Harmony'}
                        </span>
                        <DotRating
                          value={(lobData as any).harmony ?? 7}
                          onChange={(val) => updateField('harmony' as any, val as any)}
                          maxValue={10}
                          minValue={0}
                        />
                      </div>
                    )}
                  </div>

                  {/* Renown — apenas W20 (W5 usa Harmonia acima) */}
                  {!isW5 && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <h4 className="font-medieval text-sm text-muted-foreground">{t.lobisomem.renown}</h4>
                      <RenownBlock
                        value={lobData.renown || { glory: 0, honor: 0, wisdom: 0 }}
                        onChange={(next) => updateField('renown', next)}
                        tribe={lobData.tribe}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Attributes */}
              <TabsContent value="attributes" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <AttributesEditor
                  value={attributes as AttributeValues}
                  onChange={(next) => setLobData((prev) => ({ ...prev, attributes: next as typeof prev.attributes }))}
                  minValue={1}
                  noCard
                  showTotals
                  totalOffset={-3}
                  overrides={getTraitOverrides(character.game_system).attributes}
                />
              </TabsContent>

              {/* Abilities */}
              <TabsContent value="abilities" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <AbilitiesEditor
                  value={abilities as AbilityValues}
                  onChange={(next) => setLobData((prev) => ({ ...prev, abilities: next }))}
                  specializations={(lobData as any).specializations || {}}
                  onSpecializationsChange={(next) => setLobData((prev) => ({ ...prev, specializations: next } as any))}
                  noCard
                  overrides={getTraitOverrides(character.game_system).abilities}
                />
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
                            {(t.lobisomem.giftLevel as string).replace('{level}', String(level))}
                          </h4>
                          <Button type="button" variant="ghost" size="sm" onClick={() => addGift(level)}>
                            <Plus className="w-3 h-3 mr-1" /> {t.lobisomem.addGift}
                          </Button>
                        </div>
                        {levelGifts.map((gift: any, i: number) => {
                          const giftName = typeof gift === 'string' ? gift : (gift?.name ?? '');
                          const giftDesc = typeof gift === 'string' ? '' : (gift?.description ?? '');
                          return (
                            <div key={i} className="space-y-1 rounded-md border border-border/60 p-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={giftName}
                                  onChange={(e) => updateGiftField(level, i, 'name', e.target.value)}
                                  placeholder={t.lobisomem.giftPlaceholder}
                                  className="font-body flex-1"
                                />
                                <Button type="button" variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeGift(level, i)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              <textarea
                                value={giftDesc}
                                onChange={(e) => updateGiftField(level, i, 'description', e.target.value)}
                                placeholder={language === 'pt-BR' ? 'Descrição (opcional)' : 'Description (optional)'}
                                rows={2}
                                className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 font-body"
                              />
                            </div>
                          );
                        })}
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
                  selected={(lobData.merits_flaws || []) as SelectedMeritFlaw[]}
                  onChange={(next) => setLobData((prev) => ({ ...prev, merits_flaws: next }))}
                  freebieBudget={15}
                  variant="edit"
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

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
