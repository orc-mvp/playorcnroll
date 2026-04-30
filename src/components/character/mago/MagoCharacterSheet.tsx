// Mago Character Sheet — World of Darkness M20
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Star as StarIcon, User, Shield, Brain, Sparkles, Users, Heart, BookOpen, Zap } from 'lucide-react';
import { XpReducer } from '../storyteller/shared/XpReducer';
import { toTitleCase } from '@/lib/textUtils';
import { MAGO_SPHERES, MAGO_BACKGROUNDS, type MagoCharacterData } from '@/lib/mago/spheres';
import { CharacterNotes } from '../CharacterNotes';
import { STORYTELLER_ABILITIES, getTraitLabel } from '@/lib/storyteller/traits';

const HEALTH_LEVELS = [
  { key: 'bruised', penalty: '' },
  { key: 'hurt', penalty: '-1' },
  { key: 'injured', penalty: '-1' },
  { key: 'wounded', penalty: '-2' },
  { key: 'mauled', penalty: '-2' },
  { key: 'crippled', penalty: '-5' },
  { key: 'incapacitated', penalty: '' },
] as const;

interface MagoCharacterSheetProps {
  character: {
    id: string;
    name: string;
    concept: string | null;
    vampiro_data: MagoCharacterData | null;
    notes?: string | null;
    experience_points?: number;
  };
  sessionTrackers?: {
    quintessence?: number;
    paradox?: number;
    arete?: number;
    willpower?: number;
    healthDamage?: boolean[];
  };
  readOnly?: boolean;
}

function DotDisplay({ value, maxValue = 5 }: { value: number; maxValue?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: maxValue }, (_, index) => (
        <div
          key={index}
          className={`w-3 h-3 rounded-full border-2 ${
            index < value
              ? 'bg-foreground border-foreground'
              : 'bg-transparent border-muted-foreground/40'
          }`}
        />
      ))}
    </div>
  );
}

function AttributeRow({ name, value }: { name: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm font-body">{name}</span>
      <DotDisplay value={value} />
    </div>
  );
}

