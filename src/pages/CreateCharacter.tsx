import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sword, Construction } from 'lucide-react';
import StepBasicInfo from '@/components/character/StepBasicInfo';
import StepAttributes from '@/components/character/StepAttributes';
import StepMinorMarks from '@/components/character/StepMinorMarks';
import StepVampiroBasicInfo, { VampiroFormData } from '@/components/character/vampiro/StepVampiroBasicInfo';
import StepVampiroAttributes from '@/components/character/vampiro/StepVampiroAttributes';
import StepVampiroVirtues from '@/components/character/vampiro/StepVampiroVirtues';
import StepVampiroDisciplines from '@/components/character/vampiro/StepVampiroDisciplines';
import StepVampiroMeritsFlaws from '@/components/character/vampiro/StepVampiroMeritsFlaws';
import GameSystemSelector from '@/components/GameSystemSelector';
import { GameSystemId, getGameSystem } from '@/lib/gameSystems';

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

const initialVampiroFormData: VampiroFormData = {
  // Step 1 - Basic Info
  name: '',
  player: '',
  chronicle: '',
  nature: '',
  demeanor: '',
  clan: '',
  generation: '',
  sire: '',
  concept: '',
  
  // Step 2 - Attributes & Abilities
  attributes: {
    physical: { strength: 1, dexterity: 1, stamina: 1 },
    social: { charisma: 1, manipulation: 1, appearance: 1 },
    mental: { perception: 1, intelligence: 1, wits: 1 },
  },
  abilities: {
    talents: {},
    skills: {},
    knowledges: {},
  },
  specializations: {},
  
  // Step 3 - Virtues, Humanity/Path, Willpower
  virtues: {
    virtueType1: 'conscience',
    virtueValue1: 1,
    virtueType2: 'selfControl',
    virtueValue2: 1,
    courage: 1,
  },
  moralityType: 'humanity',
  pathName: '',
  humanity: 2,
  willpower: 1,
  
  // Step 4 - Disciplines & Backgrounds
  disciplines: {},
  backgrounds: {},
  
  // Step 5 - Merits & Flaws
  merits_flaws: [],
};

