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
import { Star, User, Shield, Brain, BookOpen, Sparkles, Plus, X, Users, Zap } from 'lucide-react';
import DotRating from '@/components/character/vampiro/DotRating';
import MeritsFlawsSelector, { type SelectedMeritFlaw } from '@/components/character/storyteller/shared/MeritsFlawsSelector';
import { MAGO_SPHERES, MAGO_BACKGROUNDS, MAGO_TRADITIONS, type MagoCharacterData } from '@/lib/mago/spheres';
import {
  STORYTELLER_ATTRIBUTES as ATTRIBUTES,
  STORYTELLER_ABILITIES as ABILITIES,
} from '@/lib/storyteller/traits';

interface Character {
  id: string;
  name: string;
  concept: string | null;
  vampiro_data: MagoCharacterData | null;
}

interface EditMagoCharacterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character;
  onSave: (updated: Character) => void;
}

type AttributeCategory = 'physical' | 'social' | 'mental';
type AbilityCategory = 'talents' | 'skills' | 'knowledges';

export function EditMagoCharacterModal({
  open,
  onOpenChange,
  character,
  onSave,
}: EditMagoCharacterModalProps) {
  const { t, language } = useI18n();
  const { toast } = useToast();

  const [name, setName] = useState(character.name);
  const [concept, setConcept] = useState(character.concept || '');
  const [magoData, setMagoData] = useState<MagoCharacterData>(
    (character.vampiro_data as MagoCharacterData) || ({} as MagoCharacterData),
  );
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [availableMeritsFlaws, setAvailableMeritsFlaws] = useState<
    { id: string; name: string; description: string; cost: number; category: string; prerequisites: string | null }[]
  >([]);

  useEffect(() => {
    setName(character.name);
    setConcept(character.concept || '');
    setMagoData((character.vampiro_data as MagoCharacterData) || ({} as MagoCharacterData));
  }, [character]);

  useEffect(() => {
    const fetchMF = async () => {
      const { data } = await supabase
        .from('merits_flaws')
        .select('id, name, description, cost, category, prerequisites')
        .contains('game_systems', ['mago_m20'])
        .order('category')
        .order('cost', { ascending: false })
        .order('name');
      if (data) setAvailableMeritsFlaws(data);
    };
    if (open) fetchMF();
  }, [open]);

  const updateField = <K extends keyof MagoCharacterData>(key: K, value: MagoCharacterData[K]) => {
    setMagoData((prev) => ({ ...prev, [key]: value }));
  };

  const updateAttribute = (category: AttributeCategory, attr: string, value: number) => {
    setMagoData((prev) => ({
      ...prev,
      attributes: {
        physical: prev.attributes?.physical || { strength: 1, dexterity: 1, stamina: 1 },
        social: prev.attributes?.social || { charisma: 1, manipulation: 1, appearance: 1 },
        mental: prev.attributes?.mental || { perception: 1, intelligence: 1, wits: 1 },
        [category]: { ...(prev.attributes as any)?.[category], [attr]: value },
      },
    }));
  };

  const updateAbility = (category: AbilityCategory, ability: string, value: number) => {
    setMagoData((prev) => ({
      ...prev,
      abilities: {
        talents: prev.abilities?.talents || {},
        skills: prev.abilities?.skills || {},
        knowledges: prev.abilities?.knowledges || {},
        [category]: { ...(prev.abilities as any)?.[category], [ability]: value },
      },
    }));
  };

  const updateSphere = (key: string, value: number) => {
    setMagoData((prev) => ({ ...prev, spheres: { ...prev.spheres, [key]: value } }));
  };

  const updateBackground = (key: string, value: number) => {
    setMagoData((prev) => ({ ...prev, backgrounds: { ...prev.backgrounds, [key]: value } }));
  };

  const updateRote = (level: number, index: number, value: string) => {
    const rotes = { ...(magoData.rotes || {}) } as Record<number, string[]>;
    const levelRotes = [...(rotes[level] || [])];
    levelRotes[index] = value;
    rotes[level] = levelRotes;
    setMagoData((prev) => ({ ...prev, rotes }));
  };

  const addRote = (level: number) => {
    const rotes = { ...(magoData.rotes || {}) } as Record<number, string[]>;
    rotes[level] = [...(rotes[level] || []), ''];
    setMagoData((prev) => ({ ...prev, rotes }));
  };

  const removeRote = (level: number, index: number) => {
    const rotes = { ...(magoData.rotes || {}) } as Record<number, string[]>;
    const levelRotes = [...(rotes[level] || [])];
    levelRotes.splice(index, 1);
    rotes[level] = levelRotes;
    setMagoData((prev) => ({ ...prev, rotes }));
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
          vampiro_data: JSON.parse(JSON.stringify(magoData)),
        })
        .eq('id', character.id);

      if (error) throw error;

      const updated: Character = {
        ...character,
        name: name.trim(),
        concept: concept.trim() || null,
        vampiro_data: magoData,
      };

      onSave(updated);
      toast({ title: t.editVampiro.characterUpdated });
      onOpenChange(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating Mago character:', error);
      toast({ title: t.editVampiro.errorSaving, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const attributes = magoData.attributes || {
    physical: { strength: 1, dexterity: 1, stamina: 1 },
    social: { charisma: 1, manipulation: 1, appearance: 1 },
    mental: { perception: 1, intelligence: 1, wits: 1 },
  };
  const abilities = magoData.abilities || { talents: {}, skills: {}, knowledges: {} };
  const spheres = magoData.spheres || {};
  const rotes = (magoData.rotes || {}) as Record<number, string[]>;
  const backgrounds = magoData.backgrounds || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col w-[95vw]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-500" />
            {t.mago.editCharacter}
          </DialogTitle>
          <DialogDescription className="font-body">{t.mago.editMageInfo}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full font-medieval shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t.mago.tabBasic}
                </div>
              </SelectItem>
              <SelectItem value="attributes">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {t.mago.tabAttributes}
                </div>
              </SelectItem>
              <SelectItem value="abilities">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  {t.mago.tabAbilities}
                </div>
              </SelectItem>
              <SelectItem value="spheres">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t.mago.tabSpheres}
                </div>
              </SelectItem>
              <SelectItem value="rotes">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {t.mago.tabRotes}
                </div>
              </SelectItem>
              <SelectItem value="backgrounds">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t.mago.tabBackgrounds}
                </div>
              </SelectItem>
              <SelectItem value="meritsflaws">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {t.meritsFlaws.title}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 mt-4 min-h-0">
              {/* Basic Info */}
              <TabsContent value="basic" className="mt-0 max-h-[55vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.character.name} *</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} className="font-body" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.vampiro.player}</Label>
                      <Input
                        value={magoData.player || ''}
                        onChange={(e) => updateField('player', e.target.value)}
                        className="font-body"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.vampiro.chronicle}</Label>
                      <Input
                        value={magoData.chronicle || ''}
                        onChange={(e) => updateField('chronicle', e.target.value)}
                        className="font-body"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.mago.tradition}</Label>
                      <Select value={magoData.tradition || ''} onValueChange={(v) => updateField('tradition', v)}>
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder={t.mago.selectTradition} />
                        </SelectTrigger>
                        <SelectContent>
                          {MAGO_TRADITIONS.map((trad) => (
                            <SelectItem key={trad} value={trad}>
                              {trad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.mago.essence}</Label>
                      <Select value={magoData.essence || ''} onValueChange={(v) => updateField('essence', v)}>
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder={t.mago.selectEssence} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dynamic">{t.mago.essence_dynamic}</SelectItem>
                          <SelectItem value="pattern">{t.mago.essence_pattern}</SelectItem>
                          <SelectItem value="primordial">{t.mago.essence_primordial}</SelectItem>
                          <SelectItem value="questing">{t.mago.essence_questing}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.mago.cabal}</Label>
                      <Input
                        value={magoData.cabal || ''}
                        onChange={(e) => updateField('cabal', e.target.value)}
                        placeholder={t.mago.cabalPlaceholder}
                        className="font-body"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.vampiro.nature}</Label>
                      <Input
                        value={magoData.nature || ''}
                        onChange={(e) => updateField('nature', e.target.value)}
                        className="font-body"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medieval">{t.vampiro.demeanor}</Label>
                      <Input
                        value={magoData.demeanor || ''}
                        onChange={(e) => updateField('demeanor', e.target.value)}
                        className="font-body"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medieval">{t.character.concept}</Label>
                    <Input value={concept} onChange={(e) => setConcept(e.target.value)} className="font-body" />
                  </div>

                  {/* Pools: Arête, Vontade, Quintessência, Paradoxo */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <h4 className="font-medieval text-sm text-muted-foreground">{t.mago.pools}</h4>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{t.mago.arete}</span>
                      <DotRating
                        value={magoData.arete || 1}
                        onChange={(val) => updateField('arete', val)}
                        maxValue={10}
                        minValue={1}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm">{t.mago.willpowerLabel}</span>
                      <DotRating
                        value={magoData.willpower || 1}
                        onChange={(val) => updateField('willpower', val)}
                        maxValue={10}
                        minValue={1}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-body text-sm whitespace-nowrap">{t.mago.quintessence}</span>
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={magoData.quintessence ?? 0}
                        onChange={(e) =>
                          updateField('quintessence', Math.max(0, Math.min(20, Number(e.target.value) || 0)))
                        }
                        className="w-20 font-body text-center"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-body text-sm whitespace-nowrap">{t.mago.paradox}</span>
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={magoData.paradox ?? 0}
                        onChange={(e) =>
                          updateField('paradox', Math.max(0, Math.min(20, Number(e.target.value) || 0)))
                        }
                        className="w-20 font-body text-center"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Attributes */}
              <TabsContent value="attributes" className="mt-0 max-h-[55vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                  {(['physical', 'social', 'mental'] as AttributeCategory[]).map((cat) => {
                    const section = ATTRIBUTES[cat];
                    return (
                      <div key={cat}>
                        <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                          {section.label[language as 'pt-BR' | 'en-US']}
                        </h4>
                        <div className="space-y-2">
                          {section.items.map((attr) => (
                            <div key={attr.key} className="flex items-center justify-between">
                              <span className="font-body text-sm">
                                {attr.label[language as 'pt-BR' | 'en-US']}
                              </span>
                              <DotRating
                                value={
                                  (attributes as any)[cat][attr.key] ?? 1
                                }
                                onChange={(val) => updateAttribute(cat, attr.key, val)}
                                maxValue={5}
                                minValue={1}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Abilities */}
              <TabsContent value="abilities" className="mt-0 max-h-[55vh] overflow-y-auto pr-2">
                <div className="space-y-6">
                  {(['talents', 'skills', 'knowledges'] as AbilityCategory[]).map((cat) => {
                    const section = ABILITIES[cat];
                    const total = section.items.reduce(
                      (s, item) => s + ((abilities[cat] as Record<string, number>)?.[item.key] || 0),
                      0,
                    );
                    return (
                      <div key={cat}>
                        <h4 className="font-medieval text-sm text-muted-foreground mb-3">
                          {section.label[language as 'pt-BR' | 'en-US']}{' '}
                          <span className="text-muted-foreground/60">({total})</span>
                        </h4>
                        <div className="space-y-2">
                          {section.items.map((ability) => (
                            <div key={ability.key} className="flex items-center justify-between">
                              <span className="font-body text-sm">
                                {ability.label[language as 'pt-BR' | 'en-US']}
                              </span>
                              <DotRating
                                value={(abilities[cat] as Record<string, number>)?.[ability.key] || 0}
                                onChange={(val) => updateAbility(cat, ability.key, val)}
                                maxValue={5}
                                minValue={0}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Spheres */}
              <TabsContent value="spheres" className="mt-0 max-h-[55vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-body mb-2">{t.mago.spheresDesc}</p>
                  {MAGO_SPHERES.map((sphere) => (
                    <div key={sphere.key} className="flex items-center justify-between">
                      <span className="font-body text-sm">
                        {language === 'pt-BR' ? sphere.labelPt : sphere.labelEn}
                      </span>
                      <DotRating
                        value={spheres[sphere.key] || 0}
                        onChange={(val) => updateSphere(sphere.key, val)}
                        maxValue={5}
                        minValue={0}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Rotes */}
              <TabsContent value="rotes" className="mt-0 max-h-[55vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground font-body">{t.mago.rotesDesc}</p>
                  {[1, 2, 3, 4, 5].map((level) => {
                    const levelRotes = rotes[level] || [];
                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medieval text-sm text-muted-foreground">
                            {language === 'pt-BR' ? `Nível ${level}` : `Level ${level}`}
                          </h4>
                          <Button type="button" variant="ghost" size="sm" onClick={() => addRote(level)}>
                            <Plus className="w-3 h-3 mr-1" /> {t.mago.addRote}
                          </Button>
                        </div>
                        {levelRotes.map((rote, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              value={rote}
                              onChange={(e) => updateRote(level, i, e.target.value)}
                              placeholder={t.mago.rotePlaceholder}
                              className="font-body flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0 h-8 w-8"
                              onClick={() => removeRote(level, i)}
                            >
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
              <TabsContent value="backgrounds" className="mt-0 max-h-[55vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  {MAGO_BACKGROUNDS.map((bg) => (
                    <div key={bg.key} className="flex items-center justify-between">
                      <span className="font-body text-sm">
                        {language === 'pt-BR' ? bg.labelPt : bg.labelEn}
                      </span>
                      <DotRating
                        value={backgrounds[bg.key] || 0}
                        onChange={(val) => updateBackground(bg.key, val)}
                        maxValue={10}
                        minValue={0}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Merits & Flaws */}
              <TabsContent value="meritsflaws" className="mt-0 max-h-[55vh] overflow-y-auto pr-2">
                <MeritsFlawsSelector
                  gameSystem="mago_m20"
                  selected={(magoData.merits_flaws || []) as SelectedMeritFlaw[]}
                  onChange={(next) => {
                    setMagoData((prev) => ({ ...prev, merits_flaws: next }));
                  }}
                  onAvailableLoaded={(available) => {
                    // Auto-limpeza: remove M&F que não pertencem mais a Mago
                    const validIds = new Set(available.map((a) => a.id));
                    const current = (magoData.merits_flaws || []) as SelectedMeritFlaw[];
                    const cleaned = current.filter((m) => validIds.has(m.id));
                    if (cleaned.length !== current.length) {
                      if (import.meta.env.DEV) {
                        console.info('[EditMagoCharacterModal] auto-removed invalid M&F', current.length - cleaned.length);
                      }
                      setMagoData((prev) => ({ ...prev, merits_flaws: cleaned }));
                    }
                  }}
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
