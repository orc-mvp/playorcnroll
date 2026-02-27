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
import { TRIBES, AUSPICES, BREEDS, RANKS } from '@/lib/lobisomem/tribes';
import type { LobisomemCharacterData } from '@/lib/lobisomem/diceUtils';

interface Character {
  id: string;
  name: string;
  concept: string | null;
  vampiro_data: LobisomemCharacterData | null;
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
  'Black Furies': 'tribe_blackFuries', 'Bone Gnawers': 'tribe_boneGnawers',
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

  const [name, setName] = useState(character.name);
  const [concept, setConcept] = useState(character.concept || '');
  const [lobData, setLobData] = useState<LobisomemCharacterData>(character.vampiro_data || {});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [availableMeritsFlaws, setAvailableMeritsFlaws] = useState<{ id: string; name: string; description: string; cost: number; category: string; prerequisites: string | null }[]>([]);

  useEffect(() => {
    setName(character.name);
    setConcept(character.concept || '');
    setLobData(character.vampiro_data || {});
  }, [character]);

  useEffect(() => {
    const fetchMF = async () => {
      const { data } = await supabase
        .from('merits_flaws')
        .select('id, name, description, cost, category, prerequisites')
        .contains('game_systems', ['lobisomem_w20'])
        .order('category')
        .order('cost', { ascending: false })
        .order('name');
      if (data) setAvailableMeritsFlaws(data);
    };
    if (open) fetchMF();
  }, [open]);

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

  const updateGift = (level: number, index: number, value: string) => {
    const gifts = { ...(lobData.gifts || {}) };
    const levelGifts = [...(gifts[level] || [])];
    levelGifts[index] = value;
    gifts[level] = levelGifts;
    setLobData(prev => ({ ...prev, gifts }));
  };

  const addGift = (level: number) => {
    const gifts = { ...(lobData.gifts || {}) };
    gifts[level] = [...(gifts[level] || []), ''];
    setLobData(prev => ({ ...prev, gifts }));
  };

