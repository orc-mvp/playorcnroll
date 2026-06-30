import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import DotRating from '@/components/character/vampiro/DotRating';
import { LobisomemFormData } from './StepLobisomemBasicInfo';

interface StepLobisomemBackgroundsProps {
  formData: LobisomemFormData;
  updateFormData: (updates: Partial<LobisomemFormData>) => void;
  gameSystem?: 'lobisomem_w20' | 'metamorfos_w20' | 'lobisomem_w5';
}

const BACKGROUNDS = [
  { key: 'allies', labelPt: 'Aliados', labelEn: 'Allies' },
  { key: 'ancestors', labelPt: 'Ancestrais', labelEn: 'Ancestors' },
  { key: 'contacts', labelPt: 'Contatos', labelEn: 'Contacts' },
  { key: 'fetish', labelPt: 'Fetiche', labelEn: 'Fetish' },
  { key: 'kinfolk', labelPt: 'Parentes', labelEn: 'Kinfolk' },
  { key: 'mentor', labelPt: 'Mentor', labelEn: 'Mentor' },
  { key: 'numen', labelPt: 'Numen', labelEn: 'Numen' },
  { key: 'prophecy', labelPt: 'Profecia', labelEn: 'Prophecy' },
  { key: 'pureBreed', labelPt: 'Raça Pura', labelEn: 'Pure Breed' },
  { key: 'resources', labelPt: 'Recursos', labelEn: 'Resources' },
  { key: 'rites', labelPt: 'Rituais', labelEn: 'Rites' },
  { key: 'spiritHeritage', labelPt: 'Herança Espiritual', labelEn: 'Spirit Heritage' },
  { key: 'touched', labelPt: 'Tocado', labelEn: 'Touched' },
  { key: 'totemPersonal', labelPt: 'Totem (Pessoal)', labelEn: 'Totem (Personal)' },
];

export default function StepLobisomemBackgrounds({ formData, updateFormData, gameSystem = 'lobisomem_w20' }: StepLobisomemBackgroundsProps) {
  const { t, language } = useI18n();
  const isW5 = gameSystem === 'lobisomem_w5';

  const backgrounds = formData.backgrounds || {};

  const updateBackground = (key: string, value: number) => {
    updateFormData({ backgrounds: { ...backgrounds, [key]: value } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Pools vitais */}
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {isW5
              ? (language === 'pt-BR' ? 'Fúria, Vontade e Harmonia' : 'Rage, Willpower and Harmony')
              : t.lobisomem.gnosisRage}
          </CardTitle>
          <CardDescription className="font-body">
            {isW5
              ? (language === 'pt-BR'
                  ? 'Escalas 5ª Edição — Fúria e Vontade 0–5, Harmonia 0–10 (sugestão inicial: 7)'
                  : 'W5 scales — Rage and Willpower 0–5, Harmony 0–10 (suggested start: 7)')
              : (language === 'pt-BR'
                  ? 'Defina os valores iniciais de Gnose, Fúria e Força de Vontade'
                  : 'Set initial values for Gnosis, Rage and Willpower')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isW5 && (
            <div className="flex items-center justify-between gap-4">
              <span className="font-body text-sm min-w-[140px]">{t.lobisomem.gnosis}</span>
              <DotRating
                value={formData.gnosis}
                onChange={(value) => updateFormData({ gnosis: value })}
                maxValue={10}
                minValue={1}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <span className="font-body text-sm min-w-[140px]">{t.lobisomem.rage}</span>
            <DotRating
              value={Math.min(formData.rage, isW5 ? 5 : 10)}
              onChange={(value) => updateFormData({ rage: value })}
              maxValue={isW5 ? 5 : 10}
              minValue={isW5 ? 0 : 1}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-body text-sm min-w-[140px]">
              {t.lobisomem.willpowerLabel}
            </span>
            <DotRating
              value={Math.min(formData.willpower, 10)}
              onChange={(value) => updateFormData({ willpower: value })}
              maxValue={10}
              minValue={isW5 ? 0 : 1}
            />
          </div>
          {isW5 && (
            <div className="flex items-center justify-between gap-4">
              <span className="font-body text-sm min-w-[140px]">
                {language === 'pt-BR' ? 'Harmonia' : 'Harmony'}
              </span>
              <DotRating
                value={formData.harmony ?? 7}
                onChange={(value) => updateFormData({ harmony: value })}
                maxValue={10}
                minValue={0}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Renown — apenas W20/Metamorfos (W5 substitui por Harmonia) */}
      {!isW5 && (
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {t.lobisomem.renown}
          </CardTitle>
          <CardDescription className="font-body">
            {t.lobisomem.renownDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const isBSD = formData.tribe === 'Black Spiral Dancers';
            const gloryLabel = isBSD ? t.lobisomem.bsd_glory : t.lobisomem.glory;
            const honorLabel = isBSD ? t.lobisomem.bsd_honor : t.lobisomem.honor;
            const wisdomLabel = isBSD ? t.lobisomem.bsd_wisdom : t.lobisomem.wisdom;
            return (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-body text-sm min-w-[140px]">{gloryLabel}</span>
                  <DotRating
                    value={formData.renown?.glory || 0}
                    onChange={(value) => updateFormData({ renown: { ...(formData.renown || { glory: 0, honor: 0, wisdom: 0 }), glory: value } })}
                    maxValue={10}
                    minValue={0}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-body text-sm min-w-[140px]">{honorLabel}</span>
                  <DotRating
                    value={formData.renown?.honor || 0}
                    onChange={(value) => updateFormData({ renown: { ...(formData.renown || { glory: 0, honor: 0, wisdom: 0 }), honor: value } })}
                    maxValue={10}
                    minValue={0}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-body text-sm min-w-[140px]">{wisdomLabel}</span>
                  <DotRating
                    value={formData.renown?.wisdom || 0}
                    onChange={(value) => updateFormData({ renown: { ...(formData.renown || { glory: 0, honor: 0, wisdom: 0 }), wisdom: value } })}
                    maxValue={10}
                    minValue={0}
                  />
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>
      )}

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
                    maxValue={10}
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
