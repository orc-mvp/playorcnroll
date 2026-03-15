// Lobisomem Character Sheet with i18n support
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
import { Dog, User, Shield, Brain, Sparkles, Users, Flame, Star, Award, Heart, Crown } from 'lucide-react';
import { toTitleCase } from '@/lib/textUtils';
import type { LobisomemCharacterData } from '@/lib/lobisomem/diceUtils';
import { CharacterNotes } from '../CharacterNotes';

// Tribe key mapping
const TRIBE_KEYS: Record<string, string> = {
  'Black Furies': 'tribe_blackFuries',
  'Black Spiral Dancers': 'tribe_blackSpiralDancers',
  'Bone Gnawers': 'tribe_boneGnawers',
  'Children of Gaia': 'tribe_childrenOfGaia',
  'Fianna': 'tribe_fianna',
  'Get of Fenris': 'tribe_getOfFenris',
  'Glass Walkers': 'tribe_glassWalkers',
  'Red Talons': 'tribe_redTalons',
  'Shadow Lords': 'tribe_shadowLords',
  'Silent Striders': 'tribe_silentStriders',
  'Silver Fangs': 'tribe_silverFangs',
  'Stargazers': 'tribe_stargazers',
  'Uktena': 'tribe_uktena',
  'Wendigo': 'tribe_wendigo',
};

const AUSPICE_KEYS: Record<string, string> = {
  'Ragabash': 'auspice_ragabash',
  'Theurge': 'auspice_theurge',
  'Philodox': 'auspice_philodox',
  'Galliard': 'auspice_galliard',
  'Ahroun': 'auspice_ahroun',
};

const BREED_KEYS: Record<string, string> = {
  'Homid': 'breed_homid',
  'Metis': 'breed_metis',
  'Lupus': 'breed_lupus',
};

const RANK_KEYS: Record<string, string> = {
  'Cliath': 'rank_cliath',
  'Fostern': 'rank_fostern',
  'Adren': 'rank_adren',
  'Athro': 'rank_athro',
  'Elder': 'rank_elder',
};

// Background display names
const BACKGROUND_DISPLAY: Record<string, { pt: string; en: string }> = {
  allies: { pt: 'Aliados', en: 'Allies' },
  ancestors: { pt: 'Ancestrais', en: 'Ancestors' },
  contacts: { pt: 'Contatos', en: 'Contacts' },
  fetish: { pt: 'Fetiche', en: 'Fetish' },
  kinfolk: { pt: 'Parentes', en: 'Kinfolk' },
  mentor: { pt: 'Mentor', en: 'Mentor' },
  numen: { pt: 'Numen', en: 'Numen' },
  prophecy: { pt: 'Profecia', en: 'Prophecy' },
  pureBreed: { pt: 'Raça Pura', en: 'Pure Breed' },
  resources: { pt: 'Recursos', en: 'Resources' },
  rites: { pt: 'Rituais', en: 'Rites' },
  spiritHeritage: { pt: 'Herança Espiritual', en: 'Spirit Heritage' },
  touched: { pt: 'Tocado', en: 'Touched' },
  totemPersonal: { pt: 'Totem (Pessoal)', en: 'Totem (Personal)' },
};

const HEALTH_LEVELS = [
  { key: 'bruised', penalty: '' },
  { key: 'hurt', penalty: '-1' },
  { key: 'injured', penalty: '-1' },
  { key: 'wounded', penalty: '-2' },
  { key: 'mauled', penalty: '-2' },
  { key: 'crippled', penalty: '-5' },
  { key: 'incapacitated', penalty: '' },
] as const;

interface LobisomemCharacterSheetProps {
  character: {
    id: string;
    name: string;
    concept: string | null;
    vampiro_data: LobisomemCharacterData | null;
    notes?: string | null;
  };
  sessionTrackers?: {
    gnosis?: number;
    rage?: number;
    willpower?: number;
    healthDamage?: boolean[];
    form?: string;
  };
  experiencePoints?: number;
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
                  <Star className="w-3 h-3 fill-current" />
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
  talents: ['alertness', 'athletics', 'brawl', 'dodge', 'empathy', 'expression', 'intimidation', 'leadership', 'primalUrge', 'subterfuge'] as const,
  skills: ['animalKen', 'crafts', 'drive', 'etiquette', 'firearms', 'melee', 'performance', 'security', 'stealth', 'survival'] as const,
  knowledges: ['academics', 'computer', 'enigmas', 'investigation', 'law', 'linguistics', 'medicine', 'occult', 'politics', 'rituals', 'science'] as const,
};

