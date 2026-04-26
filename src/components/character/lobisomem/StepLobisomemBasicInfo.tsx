import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TRIBES, AUSPICES, BREEDS, RANKS } from '@/lib/lobisomem/tribes';

export interface LobisomemFormData {
  // Step 1 - Basic Info
  name: string;
  player: string;
  chronicle: string;
  nature: string;
  demeanor: string;
  tribe: string;
  auspice: string;
  rank: string;
  breed: string;
  pack: string;
  totem: string;
  concept: string;

  // Step 2 - Attributes & Abilities
  attributes: {
    physical: { strength: number; dexterity: number; stamina: number };
    social: { charisma: number; manipulation: number; appearance: number };
    mental: { perception: number; intelligence: number; wits: number };
  };
  abilities: {
    talents: Record<string, number>;
    skills: Record<string, number>;
    knowledges: Record<string, number>;
  };
  specializations: Record<string, string>;

  // Step 3 - Gifts
  gifts: Record<number, string[]>;

  // Step 4 - Backgrounds, Gnosis, Rage, Willpower, Renown
  backgrounds: Record<string, number>;
  gnosis: number;
  rage: number;
  willpower: number;
  renown: { glory: number; honor: number; wisdom: number };

  // Step 5 - Merits & Flaws
  merits_flaws: { id: string; name: string; cost: number; category: string }[];
}

interface StepLobisomemBasicInfoProps {
  formData: LobisomemFormData;
  updateFormData: (updates: Partial<LobisomemFormData>) => void;
  gameSystem?: 'lobisomem_w20' | 'metamorfos_w20';
}

const SHIFTERS = [
  'Ajaba',
  'Ananasi',
  'Bastet',
  'Corax',
  'Gurahl',
  'Kitsune',
  'Mokolé',
  'Nagah',
  'Nuwisha',
  'Ratkin',
  'Rokea',
  'Apis',
  'Camazotz',
  'Grondr',
];

const ARCHETYPES = [
  'Arquiteto', 'Autocrata', 'Bombástico', 'Bon Vivant', 'Bravo',
  'Capitalista', 'Celebridade', 'Conformista', 'Criança', 'Competidor',
  'Defensor', 'Diretor', 'Fanático', 'Guru', 'Idealista',
  'Juiz', 'Mártir', 'Masoquista', 'Monstro', 'Pedagogo',
  'Penitente', 'Perfeccionista', 'Rebelde', 'Sádico', 'Sobrevivente',
  'Solitário', 'Tradicionalista', 'Visionário',
];

