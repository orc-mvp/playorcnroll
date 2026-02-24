import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import DotRating from '@/components/character/vampiro/DotRating';
import { LobisomemFormData } from './StepLobisomemBasicInfo';

interface StepLobisomemBackgroundsProps {
  formData: LobisomemFormData;
  updateFormData: (updates: Partial<LobisomemFormData>) => void;
}

const BACKGROUNDS = [
  { key: 'allies', labelPt: 'Aliados', labelEn: 'Allies' },
  { key: 'ancestors', labelPt: 'Ancestrais', labelEn: 'Ancestors' },
  { key: 'contacts', labelPt: 'Contatos', labelEn: 'Contacts' },
  { key: 'fetish', labelPt: 'Fetiche', labelEn: 'Fetish' },
  { key: 'kinfolk', labelPt: 'Parentes', labelEn: 'Kinfolk' },
  { key: 'mentor', labelPt: 'Mentor', labelEn: 'Mentor' },
  { key: 'pureBreed', labelPt: 'Raça Pura', labelEn: 'Pure Breed' },
  { key: 'resources', labelPt: 'Recursos', labelEn: 'Resources' },
  { key: 'rites', labelPt: 'Rituais', labelEn: 'Rites' },
  { key: 'spiritHeritage', labelPt: 'Herança Espiritual', labelEn: 'Spirit Heritage' },
  { key: 'totemPersonal', labelPt: 'Totem (Pessoal)', labelEn: 'Totem (Personal)' },
];

export default function StepLobisomemBackgrounds({ formData, updateFormData }: StepLobisomemBackgroundsProps) {
  const { t, language } = useI18n();

  const backgrounds = formData.backgrounds || {};

  const updateBackground = (key: string, value: number) => {
    updateFormData({ backgrounds: { ...backgrounds, [key]: value } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Gnosis, Rage, Willpower */}
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {t.lobisomem.gnosisRage}
          </CardTitle>
          <CardDescription className="font-body">
            {language === 'pt-BR'
              ? 'Defina os valores iniciais de Gnose, Fúria e Força de Vontade'
              : 'Set initial values for Gnosis, Rage and Willpower'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-body text-sm min-w-[140px]">{t.lobisomem.gnosis}</span>
            <DotRating
              value={formData.gnosis}
              onChange={(value) => updateFormData({ gnosis: value })}
              maxValue={10}
              minValue={1}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-body text-sm min-w-[140px]">{t.lobisomem.rage}</span>
            <DotRating
              value={formData.rage}
              onChange={(value) => updateFormData({ rage: value })}
              maxValue={10}
              minValue={1}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-body text-sm min-w-[140px]">
              {language === 'pt-BR' ? 'Força de Vontade' : 'Willpower'}
            </span>
            <DotRating
              value={formData.willpower}
              onChange={(value) => updateFormData({ willpower: value })}
              maxValue={10}
              minValue={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backgrounds */}
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {language === 'pt-BR' ? 'Antecedentes' : 'Backgrounds'}
          </CardTitle>
          <CardDescription className="font-body">
            {language === 'pt-BR'
              ? 'Recursos, conexões e vantagens do seu Garou'
              : 'Resources, connections and advantages of your Garou'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-2">
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
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