function AbilityRow({ name, value, specialization }: { name: string; value: number; specialization?: string }) {
  const { t } = useI18n();
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="flex items-center justify-between py-0.5">
      <div className="flex items-center gap-1">
        <span className="text-sm font-body">{name}</span>
        {specialization && (
          <TooltipProvider delayDuration={0}>
            <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-primary hover:text-primary/80 transition-colors"
                  aria-label={t.vampiroTests?.specialization || 'Specialization'}
                >
                  <StarIcon className="w-3 h-3 fill-current" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{t.vampiroTests?.specialization || 'Specialization'}</p>
                <p className="text-muted-foreground">{specialization}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <DotDisplay value={value} />
    </div>
  );
}

const ABILITY_KEYS = {
  talents: STORYTELLER_ABILITIES.talents.items.map((i) => i.key),
  skills: STORYTELLER_ABILITIES.skills.items.map((i) => i.key),
  knowledges: STORYTELLER_ABILITIES.knowledges.items.map((i) => i.key),
} as const;

export default function MagoCharacterSheet({ character, sessionTrackers, readOnly = false }: MagoCharacterSheetProps) {
  const { t, language } = useI18n();
  const data: MagoCharacterData = (character.vampiro_data as MagoCharacterData) || ({} as MagoCharacterData);
  const experiencePoints = character.experience_points ?? 0;

  const [healthDamage, setHealthDamage] = useState<boolean[]>(sessionTrackers?.healthDamage ?? Array(7).fill(false));
  const [expandedMeritFlaw, setExpandedMeritFlaw] = useState<string | null>(null);
  const [meritFlawDescriptions, setMeritFlawDescriptions] = useState<Record<string, { description: string; prerequisites: string | null }>>({});
  const [liveMeritsFlaws, setLiveMeritsFlaws] = useState<{ id: string; name: string; cost: number; category: string }[] | null>(null);

  const meritsFlawsKey = JSON.stringify((data.merits_flaws || []).map((m) => m.id).sort());
  useEffect(() => {
    const ids = (data.merits_flaws || []).map((m) => m.id);
    if (ids.length === 0) return;
    supabase
      .from('merits_flaws')
      .select('id, name, cost, category, game_systems')
      .in('id', ids)
      .then(async ({ data: fresh }) => {
        if (!fresh) return;
        // Auto-cleanup: remove M&F that are no longer tagged for mago_m20
        const validIds = new Set(
          fresh
            .filter((mf: any) => Array.isArray(mf.game_systems) && mf.game_systems.includes('mago_m20'))
            .map((mf: any) => mf.id)
        );
        const currentMF = data.merits_flaws || [];
        const cleaned = currentMF.filter((m) => validIds.has(m.id));
        if (cleaned.length !== currentMF.length && !readOnly) {
          if (import.meta.env.DEV) {
            console.info('[MagoCharacterSheet] Auto-cleaning invalid merits/flaws', {
              before: currentMF.length,
              after: cleaned.length,
            });
          }
          await supabase
            .from('characters')
            .update({ vampiro_data: { ...data, merits_flaws: cleaned } as any })
            .eq('id', character.id);
        }
        setLiveMeritsFlaws(fresh.filter((mf: any) => validIds.has(mf.id)) as any);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meritsFlawsKey]);




  const attributes = data.attributes || {
    physical: { strength: 1, dexterity: 1, stamina: 1 },
    social: { charisma: 1, manipulation: 1, appearance: 1 },
    mental: { perception: 1, intelligence: 1, wits: 1 },
  };
  const abilities = data.abilities || { talents: {}, skills: {}, knowledges: {} };
  const specializations = data.specializations || {};
  const spheres = data.spheres || {};
  const rotes = data.rotes || {};
  const backgrounds = data.backgrounds || {};
  const arete = data.arete || 1;
  const willpower = data.willpower || 1;
  const quintessence = data.quintessence ?? 0;
  const paradox = data.paradox ?? 0;

  const toggleHealthDamage = (index: number) => {
    if (readOnly) return;
    const newDamage = [...healthDamage];
    newDamage[index] = !newDamage[index];
    setHealthDamage(newDamage);
  };

  const getBackgroundLabel = (key: string) => {
    const bg = MAGO_BACKGROUNDS.find((b) => b.key === key);
    if (!bg) return key;
    return language === 'pt-BR' ? bg.labelPt : bg.labelEn;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <Card className="medieval-card bg-gradient-to-br from-purple-500/20 to-background">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 border-2 border-purple-500/30">
              <StarIcon className="w-10 h-10 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-medieval text-2xl text-foreground">{character.name}</h2>
                {experiencePoints > 0 && (
                  <Badge variant="outline" className="font-mono text-xs px-1.5">
                    {experiencePoints} XP
                  </Badge>
                )}
                {!readOnly && experiencePoints > 0 && (
                  <XpReducer characterId={character.id} currentXp={experiencePoints} />
                )}
                {data.tradition && (
                  <Badge variant="outline" className="border-purple-500/30 text-purple-500">
                    {data.tradition}
                  </Badge>
                )}
              </div>
              {character.concept && (
                <p className="text-muted-foreground font-body mt-1">{character.concept}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {data.player && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="font-body">{data.player}</span>
                  </div>
                )}
                {data.chronicle && (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground/60 text-xs">{t.vampiro.chronicle}:</span>
                    <span className="font-body">{data.chronicle}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {data.essence && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">{t.mago.essence}</span>
                <span className="font-body text-foreground">
                  {(t.mago as any)[`essence_${data.essence}`] || data.essence}
                </span>
              </div>
            )}
            {data.cabal && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">{t.mago.cabal}</span>
                <span className="font-body text-foreground">{data.cabal}</span>
              </div>
            )}
            {data.nature && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">{t.vampiro.nature}</span>
                <span className="font-body text-foreground">{data.nature}</span>
              </div>
            )}
            {data.demeanor && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">{t.vampiro.demeanor}</span>
                <span className="font-body text-foreground">{data.demeanor}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attributes */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            {t.vampiro.attributes}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">{t.vampiro.physical}</h4>
              <div className="space-y-1">
                <AttributeRow name={t.vampiro.strength} value={attributes.physical.strength} />
                <AttributeRow name={t.vampiro.dexterity} value={attributes.physical.dexterity} />
                <AttributeRow name={t.vampiro.stamina} value={attributes.physical.stamina} />
              </div>
            </div>
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">{t.vampiro.social}</h4>
              <div className="space-y-1">
                <AttributeRow name={t.vampiro.charisma} value={attributes.social.charisma} />
                <AttributeRow name={t.vampiro.manipulation} value={attributes.social.manipulation} />
                <AttributeRow name={t.vampiro.appearance} value={attributes.social.appearance} />
              </div>
            </div>
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">{t.vampiro.mental}</h4>
              <div className="space-y-1">
                <AttributeRow name={t.vampiro.perception} value={attributes.mental.perception} />
                <AttributeRow name={t.vampiro.intelligence} value={attributes.mental.intelligence} />
                <AttributeRow name={t.vampiro.wits} value={attributes.mental.wits} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abilities */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            {t.vampiro.abilities}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['talents', 'skills', 'knowledges'] as const).map((cat) => (
              <div key={cat}>
                <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">
                  {t.vampiro[cat]}{' '}
                  <span className="text-muted-foreground/60">
                    ({ABILITY_KEYS[cat].reduce((sum, k) => sum + ((abilities[cat] as Record<string, number>)?.[k] || 0), 0)})
                  </span>
                </h4>
                <div className="space-y-1">
                  {ABILITY_KEYS[cat].map((key) => (
                    <AbilityRow
                      key={key}
                      name={getTraitLabel(key, language)}
                      value={(abilities[cat] as Record<string, number>)?.[key] || 0}
                      specialization={specializations[key]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spheres + Rotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="medieval-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-medieval flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              {t.mago.spheres}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {MAGO_SPHERES.map((sphere) => (
                <div key={sphere.key} className="flex items-center justify-between py-0.5">
                  <span className="text-sm font-body">
                    {language === 'pt-BR' ? sphere.labelPt : sphere.labelEn}
                  </span>
                  <DotDisplay value={spheres[sphere.key] || 0} maxValue={5} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="medieval-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-medieval flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-500" />
              {t.mago.rotes}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(rotes).some((k) => (rotes as any)[k]?.length > 0) ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((level) => {
                  const levelRotes = (rotes as any)[level] as string[] | undefined;
                  if (!levelRotes || levelRotes.length === 0) return null;
                  return (
                    <div key={level}>
                      <h5 className="font-medieval text-xs text-muted-foreground/70 mb-1">
                        {language === 'pt-BR' ? `Nível ${level}` : `Level ${level}`}
                      </h5>
                      <div className="space-y-0.5">
                        {levelRotes.map((rote, i) => (
                          <div key={i} className="text-sm font-body pl-2 border-l-2 border-purple-500/30 py-0.5">
                            {rote}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm font-body">{t.mago.noRotes}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backgrounds */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            {language === 'pt-BR' ? 'Antecedentes' : 'Backgrounds'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.values(backgrounds).some((v) => v > 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {Object.entries(backgrounds).map(([key, value]) => (
                value > 0 && (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-body">{getBackgroundLabel(key)}</span>
                    <DotDisplay value={value} maxValue={value} />
                  </div>
                )
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4 text-sm font-body">
              {t.vampiro.noBackgrounds}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Merits & Flaws */}
      {(() => {
        const meritsFlaws = liveMeritsFlaws || data.merits_flaws || [];
        if (meritsFlaws.length === 0) return null;
        const merits = meritsFlaws.filter((m) => m.cost > 0);
        const flaws = meritsFlaws.filter((m) => m.cost <= 0);
        const categoryLabel = (cat: string) =>
          (t.meritsFlaws[cat as keyof typeof t.meritsFlaws] as string) || cat;

        const groupAndSort = (items: typeof meritsFlaws) => {
          const grouped: Record<string, typeof meritsFlaws> = {};
          items.forEach((m) => {
            if (!grouped[m.category]) grouped[m.category] = [];
            grouped[m.category].push(m);
          });
          return Object.entries(grouped)
            .sort(([a], [b]) => categoryLabel(a).localeCompare(categoryLabel(b)))
            .map(([cat, items]) => ({ category: cat, items: items.sort((a, b) => a.name.localeCompare(b.name)) }));
        };

        const renderItem = (m: typeof meritsFlaws[0], isMerit: boolean) => {
          const isExpanded = expandedMeritFlaw === m.id;
          const desc = meritFlawDescriptions[m.id];
          return (
            <div key={m.id}>
              <button
                type="button"
                className="w-full flex items-center justify-between text-sm py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors text-left"
                onClick={() => {
                  if (isExpanded) {
                    setExpandedMeritFlaw(null);
                  } else {
                    setExpandedMeritFlaw(m.id);
                    if (!meritFlawDescriptions[m.id]) {
                      supabase
                        .from('merits_flaws')
                        .select('description, prerequisites')
                        .eq('id', m.id)
                        .single()
                        .then(({ data: mf }) => {
                          if (mf) setMeritFlawDescriptions((prev) => ({
                            ...prev,
                            [m.id]: { description: mf.description, prerequisites: mf.prerequisites },
                          }));
                        });
                    }
                  }
                }}
              >
                <span className="font-body">{toTitleCase(m.name)}</span>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${isMerit ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'}`}
                >
                  {isMerit ? '+' : ''}{m.cost} {t.meritsFlaws.points}
                </Badge>
              </button>
              {isExpanded && (
                <div className="px-2 pb-2 text-xs text-muted-foreground font-body animate-in fade-in-0 slide-in-from-top-1 duration-200">
                  {desc ? (
                    <>
                      <p>{desc.description}</p>
                      {desc.prerequisites && (
                        <p className="mt-1 italic">{t.meritsFlaws.prerequisites}: {desc.prerequisites}</p>
                      )}
                    </>
                  ) : (
                    <p>{t.common.loading}</p>
                  )}
                </div>
              )}
            </div>
          );
        };

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="medieval-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-medieval flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-500" />
                  {t.meritsFlaws.merits}
                  <Badge variant="outline" className="ml-auto text-xs border-green-500/50 text-green-500">
                    {merits.reduce((sum, m) => sum + m.cost, 0)} {t.meritsFlaws.points}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {merits.length > 0 ? (
                  <div className="space-y-3">
                    {groupAndSort(merits).map(({ category, items }) => (
                      <div key={category}>
                        <h5 className="font-medieval text-xs text-muted-foreground/70 mb-1">{categoryLabel(category)}</h5>
                        <div className="space-y-0.5">{items.map((m) => renderItem(m, true))}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4 text-sm font-body">{t.common.none}</p>
                )}
              </CardContent>
            </Card>
            <Card className="medieval-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-medieval flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-red-500" />
                  {t.meritsFlaws.flaws}
                  <Badge variant="outline" className="ml-auto text-xs border-red-500/50 text-red-500">
                    {flaws.reduce((sum, m) => sum + Math.abs(m.cost), 0)} {t.meritsFlaws.points}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {flaws.length > 0 ? (
                  <div className="space-y-3">
                    {groupAndSort(flaws).map(({ category, items }) => (
                      <div key={category}>
                        <h5 className="font-medieval text-xs text-muted-foreground/70 mb-1">{categoryLabel(category)}</h5>
                        <div className="space-y-0.5">{items.map((m) => renderItem(m, false))}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4 text-sm font-body">{t.common.none}</p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Pools: Arête, Vontade, Quintessência, Paradoxo + Vitalidade */}
      <Card className="medieval-card border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2 text-purple-500">
            <Zap className="w-5 h-5" />
            {t.mago.pools}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medieval text-sm text-muted-foreground mb-2">{t.mago.arete}</h4>
                <div className="flex justify-center">
                  <DotDisplay value={arete} maxValue={10} />
                </div>
                <p className="text-center text-xs text-muted-foreground mt-1">{arete}/10</p>
              </div>
              <div>
                <h4 className="font-medieval text-sm text-muted-foreground mb-2">{t.mago.willpowerLabel}</h4>
                <div className="flex justify-center">
                  <DotDisplay value={willpower} maxValue={10} />
                </div>
                <p className="text-center text-xs text-muted-foreground mt-1">{willpower}/10</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div className="text-center">
                  <h4 className="font-medieval text-xs text-muted-foreground mb-1">{t.mago.quintessence}</h4>
                  <Badge variant="outline" className="font-mono text-base border-purple-500/50 text-purple-500">
                    {quintessence}
                  </Badge>
                </div>
                <div className="text-center">
                  <h4 className="font-medieval text-xs text-muted-foreground mb-1">{t.mago.paradox}</h4>
                  <Badge variant="outline" className="font-mono text-base border-purple-700/50 text-purple-700">
                    {paradox}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-purple-500" />
                {t.mago.vitality}
              </h4>
              <div className="space-y-1 text-sm font-body">
                {HEALTH_LEVELS.map((level, index) => {
                  const isDamaged = healthDamage[index];
                  const levelName = t.vampiro[level.key as keyof typeof t.vampiro];
                  return (
                    <div key={level.key} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={readOnly ? undefined : () => toggleHealthDamage(index)}
                        disabled={readOnly}
                        className={`w-4 h-4 rounded border transition-colors ${
                          readOnly ? '' : 'cursor-pointer hover:border-foreground'
                        } ${
                          isDamaged
                            ? 'bg-foreground border-foreground'
                            : 'border-muted-foreground/40 bg-transparent'
                        }`}
                        aria-label={`${levelName} health level`}
                      />
                      <span className={isDamaged ? 'line-through text-muted-foreground' : ''}>
                        {levelName as string}{level.penalty ? ` (${level.penalty})` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <CharacterNotes
        characterId={character.id}
        initialNotes={character.notes || ''}
        readOnly={readOnly}
      />
    </div>
  );
}
