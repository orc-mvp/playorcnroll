import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Moon,
  Heart,
  Brain,
  Shield,
  Sparkles,
  Users,
  Flame,
} from 'lucide-react';
import DotRating from './DotRating';

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

interface VampiroCharacterSheetProps {
  character: {
    id: string;
    name: string;
    concept: string | null;
    vampiro_data: VampiroData | null;
  };
}

const CLAN_NAMES: Record<string, string> = {
  brujah: 'Brujah',
  gangrel: 'Gangrel',
  malkavian: 'Malkaviano',
  nosferatu: 'Nosferatu',
  toreador: 'Toreador',
  tremere: 'Tremere',
  ventrue: 'Ventrue',
  lasombra: 'Lasombra',
  tzimisce: 'Tzimisce',
  assamite: 'Assamita',
  followerOfSet: 'Seguidores de Set',
  giovanniGiovanni: 'Giovanni',
  ravnos: 'Ravnos',
  caitiff: 'Caitiff',
};

const VIRTUE_NAMES: Record<string, string> = {
  conscience: 'Consciência',
  conviction: 'Convicção',
  selfControl: 'Autocontrole',
  instinct: 'Instinto',
  courage: 'Coragem',
};

const BACKGROUND_NAMES: Record<string, string> = {
  allies: 'Aliados',
  contacts: 'Contatos',
  fame: 'Fama',
  generation: 'Geração',
  influence: 'Influência',
  mentor: 'Mentor',
  resources: 'Recursos',
  retainers: 'Lacaios',
  herd: 'Rebanho',
  status: 'Status',
};

const DISCIPLINE_NAMES: Record<string, string> = {
  animalismo: 'Animalismo',
  auspicio: 'Auspício',
  celeridade: 'Celeridade',
  dominacao: 'Dominação',
  fortitude: 'Fortitude',
  ofuscacao: 'Ofuscação',
  potencia: 'Potência',
  presenca: 'Presença',
  proteanismo: 'Proteanismo',
  taumaturgia: 'Taumaturgia',
  vicissitude: 'Vicissitude',
  demencia: 'Demência',
  quimerismo: 'Quimerismo',
  quietus: 'Quietus',
  serpentis: 'Serpentis',
  obtenebração: 'Obtenebração',
  necromancia: 'Necromancia',
};

const ABILITY_NAMES: Record<string, Record<string, string>> = {
  talents: {
    alertness: 'Prontidão',
    athletics: 'Esportes',
    awareness: 'Percepção',
    brawl: 'Briga',
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
    larceny: 'Furto',
    melee: 'Armas Brancas',
    performance: 'Performance',
    stealth: 'Furtividade',
    survival: 'Sobrevivência',
  },
  knowledges: {
    academics: 'Acadêmicos',
    computer: 'Computador',
    finance: 'Finanças',
    investigation: 'Investigação',
    law: 'Direito',
    medicine: 'Medicina',
    occult: 'Ocultismo',
    politics: 'Política',
    science: 'Ciência',
    technology: 'Tecnologia',
  },
};

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
  return (
    <div className="flex items-center justify-between py-0.5">
      <div className="flex items-center gap-1">
        <span className="text-sm font-body">{name}</span>
        {specialization && (
          <span className="text-xs text-muted-foreground italic">({specialization})</span>
        )}
      </div>
      <DotDisplay value={value} />
    </div>
  );
}

