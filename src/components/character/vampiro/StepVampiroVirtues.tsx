import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import DotRating from './DotRating';
import { VampiroFormData } from './StepVampiroBasicInfo';

interface StepVampiroVirtuesProps {
  formData: VampiroFormData;
  updateFormData: (updates: Partial<VampiroFormData>) => void;
}

const defaultVirtues = {
  virtueType1: 'conscience' as const,
  virtueValue1: 1,
  virtueType2: 'selfControl' as const,
  virtueValue2: 1,
  courage: 1,
};

export default function StepVampiroVirtues({ formData, updateFormData }: StepVampiroVirtuesProps) {
  const { language } = useI18n();
  
  // Defensive defaults for virtues
  const virtues = formData.virtues || defaultVirtues;
  const humanity = formData.humanity ?? 2;
  const willpower = formData.willpower ?? 1;
  const moralityType = formData.moralityType ?? 'humanity';
  const pathName = formData.pathName ?? '';

  // Auto-calculate humanity when virtues change
  useEffect(() => {
    const newHumanity = virtues.virtueValue1 + virtues.virtueValue2;
    if (humanity !== newHumanity) {
      updateFormData({ humanity: newHumanity });
    }
  }, [virtues.virtueValue1, virtues.virtueValue2]);

  // Auto-calculate willpower when courage changes
  useEffect(() => {
    if (willpower !== virtues.courage) {
      updateFormData({ willpower: virtues.courage });
    }
  }, [virtues.courage]);

  const updateVirtue = (key: keyof VampiroFormData['virtues'], value: string | number) => {
    updateFormData({
      virtues: {
        ...virtues,
        [key]: value,
      },
    });
  };

  const virtue1Label = virtues.virtueType1 === 'conscience'
    ? (language === 'pt-BR' ? 'Consciência' : 'Conscience')
    : (language === 'pt-BR' ? 'Convicção' : 'Conviction');

  const virtue2Label = virtues.virtueType2 === 'selfControl'
    ? (language === 'pt-BR' ? 'Autocontrole' : 'Self-Control')
    : (language === 'pt-BR' ? 'Instinto' : 'Instinct');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Virtues Card */}
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {language === 'pt-BR' ? 'Virtudes' : 'Virtues'}
          </CardTitle>
          <CardDescription className="font-body">
            {language === 'pt-BR'
              ? 'Defina as virtudes que guiam seu vampiro'
              : 'Define the virtues that guide your vampire'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Virtue 1: Conscience / Conviction */}
          <div className="space-y-3">
            <RadioGroup
              value={virtues.virtueType1}
              onValueChange={(value) => updateVirtue('virtueType1', value as 'conscience' | 'conviction')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="conscience" id="conscience" />
                <Label htmlFor="conscience" className="font-medieval text-sm cursor-pointer">
                  {language === 'pt-BR' ? 'Consciência' : 'Conscience'}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="conviction" id="conviction" />
                <Label htmlFor="conviction" className="font-medieval text-sm cursor-pointer">
                  {language === 'pt-BR' ? 'Convicção' : 'Conviction'}
                </Label>
              </div>
            </RadioGroup>
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-muted-foreground">{virtue1Label}</span>
              <DotRating
                value={virtues.virtueValue1}
                onChange={(value) => updateVirtue('virtueValue1', value)}
                maxValue={5}
                minValue={1}
              />
            </div>
          </div>

          {/* Virtue 2: Self-Control / Instinct */}
          <div className="space-y-3">
            <RadioGroup
              value={virtues.virtueType2}
              onValueChange={(value) => updateVirtue('virtueType2', value as 'selfControl' | 'instinct')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selfControl" id="selfControl" />
                <Label htmlFor="selfControl" className="font-medieval text-sm cursor-pointer">
                  {language === 'pt-BR' ? 'Autocontrole' : 'Self-Control'}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="instinct" id="instinct" />
                <Label htmlFor="instinct" className="font-medieval text-sm cursor-pointer">
                  {language === 'pt-BR' ? 'Instinto' : 'Instinct'}
                </Label>
              </div>
            </RadioGroup>
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-muted-foreground">{virtue2Label}</span>
              <DotRating
                value={virtues.virtueValue2}
                onChange={(value) => updateVirtue('virtueValue2', value)}
                maxValue={5}
                minValue={1}
              />
            </div>
          </div>

          {/* Courage */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="font-medieval text-sm">
              {language === 'pt-BR' ? 'Coragem' : 'Courage'}
            </span>
            <DotRating
              value={virtues.courage}
              onChange={(value) => updateVirtue('courage', value)}
              maxValue={5}
              minValue={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Humanity / Path Card */}
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {language === 'pt-BR' ? 'Humanidade / Trilha' : 'Humanity / Path'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={moralityType}
            onValueChange={(value) => updateFormData({ moralityType: value as 'humanity' | 'path' })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="humanity" id="humanity" />
              <Label htmlFor="humanity" className="font-medieval text-sm cursor-pointer">
                {language === 'pt-BR' ? 'Humanidade' : 'Humanity'}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="path" id="path" />
              <Label htmlFor="path" className="font-medieval text-sm cursor-pointer">
                {language === 'pt-BR' ? 'Trilha' : 'Path'}
              </Label>
            </div>
          </RadioGroup>

          {moralityType === 'path' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Label htmlFor="pathName" className="font-medieval text-sm">
                {language === 'pt-BR' ? 'Nome da Trilha' : 'Path Name'}
              </Label>
              <Input
                id="pathName"
                value={pathName}
                onChange={(e) => updateFormData({ pathName: e.target.value })}
                placeholder={language === 'pt-BR' ? 'Ex: Trilha do Poder...' : 'Ex: Path of Power...'}
                className="font-body bg-input border-border"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="font-body text-sm">
              {moralityType === 'humanity'
                ? (language === 'pt-BR' ? 'Humanidade' : 'Humanity')
                : (pathName || (language === 'pt-BR' ? 'Trilha' : 'Path'))}
              <span className="text-muted-foreground ml-2 text-xs">
                ({language === 'pt-BR' ? 'auto' : 'auto'}: {virtues.virtueValue1 + virtues.virtueValue2})
              </span>
            </span>
            <DotRating
              value={humanity}
              onChange={(value) => updateFormData({ humanity: value })}
              maxValue={10}
              minValue={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Willpower Card */}
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {language === 'pt-BR' ? 'Força de Vontade' : 'Willpower'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="font-body text-sm">
              {language === 'pt-BR' ? 'Força de Vontade' : 'Willpower'}
              <span className="text-muted-foreground ml-2 text-xs">
                ({language === 'pt-BR' ? 'auto' : 'auto'}: {virtues.courage})
              </span>
            </span>
            <DotRating
              value={willpower}
              onChange={(value) => updateFormData({ willpower: value })}
              maxValue={10}
              minValue={1}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