// Map tribe names to i18n keys
const TRIBE_I18N_MAP: Record<string, string> = {
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

const AUSPICE_I18N_MAP: Record<string, string> = {
  'Ragabash': 'auspice_ragabash',
  'Theurge': 'auspice_theurge',
  'Philodox': 'auspice_philodox',
  'Galliard': 'auspice_galliard',
  'Ahroun': 'auspice_ahroun',
};

const BREED_I18N_MAP: Record<string, string> = {
  'Homid': 'breed_homid',
  'Metis': 'breed_metis',
  'Lupus': 'breed_lupus',
};

const RANK_I18N_MAP: Record<string, string> = {
  'Cliath': 'rank_cliath',
  'Fostern': 'rank_fostern',
  'Adren': 'rank_adren',
  'Athro': 'rank_athro',
  'Elder': 'rank_elder',
};

export default function StepLobisomemBasicInfo({ formData, updateFormData, gameSystem = 'lobisomem_w20' }: StepLobisomemBasicInfoProps) {
  const { t, language } = useI18n();
  const isShifter = gameSystem === 'metamorfos_w20';

  const getLabel = (map: Record<string, string>, key: string) => {
    const i18nKey = map[key];
    if (i18nKey && t.lobisomem[i18nKey as keyof typeof t.lobisomem]) {
      return t.lobisomem[i18nKey as keyof typeof t.lobisomem] as string;
    }
    return key;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="medieval-card">
        <CardHeader className="text-center">
          <CardTitle className="font-medieval text-2xl">
            {t.lobisomem.basicInfo}
          </CardTitle>
          <CardDescription className="font-body">
            {t.lobisomem.defineIdentity}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Row 1: Nome, Tribo, Augúrio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Nome' : 'Name'} *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Nome do personagem' : 'Character name'}
                className="font-body bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medieval text-sm">
                {t.lobisomem.tribe} *
              </Label>
              <Select value={formData.tribe} onValueChange={(v) => updateFormData({ tribe: v })}>
                <SelectTrigger className="font-body bg-input border-border">
                  <SelectValue placeholder={t.lobisomem.selectTribe} />
                </SelectTrigger>
                <SelectContent>
                  {TRIBES.map((tribe) => (
                    <SelectItem key={tribe} value={tribe}>
                      {getLabel(TRIBE_I18N_MAP, tribe)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medieval text-sm">
                {t.lobisomem.auspice} *
              </Label>
              <Select value={formData.auspice} onValueChange={(v) => updateFormData({ auspice: v })}>
                <SelectTrigger className="font-body bg-input border-border">
                  <SelectValue placeholder={t.lobisomem.selectAuspice} />
                </SelectTrigger>
                <SelectContent>
                  {AUSPICES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {getLabel(AUSPICE_I18N_MAP, a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Jogador, Natureza, Comportamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Jogador' : 'Player'}
              </Label>
              <Input
                value={formData.player}
                onChange={(e) => updateFormData({ player: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Seu nome' : 'Your name'}
                className="font-body bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Natureza' : 'Nature'}
              </Label>
              <Select value={formData.nature} onValueChange={(v) => updateFormData({ nature: v })}>
                <SelectTrigger className="font-body bg-input border-border">
                  <SelectValue placeholder={language === 'pt-BR' ? 'Selecione...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  {ARCHETYPES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Comportamento' : 'Demeanor'}
              </Label>
              <Select value={formData.demeanor} onValueChange={(v) => updateFormData({ demeanor: v })}>
                <SelectTrigger className="font-body bg-input border-border">
                  <SelectValue placeholder={language === 'pt-BR' ? 'Selecione...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  {ARCHETYPES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Raça, Posto, Crônica */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-medieval text-sm">
                {t.lobisomem.breed}
              </Label>
              <Select value={formData.breed} onValueChange={(v) => updateFormData({ breed: v })}>
                <SelectTrigger className="font-body bg-input border-border">
                  <SelectValue placeholder={t.lobisomem.selectBreed} />
                </SelectTrigger>
                <SelectContent>
                  {BREEDS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {getLabel(BREED_I18N_MAP, b)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medieval text-sm">
                {t.lobisomem.rank}
              </Label>
              <Select value={formData.rank} onValueChange={(v) => updateFormData({ rank: v })}>
                <SelectTrigger className="font-body bg-input border-border">
                  <SelectValue placeholder={t.lobisomem.selectRank} />
                </SelectTrigger>
                <SelectContent>
                  {RANKS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {getLabel(RANK_I18N_MAP, r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Crônica' : 'Chronicle'}
              </Label>
              <Input
                value={formData.chronicle}
                onChange={(e) => updateFormData({ chronicle: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Nome da crônica' : 'Chronicle name'}
                className="font-body bg-input border-border"
              />
            </div>
          </div>

          {/* Row 4: Matilha, Totem, Conceito */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-medieval text-sm">{t.lobisomem.pack}</Label>
              <Input
                value={formData.pack}
                onChange={(e) => updateFormData({ pack: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Nome da matilha' : 'Pack name'}
                className="font-body bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medieval text-sm">{t.lobisomem.totem}</Label>
              <Input
                value={formData.totem}
                onChange={(e) => updateFormData({ totem: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Totem da matilha' : 'Pack totem'}
                className="font-body bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Conceito' : 'Concept'}
              </Label>
              <Input
                value={formData.concept}
                onChange={(e) => updateFormData({ concept: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Ex: Guerreiro, Xamã...' : 'Ex: Warrior, Shaman...'}
                className="font-body bg-input border-border"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground font-body text-center pt-2">
            * {language === 'pt-BR' ? 'Campos obrigatórios' : 'Required fields'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
