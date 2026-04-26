import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MAGO_TRADITIONS } from '@/lib/mago/spheres';

export interface MagoFormData {
  // Step 1 - Basic Info
  name: string;
  player: string;
  chronicle: string;
  nature: string;
  demeanor: string;
  tradition: string;
  essence: string;
  cabal: string;
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

  // Step 3 - Spheres
  spheres: Record<string, number>;

  // Step 4 - Rotes
  rotes: Record<number, string[]>;

  // Step 5 - Backgrounds + pools
  backgrounds: Record<string, number>;
  arete: number;
  willpower: number;
  quintessence: number;
  paradox: number;

  // Step 6 - Merits & Flaws
  merits_flaws: { id: string; name: string; cost: number; category: string }[];
}

interface StepMagoBasicInfoProps {
  formData: MagoFormData;
  updateFormData: (updates: Partial<MagoFormData>) => void;
}

const ARCHETYPES = [
  'Arquiteto', 'Autocrata', 'Bombástico', 'Bon Vivant', 'Bravo',
  'Capitalista', 'Celebridade', 'Conformista', 'Criança', 'Competidor',
  'Defensor', 'Diretor', 'Fanático', 'Guru', 'Idealista',
  'Juiz', 'Mártir', 'Masoquista', 'Monstro', 'Pedagogo',
  'Penitente', 'Perfeccionista', 'Rebelde', 'Sádico', 'Sobrevivente',
  'Solitário', 'Tradicionalista', 'Visionário',
];

export default function StepMagoBasicInfo({ formData, updateFormData }: StepMagoBasicInfoProps) {
  const { t, language } = useI18n();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="medieval-card">
        <CardHeader className="text-center">
          <CardTitle className="font-medieval text-2xl">{t.mago.basicInfo}</CardTitle>
          <CardDescription className="font-body">{t.mago.defineIdentity}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Row 1: Nome, Tradição, Essência */}
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
              <Label className="font-medieval text-sm">{t.mago.tradition} *</Label>
              <Select value={formData.tradition} onValueChange={(v) => updateFormData({ tradition: v })}>
                <SelectTrigger className="font-body bg-input border-border">
                  <SelectValue placeholder={t.mago.selectTradition} />
                </SelectTrigger>
                <SelectContent>
                  {MAGO_TRADITIONS.map((trad) => (
                    <SelectItem key={trad} value={trad}>{trad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medieval text-sm">{t.mago.essence}</Label>
              <Select value={formData.essence} onValueChange={(v) => updateFormData({ essence: v })}>
                <SelectTrigger className="font-body bg-input border-border">
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
                  {ARCHETYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
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
                  {ARCHETYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Cabala, Crônica, Conceito */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-medieval text-sm">{t.mago.cabal}</Label>
              <Input
                value={formData.cabal}
                onChange={(e) => updateFormData({ cabal: e.target.value })}
                placeholder={t.mago.cabalPlaceholder}
                className="font-body bg-input border-border"
              />
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

            <div className="space-y-2">
              <Label className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Conceito' : 'Concept'}
              </Label>
              <Input
                value={formData.concept}
                onChange={(e) => updateFormData({ concept: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Ex: Hacker místico...' : 'Ex: Mystic hacker...'}
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