export default function CreateCharacter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { toast } = useToast();
  
  // Check for pre-selected system from URL params
  const preSelectedSystem = searchParams.get('system');
  
  // Initialize state based on URL param
  const [gameSystem, setGameSystem] = useState<GameSystemId | null>(() => {
    if (preSelectedSystem === 'vampiro_v3' || preSelectedSystem === 'herois_marcados') {
      return preSelectedSystem;
    }
    return null;
  });
  const [step, setStep] = useState(() => {
    if (preSelectedSystem === 'vampiro_v3' || preSelectedSystem === 'herois_marcados') {
      return 1; // Skip system selection
    }
    return 0;
  });
  const [formData, setFormData] = useState<CharacterFormData>(initialFormData);
  const [vampiroFormData, setVampiroFormData] = useState<VampiroFormData>(initialVampiroFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = gameSystem === 'vampiro_v3' ? 6 : 4; // Vampiro: 0-5, Marcados: 0-3
  const progress = ((step + 1) / totalSteps) * 100;

  const validateStep = (currentStep: number): boolean => {
    if (gameSystem === 'herois_marcados') {
      switch (currentStep) {
        case 0:
          return gameSystem !== null && getGameSystem(gameSystem)?.available === true;
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
    } else if (gameSystem === 'vampiro_v3') {
      switch (currentStep) {
        case 0:
          return gameSystem !== null && getGameSystem(gameSystem)?.available === true;
        case 1:
          return vampiroFormData.name.trim().length >= 2 && vampiroFormData.clan.length > 0;
        case 2:
          return true;
        case 3:
          // Virtues step - always valid since virtues have minValue
          return true;
        case 4:
          return true;
        case 5:
          // Merits & Flaws step - always valid (optional)
          return true;
        default:
          return false;
      }
    }
    return currentStep === 0 && gameSystem !== null;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async () => {
    if (!user || !gameSystem) return;

    setIsSubmitting(true);
    try {
      if (gameSystem === 'herois_marcados') {
        if (!validateStep(3)) return;
        
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
          game_system: gameSystem,
        });

        if (error) throw error;
      } else if (gameSystem === 'vampiro_v3') {
        const { error } = await supabase.from('characters').insert({
          user_id: user.id,
          name: vampiroFormData.name.trim(),
          concept: vampiroFormData.concept.trim() || null,
          game_system: gameSystem,
          vampiro_data: {
            player: vampiroFormData.player,
            chronicle: vampiroFormData.chronicle,
            nature: vampiroFormData.nature,
            demeanor: vampiroFormData.demeanor,
            clan: vampiroFormData.clan,
            generation: vampiroFormData.generation,
            sire: vampiroFormData.sire,
            attributes: vampiroFormData.attributes,
            abilities: vampiroFormData.abilities,
            specializations: vampiroFormData.specializations,
            virtues: vampiroFormData.virtues,
            moralityType: vampiroFormData.moralityType,
            pathName: vampiroFormData.pathName,
            humanity: vampiroFormData.humanity,
            willpower: vampiroFormData.willpower,
            disciplines: vampiroFormData.disciplines,
            backgrounds: vampiroFormData.backgrounds,
            merits_flaws: vampiroFormData.merits_flaws || [],
          },
        });

        if (error) throw error;
      }

      toast({
        title: t.character.create,
        description: language === 'pt-BR' 
          ? `${gameSystem === 'vampiro_v3' ? vampiroFormData.name : formData.name} foi criado com sucesso!`
          : `${gameSystem === 'vampiro_v3' ? vampiroFormData.name : formData.name} was created successfully!`,
      });

      const returnTo = searchParams.get('returnTo');
      navigate(returnTo || '/dashboard');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating character:', error);
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

  const updateVampiroFormData = (updates: Partial<VampiroFormData>) => {
    setVampiroFormData(prev => ({ ...prev, ...updates }));
  };

  const selectedSystem = gameSystem ? getGameSystem(gameSystem) : null;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Sword className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
            <h1 className="font-medieval text-lg sm:text-xl md:text-2xl text-foreground truncate">
              {t.character.create}
            </h1>
          </div>

          <div className="text-sm text-muted-foreground font-body shrink-0">
            {t.character.step} {step + 1} {t.character.of} {totalSteps}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="container mx-auto px-4 py-4">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Step 0: System Selection */}
        {step === 0 && (
          <div className="max-w-2xl mx-auto">
            <Card className="medieval-card">
              <CardHeader className="text-center">
                <CardTitle className="font-medieval text-2xl">
                  {language === 'pt-BR' ? 'Escolha o Sistema' : 'Choose the System'}
                </CardTitle>
                <CardDescription className="font-body">
                  {language === 'pt-BR' 
                    ? 'Selecione para qual sistema de jogo você deseja criar seu personagem'
                    : 'Select which game system you want to create your character for'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GameSystemSelector
                  value={gameSystem}
                  onChange={setGameSystem}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Vampiro Step 1: Basic Info */}
        {step === 1 && gameSystem === 'vampiro_v3' && (
          <StepVampiroBasicInfo
            formData={vampiroFormData}
            updateFormData={updateVampiroFormData}
          />
        )}

        {/* Vampiro Step 2: Attributes & Abilities */}
        {step === 2 && gameSystem === 'vampiro_v3' && (
          <StepVampiroAttributes
            formData={vampiroFormData}
            updateFormData={updateVampiroFormData}
          />
        )}

        {/* Vampiro Step 3: Virtues */}
        {step === 3 && gameSystem === 'vampiro_v3' && (
          <StepVampiroVirtues
            formData={vampiroFormData}
            updateFormData={updateVampiroFormData}
          />
        )}

        {/* Vampiro Step 4: Disciplines & Backgrounds */}
        {step === 4 && gameSystem === 'vampiro_v3' && (
          <StepVampiroDisciplines
            formData={vampiroFormData}
            updateFormData={updateVampiroFormData}
          />
        )}

        {/* Vampiro Step 5: Merits & Flaws */}
        {step === 5 && gameSystem === 'vampiro_v3' && (
          <StepVampiroMeritsFlaws
            formData={vampiroFormData}
            updateFormData={updateVampiroFormData}
          />
        )}

        {/* Heróis Marcados Steps */}
        {step === 1 && gameSystem === 'herois_marcados' && (
          <StepBasicInfo
            formData={formData}
            updateFormData={updateFormData}
          />
        )}

        {step === 2 && gameSystem === 'herois_marcados' && (
          <StepAttributes
            formData={formData}
            updateFormData={updateFormData}
          />
        )}

        {step === 3 && gameSystem === 'herois_marcados' && (
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

          {step === 0 && (
            <Button 
              onClick={handleNext}
              disabled={!validateStep(step)}
            >
              {t.common.next}
            </Button>
          )}

          {step > 0 && step < totalSteps - 1 && gameSystem === 'vampiro_v3' && (
            <Button 
              onClick={handleNext}
              disabled={!validateStep(step)}
            >
              {t.common.next}
            </Button>
          )}

          {step === totalSteps - 1 && gameSystem === 'vampiro_v3' && (
            <Button 
              onClick={handleSubmit}
              disabled={!vampiroFormData.name.trim() || !vampiroFormData.clan || isSubmitting}
            >
              {isSubmitting ? t.common.loading : t.common.finish}
            </Button>
          )}

          {step > 0 && step < totalSteps - 1 && gameSystem === 'herois_marcados' && (
            <Button 
              onClick={handleNext}
              disabled={!validateStep(step)}
            >
              {t.common.next}
            </Button>
          )}

          {step === totalSteps - 1 && gameSystem === 'herois_marcados' && (
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
