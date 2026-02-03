import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Sword } from 'lucide-react';
import StepBasicInfo from '@/components/character/StepBasicInfo';
import StepAttributes from '@/components/character/StepAttributes';
import StepMinorMarks from '@/components/character/StepMinorMarks';

export type AttributeType = 'strong' | 'neutral' | 'weak';

export interface CharacterFormData {
  name: string;
  concept: string;
  attributes: {
    aggression: AttributeType;
    determination: AttributeType;
    seduction: AttributeType;
    cunning: AttributeType;
    faith: AttributeType;
  };
  selectedMarks: string[];
}

const initialFormData: CharacterFormData = {
  name: '',
  concept: '',
  attributes: {
    aggression: 'neutral',
    determination: 'neutral',
    seduction: 'neutral',
    cunning: 'neutral',
    faith: 'neutral',
  },
  selectedMarks: [],
};

export default function CreateCharacter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CharacterFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length >= 2;
      case 2: {
        const types = Object.values(formData.attributes);
        const strongCount = types.filter(t => t === 'strong').length;
        const neutralCount = types.filter(t => t === 'neutral').length;
        const weakCount = types.filter(t => t === 'weak').length;
        return strongCount === 2 && neutralCount === 1 && weakCount === 2;
      }
      case 3:
        return formData.selectedMarks.length === 2;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async () => {
    if (!user || !validateStep(3)) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('characters').insert({
        user_id: user.id,
        name: formData.name.trim(),
        concept: formData.concept.trim() || null,
        aggression_type: formData.attributes.aggression,
        determination_type: formData.attributes.determination,
        seduction_type: formData.attributes.seduction,
        cunning_type: formData.attributes.cunning,
        faith_type: formData.attributes.faith,
        minor_marks: formData.selectedMarks,
      });

      if (error) throw error;

      toast({
        title: t.character.create,
        description: `${formData.name} foi criado com sucesso!`,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating character:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o personagem.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<CharacterFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Sword className="w-6 h-6 text-primary" />
            <h1 className="font-medieval text-xl md:text-2xl text-foreground">
              {t.character.create}
            </h1>
          </div>

          <div className="text-sm text-muted-foreground font-body">
            {t.character.step} {step} {t.character.of} {totalSteps}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="container mx-auto px-4 py-4">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <main className="container mx-auto px-4 py-6">
        {step === 1 && (
          <StepBasicInfo
            formData={formData}
            updateFormData={updateFormData}
          />
        )}

        {step === 2 && (
          <StepAttributes
            formData={formData}
            updateFormData={updateFormData}
          />
        )}

        {step === 3 && (
          <StepMinorMarks
            formData={formData}
            updateFormData={updateFormData}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 max-w-2xl mx-auto">
          <Button variant="outline" onClick={handleBack}>
            {t.common.back}
          </Button>

          {step < totalSteps ? (
            <Button 
              onClick={handleNext}
              disabled={!validateStep(step)}
            >
              {t.common.next}
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={!validateStep(step) || isSubmitting}
            >
              {isSubmitting ? t.common.loading : t.common.finish}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
