import { VampiroFormData } from './StepVampiroBasicInfo';
import AttributesEditor, { AttributeValues } from '@/components/character/storyteller/shared/AttributesEditor';
import AbilitiesEditor, { AbilityValues } from '@/components/character/storyteller/shared/AbilitiesEditor';

interface StepVampiroAttributesProps {
  formData: VampiroFormData;
  updateFormData: (updates: Partial<VampiroFormData>) => void;
}

export default function StepVampiroAttributes({ formData, updateFormData }: StepVampiroAttributesProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AttributesEditor
        value={formData.attributes as AttributeValues}
        onChange={(next) => updateFormData({ attributes: next as VampiroFormData['attributes'] })}
        minValue={1}
      />
      <AbilitiesEditor
        value={formData.abilities as AbilityValues}
        onChange={(next) => updateFormData({ abilities: next as VampiroFormData['abilities'] })}
        specializations={formData.specializations}
        onSpecializationsChange={(next) => updateFormData({ specializations: next })}
      />
    </div>
  );
}