export default function VampiroCharacterSheet({ character }: VampiroCharacterSheetProps) {
  const { language } = useI18n();
  const data = character.vampiro_data || {};
  
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

  return (
    <div className="space-y-6 pb-8">
      {/* Character Header - Complete */}
      <Card className="medieval-card bg-gradient-to-br from-red-950/20 to-background">
        <CardContent className="pt-6">
          {/* Top row: Avatar + Name/Clan + Player/Chronicle */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 border-2 border-red-500/30">
              <Moon className="w-10 h-10 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-medieval text-2xl text-foreground">{character.name}</h2>
                {data.clan && (
                  <Badge variant="outline" className="border-red-500/30 text-red-400">
                    {CLAN_NAMES[data.clan] || data.clan}
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
                    <span className="text-muted-foreground/60 text-xs">Crônica:</span>
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
                <span className="text-xs text-muted-foreground/60 block">Natureza</span>
                <span className="font-body text-foreground">{data.nature}</span>
              </div>
            )}
            {data.demeanor && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">Comportamento</span>
                <span className="font-body text-foreground">{data.demeanor}</span>
              </div>
            )}
            {data.generation && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">Geração</span>
                <span className="font-body text-foreground">{data.generation}ª</span>
              </div>
            )}
            {data.sire && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground/60 block">Senhor</span>
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
            <Shield className="w-5 h-5 text-red-500" />
            Atributos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Physical */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">Físicos</h4>
              <div className="space-y-1">
                <AttributeRow name="Força" value={attributes.physical.strength} />
                <AttributeRow name="Destreza" value={attributes.physical.dexterity} />
                <AttributeRow name="Vigor" value={attributes.physical.stamina} />
              </div>
            </div>
            
            {/* Social */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">Sociais</h4>
              <div className="space-y-1">
                <AttributeRow name="Carisma" value={attributes.social.charisma} />
                <AttributeRow name="Manipulação" value={attributes.social.manipulation} />
                <AttributeRow name="Aparência" value={attributes.social.appearance} />
              </div>
            </div>
            
            {/* Mental */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">Mentais</h4>
              <div className="space-y-1">
                <AttributeRow name="Percepção" value={attributes.mental.perception} />
                <AttributeRow name="Inteligência" value={attributes.mental.intelligence} />
                <AttributeRow name="Raciocínio" value={attributes.mental.wits} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abilities */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Brain className="w-5 h-5 text-red-500" />
            Habilidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Talents */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">Talentos</h4>
              <div className="space-y-1">
                {Object.entries(ABILITY_NAMES.talents).map(([key, name]) => (
                  <AbilityRow 
                    key={key} 
                    name={name} 
                    value={abilities.talents[key] || 0}
                    specialization={specializations[key]}
                  />
                ))}
              </div>
            </div>
            
            {/* Skills */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">Perícias</h4>
              <div className="space-y-1">
                {Object.entries(ABILITY_NAMES.skills).map(([key, name]) => (
                  <AbilityRow 
                    key={key} 
                    name={name} 
                    value={abilities.skills[key] || 0}
                    specialization={specializations[key]}
                  />
                ))}
              </div>
            </div>
            
            {/* Knowledges */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2 text-center">Conhecimentos</h4>
              <div className="space-y-1">
                {Object.entries(ABILITY_NAMES.knowledges).map(([key, name]) => (
                  <AbilityRow 
                    key={key} 
                    name={name} 
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
              <Sparkles className="w-5 h-5 text-red-500" />
              Disciplinas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(disciplines).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(disciplines).map(([key, value]) => (
                  value > 0 && (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-body">{DISCIPLINE_NAMES[key] || key}</span>
                      <DotDisplay value={value} />
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm font-body">
                Nenhuma disciplina
              </p>
            )}
          </CardContent>
        </Card>

        {/* Backgrounds */}
        <Card className="medieval-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-medieval flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" />
              Antecedentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(backgrounds).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(backgrounds).map(([key, value]) => (
                  value > 0 && (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-body">{BACKGROUND_NAMES[key] || key}</span>
                      <DotDisplay value={value} />
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm font-body">
                Nenhum antecedente
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Virtues, Humanity & Willpower */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Virtudes & Trilha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Virtues */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-3 text-center">Virtudes</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body">{VIRTUE_NAMES[virtues.virtueType1] || virtues.virtueType1}</span>
                  <DotDisplay value={virtues.virtueValue1} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body">{VIRTUE_NAMES[virtues.virtueType2] || virtues.virtueType2}</span>
                  <DotDisplay value={virtues.virtueValue2} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body">Coragem</span>
                  <DotDisplay value={virtues.courage} />
                </div>
              </div>
            </div>
            
            {/* Humanity/Path */}
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-3 text-center">
                {moralityType === 'humanity' ? 'Humanidade' : `Trilha: ${pathName}`}
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
              <h4 className="font-medieval text-sm text-muted-foreground mb-3 text-center">Força de Vontade</h4>
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

      {/* Blood Pool placeholder */}
      <Card className="medieval-card border-red-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval flex items-center gap-2 text-red-500">
            <Flame className="w-5 h-5" />
            Vitalidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2">Pontos de Sangue</h4>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-sm border border-red-500/40 bg-red-500/10"
                  />
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medieval text-sm text-muted-foreground mb-2">Níveis de Vitalidade</h4>
              <div className="space-y-1 text-sm font-body">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-muted-foreground/40" />
                  <span>Escoriado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-muted-foreground/40" />
                  <span>Machucado (-1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-muted-foreground/40" />
                  <span>Ferido (-1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-muted-foreground/40" />
                  <span>Ferido Gravemente (-2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-muted-foreground/40" />
                  <span>Espancado (-2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-muted-foreground/40" />
                  <span>Aleijado (-5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-muted-foreground/40" />
                  <span>Incapacitado</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
