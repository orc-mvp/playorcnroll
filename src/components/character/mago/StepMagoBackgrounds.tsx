import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import DotRating from '@/components/character/vampiro/DotRating';
import { MAGO_BACKGROUNDS } from '@/lib/mago/spheres';
import { MagoFormData } from './StepMagoBasicInfo';

interface Props {
  formData: MagoFormData;
  updateFormData: (updates: Partial<MagoFormData>) => void;
}

function NumberStepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-7 w-7"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="font-medieval text-sm min-w-[2ch] text-center">{value}</span>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-7 w-7"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default function StepMagoBackgrounds({ formData, updateFormData }: Props) {
  const { t, language } = useI18n();
  const backgrounds = formData.backgrounds || {};

  const updateBackground = (key: string, value: number) => {
    updateFormData({ backgrounds: { ...backgrounds, [key]: value } });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Pools: Arête, Vontade, Quintessência, Paradoxo */}
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">{t.mago.pools}</CardTitle>
          <CardDescription className="font-body">{t.mago.poolsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-body text-sm min-w-[140px]">{t.mago.arete}</span>
            <DotRating
              value={formData.arete || 1}
              onChange={(value) => updateFormData({ arete: value })}
              maxValue={10}
              minValue={1}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-body text-sm min-w-[140px]">{t.mago.willpowerLabel}</span>
            <DotRating
              value={formData.willpower || 1}
              onChange={(value) => updateFormData({ willpower: value })}
              maxValue={10}
              minValue={1}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-body text-sm min-w-[140px]">{t.mago.quintessence}</span>
            <NumberStepper
              value={formData.quintessence || 0}
              onChange={(value) => updateFormData({ quintessence: value })}
              min={0}
              max={20}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-body text-sm min-w-[140px]">{t.mago.paradox}</span>
            <NumberStepper
              value={formData.paradox || 0}
              onChange={(value) => updateFormData({ paradox: value })}
              min={0}
              max={20}
            />
          </div>
          <p className="text-xs text-muted-foreground font-body text-center pt-2">
            {language === 'pt-BR'
              ? 'Quintessência e Paradoxo: 0 a 20.'
              : 'Quintessence and Paradox: 0 to 20.'}
          </p>
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
              ? 'Recursos, conexões e vantagens do seu Mago'
              : 'Resources, connections and advantages of your Mage'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-2">
              {MAGO_BACKGROUNDS.map((bg) => (
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