  const removeGift = (level: number, index: number) => {
    const gifts = { ...(lobData.gifts || {}) };
    const levelGifts = [...(gifts[level] || [])];
    levelGifts.splice(index, 1);
    gifts[level] = levelGifts;
    setLobData(prev => ({ ...prev, gifts }));
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
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

                  {/* Gnosis, Rage, Willpower */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{t.lobisomem.gnosis}</span>
                      <DotRating value={lobData.gnosis || 1} onChange={(val) => updateField('gnosis', val)} maxValue={10} minValue={1} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{t.lobisomem.rage}</span>
                      <DotRating value={lobData.rage || 1} onChange={(val) => updateField('rage', val)} maxValue={10} minValue={1} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{t.lobisomem.willpowerLabel}</span>
                      <DotRating value={lobData.willpower || 1} onChange={(val) => updateField('willpower', val)} maxValue={10} minValue={1} />
                    </div>
                  </div>

                  {/* Renown */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <h4 className="font-medieval text-sm text-muted-foreground">{t.lobisomem.renown}</h4>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{t.lobisomem.glory}</span>
                      <DotRating value={lobData.renown?.glory || 0} onChange={(val) => updateField('renown', { ...(lobData.renown || { glory: 0, honor: 0, wisdom: 0 }), glory: val })} maxValue={10} minValue={0} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{t.lobisomem.honor}</span>
                      <DotRating value={lobData.renown?.honor || 0} onChange={(val) => updateField('renown', { ...(lobData.renown || { glory: 0, honor: 0, wisdom: 0 }), honor: val })} maxValue={10} minValue={0} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{t.lobisomem.wisdom}</span>
                      <DotRating value={lobData.renown?.wisdom || 0} onChange={(val) => updateField('renown', { ...(lobData.renown || { glory: 0, honor: 0, wisdom: 0 }), wisdom: val })} maxValue={10} minValue={0} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Attributes */}
              <TabsContent value="attributes" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                      {t.vampiro.physical}{' '}
                      <span className="text-muted-foreground/60">({Object.values(attributes.physical).reduce((s, v) => s + (Number(v) || 0), 0) - 3})</span>
                    </h4>
                    <div className="space-y-2">
                      {[
                        { key: 'strength', label: t.vampiro.strength },
                        { key: 'dexterity', label: t.vampiro.dexterity },
                        { key: 'stamina', label: t.vampiro.stamina },
                      ].map(attr => (
                        <div key={attr.key} className="flex items-center justify-between">
                          <span className="font-body text-sm">{attr.label}</span>
                          <DotRating value={attributes.physical[attr.key as keyof typeof attributes.physical] || 1} onChange={(val) => updateAttribute('physical', attr.key, val)} maxValue={5} minValue={1} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                      {t.vampiro.social}{' '}
                      <span className="text-muted-foreground/60">({Object.values(attributes.social).reduce((s, v) => s + (Number(v) || 0), 0) - 3})</span>
                    </h4>
                    <div className="space-y-2">
                      {[
                        { key: 'charisma', label: t.vampiro.charisma },
                        { key: 'manipulation', label: t.vampiro.manipulation },
                        { key: 'appearance', label: t.vampiro.appearance },
                      ].map(attr => (
                        <div key={attr.key} className="flex items-center justify-between">
                          <span className="font-body text-sm">{attr.label}</span>
                          <DotRating value={attributes.social[attr.key as keyof typeof attributes.social] || 1} onChange={(val) => updateAttribute('social', attr.key, val)} maxValue={5} minValue={1} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                      {t.vampiro.mental}{' '}
                      <span className="text-muted-foreground/60">({Object.values(attributes.mental).reduce((s, v) => s + (Number(v) || 0), 0) - 3})</span>
                    </h4>
                    <div className="space-y-2">
                      {[
                        { key: 'perception', label: t.vampiro.perception },
                        { key: 'intelligence', label: t.vampiro.intelligence },
                        { key: 'wits', label: t.vampiro.wits },
                      ].map(attr => (
                        <div key={attr.key} className="flex items-center justify-between">
                          <span className="font-body text-sm">{attr.label}</span>
                          <DotRating value={attributes.mental[attr.key as keyof typeof attributes.mental] || 1} onChange={(val) => updateAttribute('mental', attr.key, val)} maxValue={5} minValue={1} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Abilities */}
              <TabsContent value="abilities" className="mt-0 max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-6">
               {(['talents', 'skills', 'knowledges'] as const).map((cat) => {
                    const catTotal = Object.entries(ABILITY_NAMES[cat]).reduce((s, [key]) => s + (Number((abilities[cat] as Record<string, number>)?.[key]) || 0), 0);
                    return (
                    <div key={cat}>
                      <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                        {t.vampiro[cat]}{' '}
                        <span className="text-muted-foreground/60">({catTotal})</span>
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(ABILITY_NAMES[cat]).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="font-body text-sm">{(t.vampiro as any)[key] || label}</span>
                            <DotRating value={(abilities[cat] as Record<string, number>)?.[key] || 0} onChange={(val) => updateAbility(cat, key, val)} maxValue={5} minValue={0} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                  })}
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
                            {(t.lobisomem.giftLevel as string).replace('{level}', String(level))}
                          </h4>
                          <Button type="button" variant="ghost" size="sm" onClick={() => addGift(level)}>
                            <Plus className="w-3 h-3 mr-1" /> {t.lobisomem.addGift}
                          </Button>
                        </div>
                        {levelGifts.map((gift: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              value={gift}
                              onChange={(e) => updateGift(level, i, e.target.value)}
                              placeholder={t.lobisomem.giftPlaceholder}
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
                <div className="space-y-3">
                  {(() => {
                    const selectedMF = (lobData.merits_flaws || []) as { id: string; name: string; cost: number; category: string }[];
                    const totalCost = selectedMF.reduce((s, m) => s + m.cost, 0);
                    const freebiePoints = 15;
                    const remaining = freebiePoints - totalCost;
                    const categoryLabelFn = (cat: string) => (t.meritsFlaws[cat as keyof typeof t.meritsFlaws] as string) || cat;

                    const toggleMeritFlaw = (item: typeof availableMeritsFlaws[0]) => {
                      const isSelected = selectedMF.some((s) => s.id === item.id);
                      const updated = isSelected
                        ? selectedMF.filter((s) => s.id !== item.id)
                        : [...selectedMF, { id: item.id, name: item.name, cost: item.cost, category: item.category }];
                      setLobData(prev => ({ ...prev, merits_flaws: updated }));
                    };

                    return (
                      <>
                        <div className="flex items-center justify-center gap-3 p-2 rounded-lg bg-muted/30 border border-border">
                          <span className="font-medieval text-xs">{t.meritsFlaws.freebiePoints}:</span>
                          <Badge variant="outline" className={`text-xs ${remaining >= 0 ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'}`}>
                            {remaining} {t.meritsFlaws.freebieRemaining} ({t.meritsFlaws.freebieTotal} {freebiePoints})
                          </Badge>
                        </div>
                        {availableMeritsFlaws.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground font-body text-sm">
                            {language === 'pt-BR' ? 'Nenhuma disponível.' : 'None available.'}
                          </div>
                        ) : (
                          availableMeritsFlaws.map((item) => {
                            const isChecked = selectedMF.some((s) => s.id === item.id);
                            const isMerit = item.cost > 0;
                            return (
                              <div
                                key={item.id}
                                className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-muted/30'}`}
                                onClick={() => toggleMeritFlaw(item)}
                              >
                                <Checkbox checked={isChecked} onCheckedChange={() => toggleMeritFlaw(item)} className="mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="font-medieval text-xs">{item.name}</span>
                                    <Badge variant="outline" className={`text-[10px] ${isMerit ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'}`}>
                                      {isMerit ? '+' : ''}{item.cost}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px]">{categoryLabelFn(item.category)}</Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground font-body mt-0.5 line-clamp-1">{item.description}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </>
                    );
                  })()}
                </div>
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
