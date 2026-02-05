import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface VampiroFormData {
  // Step 1 - Basic Info
  name: string;
  player: string;
  chronicle: string;
  nature: string;
  demeanor: string;
  clan: string;
  generation: string;
  sire: string;
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
}

interface StepVampiroBasicInfoProps {
  formData: VampiroFormData;
  updateFormData: (updates: Partial<VampiroFormData>) => void;
}

const CLANS = [
  'Brujah',
  'Gangrel',
  'Malkavian',
  'Nosferatu',
  'Toreador',
  'Tremere',
  'Ventrue',
  'Caitiff',
  'Assamita',
  'Lasombra',
  'Tzimisce',
  'Giovanni',
  'Ravnos',
  'Setita',
];

const ARCHETYPES = [
  'Arquiteto',
  'Autocrata',
  'Bombástico',
  'Bon Vivant',
  'Bravo',
  'Capitalista',
  'Celebridade',
  'Conformista',
  'Criança',
  'Competidor',
  'Defensor',
  'Diretor',
  'Fanático',
  'Guru',
  'Idealista',
  'Juiz',
  'Mártir',
  'Masoquista',
  'Monstro',
  'Pedagogo',
  'Penitente',
  'Perfeccionista',
  'Rebelde',
  'Sádico',
  'Sobrevivente',
  'Solitário',
  'Tradicionalista',
  'Visionário',
];

const GENERATIONS = [
  '8ª Geração',
  '9ª Geração',
  '10ª Geração',
  '11ª Geração',
  '12ª Geração',
  '13ª Geração',
];

export default function StepVampiroBasicInfo({ formData, updateFormData }: StepVampiroBasicInfoProps) {
  const { language } = useI18n();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="medieval-card">
        <CardHeader className="text-center">
          <CardTitle className="font-medieval text-2xl">
            {language === 'pt-BR' ? 'Informações Básicas' : 'Basic Information'}
          </CardTitle>
          <CardDescription className="font-body">
            {language === 'pt-BR'
              ? 'Defina a identidade do seu vampiro'
              : 'Define your vampire\'s identity'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Row 1: Nome, Natureza, Geração */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Nome' : 'Name'} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Nome do personagem' : 'Character name'}
                className="font-body bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nature" className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Natureza' : 'Nature'}
              </Label>
              <Select
                value={formData.nature}
                onValueChange={(value) => updateFormData({ nature: value })}
              >
                <SelectTrigger className="font-body bg-input border-border">
                  <SelectValue placeholder={language === 'pt-BR' ? 'Selecione...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  {ARCHETYPES.map((archetype) => (
                    <SelectItem key={archetype} value={archetype}>
                      {archetype}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="generation" className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Geração' : 'Generation'}
              </Label>
              <Select
                value={formData.generation}
                onValueChange={(value) => updateFormData({ generation: value })}
              >
                <SelectTrigger className="font-body bg-input border-border">
                  <SelectValue placeholder={language === 'pt-BR' ? 'Selecione...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  {GENERATIONS.map((gen) => (
                    <SelectItem key={gen} value={gen}>
                      {gen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Jogador, Comportamento, Senhor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="player" className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Jogador' : 'Player'}
              </Label>
              <Input
                id="player"
                value={formData.player}
                onChange={(e) => updateFormData({ player: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Seu nome' : 'Your name'}
                className="font-body bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="demeanor" className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Comportamento' : 'Demeanor'}
              </Label>
              <Select
                value={formData.demeanor}
                onValueChange={(value) => updateFormData({ demeanor: value })}
              >
                <SelectTrigger className="font-body bg-input border-border">
                  <SelectValue placeholder={language === 'pt-BR' ? 'Selecione...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  {ARCHETYPES.map((archetype) => (
                    <SelectItem key={archetype} value={archetype}>
                      {archetype}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sire" className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Senhor' : 'Sire'}
              </Label>
              <Input
                id="sire"
                value={formData.sire}
                onChange={(e) => updateFormData({ sire: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Nome do senhor' : 'Sire name'}
                className="font-body bg-input border-border"
              />
            </div>
          </div>

          {/* Row 3: Crônica, Clã, Conceito */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chronicle" className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Crônica' : 'Chronicle'}
              </Label>
              <Input
                id="chronicle"
                value={formData.chronicle}
                onChange={(e) => updateFormData({ chronicle: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Nome da crônica' : 'Chronicle name'}
                className="font-body bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clan" className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Clã' : 'Clan'} *
              </Label>
              <Select
                value={formData.clan}
                onValueChange={(value) => updateFormData({ clan: value })}
              >
                <SelectTrigger className="font-body bg-input border-border">
                  <SelectValue placeholder={language === 'pt-BR' ? 'Selecione...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  {CLANS.map((clan) => (
                    <SelectItem key={clan} value={clan}>
                      {clan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept" className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Conceito' : 'Concept'}
              </Label>
              <Input
                id="concept"
                value={formData.concept}
                onChange={(e) => updateFormData({ concept: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Ex: Detetive, Artista...' : 'Ex: Detective, Artist...'}
                className="font-body bg-input border-border"
              />
            </div>
          </div>

          {/* Required fields note */}
          <p className="text-xs text-muted-foreground font-body text-center pt-2">
            * {language === 'pt-BR' ? 'Campos obrigatórios' : 'Required fields'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
