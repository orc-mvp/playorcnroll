import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import DotRating from '@/components/character/vampiro/DotRating';
import { MAGO_SPHERES } from '@/lib/mago/spheres';
import { MagoFormData } from './StepMagoBasicInfo';

interface Props {
  formData: MagoFormData;
  updateFormData: (updates: Partial<MagoFormData>) => void;
}

export default function StepMagoSpheres({ formData, updateFormData }: Props) {
  const { t, language } = useI18n();
  const spheres = formData.spheres || {};

  const updateSphere = (key: string, value: number) => {
    updateFormData({ spheres: { ...spheres, [key]: value } });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">{t.mago.spheres}</CardTitle>
          <CardDescription className="font-body">{t.mago.spheresDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {MAGO_SPHERES.map((sphere) => (
                <div key={sphere.key} className="flex items-center justify-between gap-4 pl-2">
                  <span className="font-body text-sm">
                    {language === 'pt-BR' ? sphere.labelPt : sphere.labelEn}
                  </span>
                  <DotRating
                    value={spheres[sphere.key] || 0}
                    onChange={(value) => updateSphere(sphere.key, value)}
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
