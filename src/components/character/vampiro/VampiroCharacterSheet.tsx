// Vampiro Character Sheet with i18n support
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
import {
  User,
  Moon,
  Heart,
  Brain,
  Shield,
  Sparkles,
  Users,
  Flame,
  Star,
  Award,
} from 'lucide-react';
import { toTitleCase } from '@/lib/textUtils';

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
  merits_flaws?: { id: string; name: string; cost: number; category: string }[];
}

interface VampiroCharacterSheetProps {
  character: {
    id: string;
    name: string;
    concept: string | null;
    vampiro_data: VampiroData | null;
  };
  sessionTrackers?: {
    bloodPool?: number;
    willpower?: number;
    healthDamage?: boolean[];
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
                  aria-label={t.vampiroTests.specialization}
                >
                  <Star className="w-3 h-3 fill-current" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{t.vampiroTests.specialization}</p>
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

// Discipline display names (fallback for keys not in i18n)
const DISCIPLINE_DISPLAY: Record<string, { pt: string; en: string }> = {
  animalism: { pt: 'Animalismo', en: 'Animalism' },
  auspex: { pt: 'Auspícios', en: 'Auspex' },
  celerity: { pt: 'Celeridade', en: 'Celerity' },
  chimerstry: { pt: 'Quimerismo', en: 'Chimerstry' },
  dementation: { pt: 'Demência', en: 'Dementation' },
  dominate: { pt: 'Dominação', en: 'Dominate' },
  fortitude: { pt: 'Fortitude', en: 'Fortitude' },
  necromancy: { pt: 'Necromancia', en: 'Necromancy' },
  obfuscate: { pt: 'Ofuscação', en: 'Obfuscate' },
  obtenebration: { pt: 'Obtenebração', en: 'Obtenebration' },
  potence: { pt: 'Potência', en: 'Potence' },
  presence: { pt: 'Presença', en: 'Presence' },
  protean: { pt: 'Proteanismo', en: 'Protean' },
  quietus: { pt: 'Quietus', en: 'Quietus' },
  serpentis: { pt: 'Serpentis', en: 'Serpentis' },
  thaumaturgy: { pt: 'Taumaturgia', en: 'Thaumaturgy' },
  vicissitude: { pt: 'Vicissitude', en: 'Vicissitude' },
  gargoyleFlight: { pt: 'Voo de Gárgula', en: 'Gargoyle Flight' },
  visceratika: { pt: 'Visceratika', en: 'Visceratika' },
  daimoinon: { pt: 'Daimoinon', en: 'Daimoinon' },
  temporis: { pt: 'Temporis', en: 'Temporis' },
  mytherceria: { pt: 'Mytherceria', en: 'Mytherceria' },
  spiritus: { pt: 'Spiritus', en: 'Spiritus' },
  sanguinus: { pt: 'Sanguinus', en: 'Sanguinus' },
  valeren: { pt: 'Valeren', en: 'Valeren' },
  koldunicSorcery: { pt: 'Feitiçaria Koldúnica', en: 'Koldunic Sorcery' },
  nihilistics: { pt: 'Nihilistics', en: 'Nihilistics' },
  obeah: { pt: 'Obeah', en: 'Obeah' },
  melpominee: { pt: 'Melpominee', en: 'Melpominee' },
  thanatosis: { pt: 'Thanatosis', en: 'Thanatosis' },
};

// Background display names
const BACKGROUND_DISPLAY: Record<string, { pt: string; en: string }> = {
  allies: { pt: 'Aliados', en: 'Allies' },
  contacts: { pt: 'Contatos', en: 'Contacts' },
  fame: { pt: 'Fama', en: 'Fame' },
  generation: { pt: 'Geração', en: 'Generation' },
  influence: { pt: 'Influência', en: 'Influence' },
  mentor: { pt: 'Mentor', en: 'Mentor' },
  resources: { pt: 'Recursos', en: 'Resources' },
  retainers: { pt: 'Lacaios', en: 'Retainers' },
  herd: { pt: 'Rebanho', en: 'Herd' },
  status: { pt: 'Status', en: 'Status' },
};

// Health level definitions
const HEALTH_LEVELS = [
  { key: 'bruised', penalty: '' },
  { key: 'hurt', penalty: '-1' },
  { key: 'injured', penalty: '-1' },
  { key: 'wounded', penalty: '-2' },
  { key: 'mauled', penalty: '-2' },
  { key: 'crippled', penalty: '-5' },
  { key: 'incapacitated', penalty: '' },
] as const;

export default function VampiroCharacterSheet({ character, sessionTrackers, experiencePoints, readOnly = false }: VampiroCharacterSheetProps) {
  const { t, language } = useI18n();
  const data = character.vampiro_data || {};
  const lang = language === 'pt-BR' ? 'pt' : 'en';
  
  // Interactive state for trackers - use session values if provided
  const [bloodPool, setBloodPool] = useState(sessionTrackers?.bloodPool ?? 0);
  const [currentWillpower, setCurrentWillpower] = useState(sessionTrackers?.willpower ?? 0);
  const [healthDamage, setHealthDamage] = useState<boolean[]>(sessionTrackers?.healthDamage ?? Array(7).fill(false));
  const [xpLog, setXpLog] = useState<{ id: string; amount: number; narrator_name: string; note: string | null; created_at: string }[]>([]);
  const [expandedMeritFlaw, setExpandedMeritFlaw] = useState<string | null>(null);
  const [meritFlawDescriptions, setMeritFlawDescriptions] = useState<Record<string, { description: string; prerequisites: string | null }>>({});
  const [liveMeritsFlaws, setLiveMeritsFlaws] = useState<{ id: string; name: string; cost: number; category: string }[] | null>(null);

  // Fetch live merits/flaws data from DB to keep category/name/cost up to date
  useEffect(() => {
    const stored = (data as any).merits_flaws || [];
    const ids = stored.map((m: any) => m.id);
    if (ids.length === 0) return;
    supabase
      .from('merits_flaws')
      .select('id, name, cost, category')
      .in('id', ids)
      .then(({ data: fresh }) => {
        if (fresh) setLiveMeritsFlaws(fresh as any);
      });
  }, [(data as any).merits_flaws]);


  // Fetch XP log
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

    // Realtime subscription
    const channel = supabase
      .channel(`xp_log_${character.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'xp_log',
        filter: `character_id=eq.${character.id}`,
      }, () => {
        fetchXpLog();
      })
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
  const virtues = data.virtues || {
    virtueType1: 'conscience',
    virtueValue1: 1,
    virtueType2: 'selfControl',
    virtueValue2: 1,
    courage: 1,
  };
  const disciplines = data.disciplines || {};
  const backgrounds = data.backgrounds || {};
  
  const humanity = data.humanity || 1;
  const willpower = data.willpower || 1;
  const moralityType = data.moralityType || 'humanity';
  const pathName = data.pathName || '';

  // Toggle blood pool point
  const toggleBloodPoint = (index: number) => {
    if (index < bloodPool) {
      setBloodPool(index);
    } else {
      setBloodPool(index + 1);
    }
  };

  // Toggle willpower point
  const toggleWillpowerPoint = (index: number) => {
    if (index < currentWillpower) {
      setCurrentWillpower(index);
    } else {
      setCurrentWillpower(index + 1);
    }
  };

  // Toggle health level damage
  const toggleHealthDamage = (index: number) => {
    const newDamage = [...healthDamage];
    newDamage[index] = !newDamage[index];
    setHealthDamage(newDamage);
  };

  // Get clan name from translations
  const getClanName = (clan: string) => {
    const key = clan as keyof typeof t.vampiro;
    return (t.vampiro[key] as string) || clan;
  };

  // Get virtue name from translations  
  const getVirtueName = (virtue: string) => {
    const key = virtue as keyof typeof t.vampiro;
    return (t.vampiro[key] as string) || virtue;
  };

  // Get discipline name
  const getDisciplineName = (key: string) => {
    return DISCIPLINE_DISPLAY[key]?.[lang] || key;
  };

  // Get background name
  const getBackgroundName = (key: string) => {
    return BACKGROUND_DISPLAY[key]?.[lang] || key;
  };

  // Ability keys for translation
  const ABILITY_KEYS = {
    talents: ['alertness', 'athletics', 'brawl', 'dodge', 'empathy', 'expression', 'intimidation', 'leadership', 'streetwise', 'subterfuge'] as const,
    skills: ['animalKen', 'crafts', 'drive', 'etiquette', 'firearms', 'melee', 'performance', 'security', 'stealth', 'survival'] as const,
    knowledges: ['academics', 'computer', 'finance', 'investigation', 'law', 'linguistics', 'medicine', 'occult', 'politics', 'science'] as const,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Character Header - Complete */}
      <Card className="medieval-card bg-gradient-to-br from-destructive/20 to-background">
        <CardContent className="pt-6">
          {/* Top row: Avatar + Name/Clan + Player/Chronicle */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 border-2 border-destructive/30">
              <Moon className="w-10 h-10 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-medieval text-2xl text-foreground">{character.name}</h2>
                {(experiencePoints ?? 0) > 0 && (
                  <Badge variant="outline" className="font-mono text-xs px-1.5">
                    {experiencePoints} XP
                  </Badge>
                )}
                {data.clan && (
                  <Badge variant="outline" className="border-destructive/30 text-destructive">
                    {getClanName(data.clan)}
                  </Badge>
                )}
              </div>
              {character.concept && (
                <p className="text-muted-foreground font-body mt-1">{character.concept}</p>
              )}
              {/* Player & Chronicle */}
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
          
          {/* Second row: Nature, Demeanor, Generation, Sire */}
          <Separator className="my-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
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
            {data.generation && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">{t.vampiro.generation}</span>
                <span className="font-body text-foreground">{data.generation}</span>
              </div>
            )}
            {data.sire && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">{t.vampiro.sire}</span>
                <span className="font-body text-foreground">{data.sire}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attributes */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            {t.vampiro.attributes}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Physical */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">{t.vampiro.physical}</h4>
              <div className="space-y-1">
                <AttributeRow name={t.vampiro.strength} value={attributes.physical.strength} />
                <AttributeRow name={t.vampiro.dexterity} value={attributes.physical.dexterity} />
                <AttributeRow name={t.vampiro.stamina} value={attributes.physical.stamina} />
              </div>
            </div>
            
            {/* Social */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">{t.vampiro.social}</h4>
              <div className="space-y-1">
                <AttributeRow name={t.vampiro.charisma} value={attributes.social.charisma} />
                <AttributeRow name={t.vampiro.manipulation} value={attributes.social.manipulation} />
                <AttributeRow name={t.vampiro.appearance} value={attributes.social.appearance} />
              </div>
            </div>
            
            {/* Mental */}
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
            <Brain className="w-5 h-5 text-destructive" />
            {t.vampiro.abilities}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Talents */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">
                {t.vampiro.talents}{' '}
                <span className="text-muted-foreground/60">({ABILITY_KEYS.talents.reduce((sum, k) => sum + (abilities.talents[k] || 0), 0)})</span>
              </h4>
              <div className="space-y-1">
                {ABILITY_KEYS.talents.map((key) => (
                  <AbilityRow 
                    key={key} 
                    name={t.vampiro[key]} 
                    value={abilities.talents[key] || 0}
                    specialization={specializations[key]}
                  />
                ))}
              </div>
            </div>
            
            {/* Skills */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">
                {t.vampiro.skills}{' '}
                <span className="text-muted-foreground/60">({ABILITY_KEYS.skills.reduce((sum, k) => sum + (abilities.skills[k] || 0), 0)})</span>
              </h4>
              <div className="space-y-1">
                {ABILITY_KEYS.skills.map((key) => (
                  <AbilityRow 
                    key={key} 
                    name={t.vampiro[key]} 
                    value={abilities.skills[key] || 0}
                    specialization={specializations[key]}
                  />
                ))}
              </div>
            </div>
            
            {/* Knowledges */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">
                {t.vampiro.knowledges}{' '}
                <span className="text-muted-foreground/60">({ABILITY_KEYS.knowledges.reduce((sum, k) => sum + (abilities.knowledges[k] || 0), 0)})</span>
              </h4>
              <div className="space-y-1">
                {ABILITY_KEYS.knowledges.map((key) => (
                  <AbilityRow 
                    key={key} 
                    name={t.vampiro[key]} 
                    value={abilities.knowledges[key] || 0}
                    specialization={specializations[key]}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disciplines & Backgrounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Disciplines */}
        <Card className="medieval-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-medieval flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-destructive" />
              {t.vampiro.disciplines}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(disciplines).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(disciplines).map(([key, value]) => (
                  value > 0 && (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-body">{getDisciplineName(key)}</span>
                      <DotDisplay value={value} />
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm font-body">
                {t.vampiro.noDisciplines}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Backgrounds */}
        <Card className="medieval-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-medieval flex items-center gap-2">
              <Users className="w-5 h-5 text-destructive" />
              {t.vampiro.backgrounds}
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
        const meritsFlaws = liveMeritsFlaws || (data as any).merits_flaws || [];
        if (meritsFlaws.length === 0) return null;
        
        const merits = meritsFlaws.filter((m: any) => m.cost > 0);
        const flaws = meritsFlaws.filter((m: any) => m.cost <= 0);
        const categoryLabel = (cat: string) =>
          (t.meritsFlaws[cat as keyof typeof t.meritsFlaws] as string) || cat;

        // Group by category then sort alphabetically
        const groupAndSort = (items: any[]) => {
          const grouped: Record<string, any[]> = {};
          items.forEach((m) => {
            if (!grouped[m.category]) grouped[m.category] = [];
            grouped[m.category].push(m);
          });
          // Sort categories alphabetically, then items within each category
          return Object.entries(grouped)
            .sort(([a], [b]) => categoryLabel(a).localeCompare(categoryLabel(b)))
            .map(([cat, items]) => ({
              category: cat,
              items: items.sort((a: any, b: any) => a.name.localeCompare(b.name)),
            }));
        };

        const MeritFlawItem = ({ m, isMerit }: { m: any; isMerit: boolean }) => {
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
                    // Fetch description if not cached
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
                    isMerit
                      ? 'border-green-500/50 text-green-500'
                      : 'border-red-500/50 text-red-500'
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
            {/* Merits */}
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
                          {items.map((m: any) => <MeritFlawItem key={m.id} m={m} isMerit={true} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4 text-sm font-body">
                    {t.common.none}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Flaws */}
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
                          {items.map((m: any) => <MeritFlawItem key={m.id} m={m} isMerit={false} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4 text-sm font-body">
                    {t.common.none}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Virtues, Humanity & Willpower */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Heart className="w-5 h-5 text-destructive" />
            {t.vampiro.virtuesAndPath}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Virtues */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-3 text-center">{t.vampiro.virtues}</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body">{getVirtueName(virtues.virtueType1)}</span>
                  <DotDisplay value={virtues.virtueValue1} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body">{getVirtueName(virtues.virtueType2)}</span>
                  <DotDisplay value={virtues.virtueValue2} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body">{t.vampiro.courage}</span>
                  <DotDisplay value={virtues.courage} />
                </div>
              </div>
            </div>
            
            {/* Humanity/Path */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-3 text-center">
                {moralityType === 'humanity' ? t.vampiro.humanity : `${t.vampiro.path}: ${pathName}`}
              </h4>
              <div className="flex justify-center">
                <DotDisplay value={humanity} maxValue={10} />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                {humanity}/10
              </p>
            </div>
            
            {/* Willpower */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-3 text-center">{t.vampiro.willpower}</h4>
              <div className="flex justify-center">
                <DotDisplay value={willpower} maxValue={10} />
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                {willpower}/10
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salvaterios Section */}
      <Card className="medieval-card border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2 text-destructive">
            <Flame className="w-5 h-5" />
            {t.vampiro.salvaterios}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blood Pool - 50 points in rows of 10 */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2">{t.vampiro.bloodPool}</h4>
              <div className="space-y-1">
                {Array.from({ length: 5 }, (_, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1">
                    {Array.from({ length: 10 }, (_, colIndex) => {
                      const index = rowIndex * 10 + colIndex;
                      const isFilled = index < bloodPool;
                      return (
                        <button
                          key={colIndex}
                          type="button"
                          onClick={readOnly ? undefined : () => toggleBloodPoint(index)}
                          disabled={readOnly}
                          className={`w-4 h-4 rounded-sm border transition-colors ${
                            readOnly ? '' : 'cursor-pointer hover:border-destructive'
                          } ${
                            isFilled
                              ? 'bg-destructive border-destructive'
                              : 'border-destructive/40 bg-destructive/10'
                          }`}
                          aria-label={`Blood point ${index + 1}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {bloodPool}/50
              </p>
            </div>

            {/* Willpower (Current) */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2">{t.vampiro.willpowerCurrent}</h4>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: willpower }, (_, i) => {
                  const isFilled = i < currentWillpower;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={readOnly ? undefined : () => toggleWillpowerPoint(i)}
                      disabled={readOnly}
                      className={`w-5 h-5 rounded border-2 transition-colors ${
                        readOnly ? '' : 'cursor-pointer hover:border-foreground'
                      } ${
                        isFilled
                          ? 'bg-foreground border-foreground'
                          : 'border-muted-foreground/40 bg-transparent'
                      }`}
                      aria-label={`Willpower point ${i + 1}`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {currentWillpower}/{willpower}
              </p>
            </div>

            {/* Vitality / Health Levels */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2">{t.vampiro.vitality}</h4>
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

      {/* XP Log */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Award className="w-5 h-5 text-destructive" />
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
    </div>
  );
}
