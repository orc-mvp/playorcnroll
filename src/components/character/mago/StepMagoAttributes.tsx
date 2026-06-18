import { MagoFormData } from './StepMagoBasicInfo';
import AttributesEditor, { AttributeValues } from '@/components/character/storyteller/shared/AttributesEditor';
import AbilitiesEditor, { AbilityValues } from '@/components/character/storyteller/shared/AbilitiesEditor';

interface Props {
  formData: MagoFormData;
  updateFormData: (updates: Partial<MagoFormData>) => void;
  edition?: '20th' | '5ed';
}

export default function StepMagoAttributes({ formData, updateFormData, edition = '20th' }: Props) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AttributesEditor
        value={formData.attributes as AttributeValues}
        onChange={(next) => updateFormData({ attributes: next as MagoFormData['attributes'] })}
        minValue={1}
        edition={edition}
      />
      <AbilitiesEditor
        value={formData.abilities as AbilityValues}
        onChange={(next) => updateFormData({ abilities: next as MagoFormData['abilities'] })}
        specializations={formData.specializations}
        onSpecializationsChange={(next) => updateFormData({ specializations: next })}
      />
    </div>
  );
}
