import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MeritsFlawsSelector, { type SelectedMeritFlaw } from '@/components/character/storyteller/shared/MeritsFlawsSelector';
import { LobisomemFormData } from './StepLobisomemBasicInfo';

interface StepLobisomemMeritsFlawsProps {
  formData: LobisomemFormData;
  updateFormData: (updates: Partial<LobisomemFormData>) => void;
}

export default function StepLobisomemMeritsFlaws({ formData, updateFormData }: StepLobisomemMeritsFlawsProps) {
  const { t, language } = useI18n();
  const selected = (formData.merits_flaws || []) as SelectedMeritFlaw[];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="medieval-card">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-medieval text-2xl">{t.meritsFlaws.title}</CardTitle>
          <CardDescription className="font-body">
            {language === 'pt-BR'
              ? 'Selecione vantagens e desvantagens para seu personagem (opcional)'
              : 'Select merits and flaws for your character (optional)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeritsFlawsSelector
            gameSystem="lobisomem_w20"
            selected={selected}
            onChange={(next) => updateFormData({ merits_flaws: next })}
            freebieBudget={15}
            variant="creation"
          />
        </CardContent>
      </Card>
    </div>
  );
}