export default function LobisomemCharacterSheet({ character, sessionTrackers, experiencePoints, readOnly = false }: LobisomemCharacterSheetProps) {
  const { t, language } = useI18n();
  const data: LobisomemCharacterData = (character.vampiro_data as LobisomemCharacterData) || {};
  const lang = language === 'pt-BR' ? 'pt' : 'en';

  // Interactive state for trackers
  const [currentGnosis, setCurrentGnosis] = useState(sessionTrackers?.gnosis ?? 0);
  const [currentRage, setCurrentRage] = useState(sessionTrackers?.rage ?? 0);
  const [currentWillpower, setCurrentWillpower] = useState(sessionTrackers?.willpower ?? 0);
  const [healthDamage, setHealthDamage] = useState<boolean[]>(sessionTrackers?.healthDamage ?? Array(7).fill(false));
  const [xpLog, setXpLog] = useState<{ id: string; amount: number; narrator_name: string; note: string | null; created_at: string }[]>([]);
  const [expandedMeritFlaw, setExpandedMeritFlaw] = useState<string | null>(null);
  const [meritFlawDescriptions, setMeritFlawDescriptions] = useState<Record<string, { description: string; prerequisites: string | null }>>({});
  const [liveMeritsFlaws, setLiveMeritsFlaws] = useState<{ id: string; name: string; cost: number; category: string }[] | null>(null);

  // Fetch live merits/flaws data from DB to keep category/name/cost up to date
  const meritsFlawsKey = JSON.stringify((data.merits_flaws || []).map((m: any) => m.id).sort());
  useEffect(() => {
    const ids = (data.merits_flaws || []).map((m: any) => m.id);
    if (ids.length === 0) return;
    supabase
      .from('merits_flaws')
      .select('id, name, cost, category')
      .in('id', ids)
      .then(({ data: fresh }) => {
        if (fresh) setLiveMeritsFlaws(fresh as any);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meritsFlawsKey]);


  // Fetch XP log with realtime
  useEffect(() => {
    const fetchXpLog = async () => {
      const { data: logs } = await supabase
        .from('xp_log')
        .select('id, amount, narrator_name, note, created_at')
        .eq('character_id', character.id)
        .order('created_at', { ascending: false });
      if (logs) setXpLog(logs);
    };
    fetchXpLog();

    const channel = supabase
      .channel(`xp_log_lobisomem_${character.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'xp_log',
        filter: `character_id=eq.${character.id}`,
      }, () => { fetchXpLog(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [character.id]);

  const attributes = data.attributes || {
    physical: { strength: 1, dexterity: 1, stamina: 1 },
    social: { charisma: 1, manipulation: 1, appearance: 1 },
    mental: { perception: 1, intelligence: 1, wits: 1 },
  };
  const abilities = data.abilities || { talents: {}, skills: {}, knowledges: {} };
  const specializations = data.specializations || {};
  const backgrounds = data.backgrounds || {};
  const gnosis = data.gnosis || 1;
  const rage = data.rage || 1;
  const willpower = data.willpower || 1;
  const gifts = data.gifts || {};
  const renown = data.renown || { glory: 0, honor: 0, wisdom: 0 };

  const getTranslatedName = (value: string, keyMap: Record<string, string>) => {
    const key = keyMap[value];
    if (key) {
      return (t.lobisomem as any)[key] || value;
    }
    return value;
  };

  const getBackgroundName = (key: string) => BACKGROUND_DISPLAY[key]?.[lang] || key;

  const toggleHealthDamage = (index: number) => {
    const newDamage = [...healthDamage];
    newDamage[index] = !newDamage[index];
    setHealthDamage(newDamage);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Character Header */}
      <Card className="medieval-card bg-gradient-to-br from-emerald-500/20 to-background">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 border-2 border-emerald-500/30">
              <Dog className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-medieval text-2xl text-foreground">{character.name}</h2>
                {(experiencePoints ?? 0) > 0 && (
                  <Badge variant="outline" className="font-mono text-xs px-1.5">
                    {experiencePoints} XP
                  </Badge>
                )}
                {data.tribe && (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
                    {getTranslatedName(data.tribe, TRIBE_KEYS)}
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
            {data.auspice && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">{t.lobisomem.auspice}</span>
                <span className="font-body text-foreground">{getTranslatedName(data.auspice, AUSPICE_KEYS)}</span>
              </div>
            )}
            {data.breed && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">{t.lobisomem.breed}</span>
                <span className="font-body text-foreground">{getTranslatedName(data.breed, BREED_KEYS)}</span>
              </div>
            )}
            {data.rank && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">{t.lobisomem.rank}</span>
                <span className="font-body text-foreground">{getTranslatedName(data.rank, RANK_KEYS)}</span>
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
            {data.pack && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">{t.lobisomem.pack}</span>
                <span className="font-body text-foreground">{data.pack}</span>
              </div>
            )}
            {data.totem && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">{t.lobisomem.totem}</span>
                <span className="font-body text-foreground">{data.totem}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attributes */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
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
            <Brain className="w-5 h-5 text-emerald-500" />
            {t.vampiro.abilities}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">
                {t.vampiro.talents}{' '}
                <span className="text-muted-foreground/60">({ABILITY_KEYS.talents.reduce((sum, k) => sum + (abilities.talents[k] || 0), 0)})</span>
              </h4>
              <div className="space-y-1">
                {ABILITY_KEYS.talents.map((key) => (
                  <AbilityRow key={key} name={t.vampiro[key]} value={abilities.talents[key] || 0} specialization={specializations[key]} />
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">
                {t.vampiro.skills}{' '}
                <span className="text-muted-foreground/60">({ABILITY_KEYS.skills.reduce((sum, k) => sum + (abilities.skills[k] || 0), 0)})</span>
              </h4>
              <div className="space-y-1">
                {ABILITY_KEYS.skills.map((key) => (
                  <AbilityRow key={key} name={t.vampiro[key]} value={abilities.skills[key] || 0} specialization={specializations[key]} />
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">
                {t.vampiro.knowledges}{' '}
                <span className="text-muted-foreground/60">({ABILITY_KEYS.knowledges.reduce((sum, k) => sum + (abilities.knowledges[k] || 0), 0)})</span>
              </h4>
              <div className="space-y-1">
                {ABILITY_KEYS.knowledges.map((key) => (
                  <AbilityRow key={key} name={t.vampiro[key]} value={abilities.knowledges[key] || 0} specialization={specializations[key]} />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gifts & Backgrounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gifts */}
        <Card className="medieval-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-medieval flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              {t.lobisomem.gifts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(gifts).length > 0 ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((level) => {
                  const levelGifts = gifts[level] || [];
                  if (levelGifts.length === 0) return null;
                  return (
                    <div key={level}>
                      <h5 className="font-medieval text-xs text-muted-foreground/70 mb-1">
                        {(t.lobisomem.giftLevel as string).replace('{level}', String(level))}
                      </h5>
                      <div className="space-y-0.5">
                        {levelGifts.map((gift: string, i: number) => (
                          <div key={i} className="text-sm font-body pl-2 border-l-2 border-emerald-500/30 py-0.5">
                            {gift}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm font-body">
                {t.lobisomem.noGifts}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Backgrounds */}
        <Card className="medieval-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-medieval flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              {t.lobisomem.tabBackgrounds}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(backgrounds).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(backgrounds).map(([key, value]) => (
                  value > 0 && (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-body">{getBackgroundName(key)}</span>
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
      </div>

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
            .map(([cat, items]) => ({
              category: cat,
              items: items.sort((a, b) => a.name.localeCompare(b.name)),
            }));
        };

        const MeritFlawItem = ({ m, isMerit }: { m: typeof meritsFlaws[0]; isMerit: boolean }) => {
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
                        .then(({ data: mfData }) => {
                          if (mfData) {
                            setMeritFlawDescriptions((prev) => ({
                              ...prev,
                              [m.id]: { description: mfData.description, prerequisites: mfData.prerequisites },
                            }));
                          }
                        });
                    }
                  }
                }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-body">{toTitleCase(m.name)}</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${
                    isMerit ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'
                  }`}
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                {merits.length > 0 ? (
                  <div className="space-y-3">
                    {groupAndSort(merits).map(({ category, items }) => (
                      <div key={category}>
                        <h5 className="font-medieval text-xs text-muted-foreground/70 mb-1">{categoryLabel(category)}</h5>
                        <div className="space-y-0.5">
                          {items.map((m) => <MeritFlawItem key={m.id} m={m} isMerit={true} />)}
                        </div>
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                {flaws.length > 0 ? (
                  <div className="space-y-3">
                    {groupAndSort(flaws).map(({ category, items }) => (
                      <div key={category}>
                        <h5 className="font-medieval text-xs text-muted-foreground/70 mb-1">{categoryLabel(category)}</h5>
                        <div className="space-y-0.5">
                          {items.map((m) => <MeritFlawItem key={m.id} m={m} isMerit={false} />)}
                        </div>
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

      {/* Salvatérios: Gnose, Fúria, Vitalidade, Força de Vontade */}
      <Card className="medieval-card border-emerald-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2 text-emerald-500">
            <Flame className="w-5 h-5" />
            {t.lobisomem.salvaterios}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column: Gnose, Fúria, Força de Vontade */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medieval text-sm text-muted-foreground mb-2">{t.lobisomem.gnosis}</h4>
                <div className="flex justify-center">
                  <DotDisplay value={gnosis} maxValue={10} />
                </div>
                <p className="text-center text-xs text-muted-foreground mt-1">{gnosis}/10</p>
              </div>
              <div>
                <h4 className="font-medieval text-sm text-muted-foreground mb-2">{t.lobisomem.rage}</h4>
                <div className="flex justify-center">
                  <DotDisplay value={rage} maxValue={10} />
                </div>
                <p className="text-center text-xs text-muted-foreground mt-1">{rage}/10</p>
              </div>
              <div>
                <h4 className="font-medieval text-sm text-muted-foreground mb-2">{t.lobisomem.willpowerLabel}</h4>
                <div className="flex justify-center">
                  <DotDisplay value={willpower} maxValue={10} />
                </div>
                <p className="text-center text-xs text-muted-foreground mt-1">{willpower}/10</p>
              </div>
            </div>

            {/* Right column: Vitalidade */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2">{t.lobisomem.vitality}</h4>
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
                        {levelName}{level.penalty ? ` (${level.penalty})` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Renome: Glória, Honra, Sabedoria */}
      <Card className="medieval-card border-emerald-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2 text-emerald-500">
            <Crown className="w-5 h-5" />
            {t.lobisomem.renown}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(() => {
              const isBSD = data.tribe === 'Black Spiral Dancers';
              const gloryLabel = isBSD ? t.lobisomem.bsd_glory : t.lobisomem.glory;
              const honorLabel = isBSD ? t.lobisomem.bsd_honor : t.lobisomem.honor;
              const wisdomLabel = isBSD ? t.lobisomem.bsd_wisdom : t.lobisomem.wisdom;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">{gloryLabel}</span>
                    <DotDisplay value={renown.glory} maxValue={10} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">{honorLabel}</span>
                    <DotDisplay value={renown.honor} maxValue={10} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">{wisdomLabel}</span>
                    <DotDisplay value={renown.wisdom} maxValue={10} />
                  </div>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* XP Log */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            {t.xpLog.title}
            {xpLog.length > 0 && (
              <Badge variant="outline" className="ml-auto font-mono">
                {t.xpLog.totalXp}: {xpLog.reduce((sum, e) => sum + e.amount, 0)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {xpLog.length > 0 ? (
            <div className="space-y-2">
              {xpLog.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs border-green-500/50 text-green-500">
                        +{entry.amount} XP
                      </Badge>
                      <span className="text-muted-foreground font-body text-xs">
                        {t.xpLog.by} {entry.narrator_name}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground font-body mt-1 truncate">{entry.note}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground/60 shrink-0 ml-2">
                    {new Date(entry.created_at).toLocaleDateString(language)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4 text-sm font-body">
              {t.xpLog.noEntries}
            </p>
          )}
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
