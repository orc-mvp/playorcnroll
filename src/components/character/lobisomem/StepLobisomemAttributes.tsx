import { LobisomemFormData } from './StepLobisomemBasicInfo';
import AttributesEditor, { AttributeValues } from '@/components/character/storyteller/shared/AttributesEditor';
import AbilitiesEditor, { AbilityValues } from '@/components/character/storyteller/shared/AbilitiesEditor';

interface StepLobisomemAttributesProps {
  formData: LobisomemFormData;
  updateFormData: (updates: Partial<LobisomemFormData>) => void;
}

export default function StepLobisomemAttributes({ formData, updateFormData }: StepLobisomemAttributesProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AttributesEditor
        value={formData.attributes as AttributeValues}
        onChange={(next) => updateFormData({ attributes: next as LobisomemFormData['attributes'] })}
        minValue={1}
      />
      <AbilitiesEditor
        value={formData.abilities as AbilityValues}
        onChange={(next) => updateFormData({ abilities: next as LobisomemFormData['abilities'] })}
        specializations={formData.specializations}
        onSpecializationsChange={(next) => updateFormData({ specializations: next })}
      />
    </div>
  );
}
