import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DotRating from './DotRating';
import { VampiroFormData } from './StepVampiroBasicInfo';

interface StepVampiroDisciplinesProps {
  formData: VampiroFormData;
  updateFormData: (updates: Partial<VampiroFormData>) => void;
}

// Clan disciplines mapping
const CLAN_DISCIPLINES: Record<string, string[]> = {
  'Brujah': ['Celeridade', 'Potência', 'Presença'],
  'Gangrel': ['Animalismo', 'Fortitude', 'Metamorfose'],
  'Malkavian': ['Auspícios', 'Demência', 'Ofuscação'],
  'Nosferatu': ['Animalismo', 'Ofuscação', 'Potência'],
  'Toreador': ['Auspícios', 'Celeridade', 'Presença'],
  'Tremere': ['Auspícios', 'Dominação', 'Taumaturgia'],
  'Ventrue': ['Dominação', 'Fortitude', 'Presença'],
  'Caitiff': ['Animalismo', 'Auspícios', 'Celeridade', 'Demência', 'Dominação', 'Fortitude', 'Metamorfose', 'Ofuscação', 'Potência', 'Presença'],
  'Assamita': ['Celeridade', 'Ofuscação', 'Quietus'],
  'Lasombra': ['Dominação', 'Obtenebração', 'Potência'],
  'Tzimisce': ['Animalismo', 'Auspícios', 'Vicissitude'],
  'Giovanni': ['Dominação', 'Necromancia', 'Potência'],
  'Ravnos': ['Animalismo', 'Fortitude', 'Quimerismo'],
  'Setita': ['Ofuscação', 'Presença', 'Serpentis'],
};

const BACKGROUNDS = [
  { key: 'allies', labelPt: 'Aliados', labelEn: 'Allies' },
  { key: 'contacts', labelPt: 'Contatos', labelEn: 'Contacts' },
  { key: 'fame', labelPt: 'Fama', labelEn: 'Fame' },
  { key: 'generation', labelPt: 'Geração', labelEn: 'Generation' },
  { key: 'influence', labelPt: 'Influência', labelEn: 'Influence' },
  { key: 'mentor', labelPt: 'Mentor', labelEn: 'Mentor' },
  { key: 'resources', labelPt: 'Recursos', labelEn: 'Resources' },
  { key: 'retainers', labelPt: 'Lacaios', labelEn: 'Retainers' },
  { key: 'herd', labelPt: 'Rebanho', labelEn: 'Herd' },
  { key: 'status', labelPt: 'Status', labelEn: 'Status' },
];

export default function StepVampiroDisciplines({ formData, updateFormData }: StepVampiroDisciplinesProps) {
  const { language } = useI18n();

  // Defensive defaults
  const disciplines = formData.disciplines || {};
  const backgrounds = formData.backgrounds || {};

  // Get clan disciplines
  const clanDisciplines = CLAN_DISCIPLINES[formData.clan] || [];

  const updateDiscipline = (discipline: string, value: number) => {
    updateFormData({
      disciplines: {
        ...disciplines,
        [discipline]: value,
      },
    });
  };

  const updateBackground = (background: string, value: number) => {
    updateFormData({
      backgrounds: {
        ...backgrounds,
        [background]: value,
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Disciplines Card */}
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {language === 'pt-BR' ? 'Disciplinas' : 'Disciplines'}
          </CardTitle>
          <CardDescription className="font-body">
            {language === 'pt-BR'
              ? `Disciplinas do clã ${formData.clan || 'selecionado'}`
              : `Disciplines of the ${formData.clan || 'selected'} clan`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {clanDisciplines.length > 0 ? (
            clanDisciplines.map((discipline) => (
              <div key={discipline} className="flex items-center justify-between gap-4">
                <span className="font-body text-sm">{discipline}</span>
                <DotRating
                  value={disciplines[discipline] || 0}
                  onChange={(value) => updateDiscipline(discipline, value)}
                  maxValue={5}
                  minValue={0}
                />
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              {language === 'pt-BR'
                ? 'Selecione um clã na etapa 1 para ver as disciplinas disponíveis'
                : 'Select a clan in step 1 to see available disciplines'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Backgrounds Card */}
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {language === 'pt-BR' ? 'Antecedentes' : 'Backgrounds'}
          </CardTitle>
          <CardDescription className="font-body">
            {language === 'pt-BR'
              ? 'Recursos, conexões e vantagens do seu vampiro'
              : 'Resources, connections and advantages of your vampire'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {BACKGROUNDS.map((bg) => (
            <div key={bg.key} className="flex items-center justify-between gap-4">
              <span className="font-body text-sm">
                {language === 'pt-BR' ? bg.labelPt : bg.labelEn}
              </span>
              <DotRating
                value={backgrounds[bg.key] || 0}
                onChange={(value) => updateBackground(bg.key, value)}
                maxValue={5}
                minValue={0}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
