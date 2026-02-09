import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const { t } = useI18n();
  
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
    ? t.virtues.conscience
    : t.virtues.conviction;

  const virtue2Label = virtues.virtueType2 === 'selfControl'
    ? t.virtues.selfControl
    : t.virtues.instinct;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Virtues Card */}
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">
            {t.virtues.virtues}
          </CardTitle>
          <CardDescription className="font-body">
            {t.virtues.defineVirtues}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Virtue 1: Conscience / Conviction */}
          <div className="flex items-center justify-between gap-4">
            <Select
              value={virtues.virtueType1}
              onValueChange={(value) => updateVirtue('virtueType1', value as 'conscience' | 'conviction')}
            >
              <SelectTrigger className="w-40 font-body bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conscience">
                  {t.virtues.conscience}
                </SelectItem>
                <SelectItem value="conviction">
                  {t.virtues.conviction}
                </SelectItem>
              </SelectContent>
            </Select>
            <DotRating
              value={virtues.virtueValue1}
              onChange={(value) => updateVirtue('virtueValue1', value)}
              maxValue={5}
              minValue={1}
            />
          </div>

          {/* Virtue 2: Self-Control / Instinct */}
          <div className="flex items-center justify-between gap-4">
            <Select
              value={virtues.virtueType2}
              onValueChange={(value) => updateVirtue('virtueType2', value as 'selfControl' | 'instinct')}
            >
              <SelectTrigger className="w-40 font-body bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="selfControl">
                  {t.virtues.selfControl}
                </SelectItem>
                <SelectItem value="instinct">
                  {t.virtues.instinct}
                </SelectItem>
              </SelectContent>
            </Select>
            <DotRating
              value={virtues.virtueValue2}
              onChange={(value) => updateVirtue('virtueValue2', value)}
              maxValue={5}
              minValue={1}
            />
          </div>

          {/* Courage */}
          <div className="flex items-center justify-between gap-4">
            <span className="font-body text-sm w-40">
              {t.virtues.courage}
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
            {t.virtues.humanityPath}
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
                {t.virtues.humanity}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="path" id="path" />
              <Label htmlFor="path" className="font-medieval text-sm cursor-pointer">
                {t.virtues.path}
              </Label>
            </div>
          </RadioGroup>

          {moralityType === 'path' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Label htmlFor="pathName" className="font-medieval text-sm">
                {t.virtues.pathName}
              </Label>
              <Input
                id="pathName"
                value={pathName}
                onChange={(e) => updateFormData({ pathName: e.target.value })}
                placeholder={t.virtues.pathNamePlaceholder}
                className="font-body bg-input border-border"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="font-body text-sm">
              {moralityType === 'humanity'
                ? t.virtues.humanity
                : (pathName || t.virtues.path)}
              <span className="text-muted-foreground ml-2 text-xs">
                ({t.virtues.auto}: {virtues.virtueValue1 + virtues.virtueValue2})
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
            {t.virtues.willpower}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="font-body text-sm">
              {t.virtues.willpower}
              <span className="text-muted-foreground ml-2 text-xs">
                ({t.virtues.auto}: {virtues.courage})
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
