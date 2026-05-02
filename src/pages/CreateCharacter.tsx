import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sword, Construction, Dog } from 'lucide-react';
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
import StepLobisomemBasicInfo, { LobisomemFormData } from '@/components/character/lobisomem/StepLobisomemBasicInfo';
import StepLobisomemAttributes from '@/components/character/lobisomem/StepLobisomemAttributes';
import StepLobisomemGifts from '@/components/character/lobisomem/StepLobisomemGifts';
import StepLobisomemBackgrounds from '@/components/character/lobisomem/StepLobisomemBackgrounds';
import StepLobisomemMeritsFlaws from '@/components/character/lobisomem/StepLobisomemMeritsFlaws';
import StepMagoBasicInfo, { MagoFormData } from '@/components/character/mago/StepMagoBasicInfo';
import StepMagoAttributes from '@/components/character/mago/StepMagoAttributes';
import StepMagoSpheres from '@/components/character/mago/StepMagoSpheres';
import StepMagoRotes from '@/components/character/mago/StepMagoRotes';
import StepMagoBackgrounds from '@/components/character/mago/StepMagoBackgrounds';
import StepMagoMeritsFlaws from '@/components/character/mago/StepMagoMeritsFlaws';

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
  name: '', player: '', chronicle: '', nature: '', demeanor: '',
  clan: '', generation: '', sire: '', concept: '',
  attributes: {
    physical: { strength: 1, dexterity: 1, stamina: 1 },
    social: { charisma: 1, manipulation: 1, appearance: 1 },
    mental: { perception: 1, intelligence: 1, wits: 1 },
  },
  abilities: { talents: {}, skills: {}, knowledges: {} },
  specializations: {},
  virtues: { virtueType1: 'conscience', virtueValue1: 1, virtueType2: 'selfControl', virtueValue2: 1, courage: 1 },
  moralityType: 'humanity', pathName: '', humanity: 2, willpower: 1,
  disciplines: {}, backgrounds: {}, merits_flaws: [],
};

const initialLobisomemFormData: LobisomemFormData = {
  name: '', player: '', chronicle: '', nature: '', demeanor: '',
  tribe: '', auspice: '', rank: '', breed: '', pack: '', totem: '', concept: '',
  attributes: {
    physical: { strength: 1, dexterity: 1, stamina: 1 },
    social: { charisma: 1, manipulation: 1, appearance: 1 },
    mental: { perception: 1, intelligence: 1, wits: 1 },
  },
  abilities: { talents: {}, skills: {}, knowledges: {} },
  specializations: {},
  gifts: {},
  backgrounds: {},
  gnosis: 1, rage: 1, willpower: 1,
  renown: { glory: 0, honor: 0, wisdom: 0 },
  merits_flaws: [],
};

const initialMagoFormData: MagoFormData = {
  name: '', player: '', chronicle: '', nature: '', demeanor: '',
  tradition: '', essence: '', cabal: '', concept: '',
  attributes: {
    physical: { strength: 1, dexterity: 1, stamina: 1 },
    social: { charisma: 1, manipulation: 1, appearance: 1 },
    mental: { perception: 1, intelligence: 1, wits: 1 },
  },
  abilities: { talents: {}, skills: {}, knowledges: {} },
  specializations: {},
  spheres: {},
  rotes: {},
  backgrounds: {},
  arete: 1, willpower: 1, quintessence: 0, paradox: 0,
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
  const VALID_PRE = ['vampiro_v3', 'herois_marcados', 'lobisomem_w20', 'mago_m20', 'metamorfos_w20'];

  const [gameSystem, setGameSystem] = useState<GameSystemId | null>(() => {
    if (preSelectedSystem && VALID_PRE.includes(preSelectedSystem)) {
      return preSelectedSystem as GameSystemId;
    }
    return null;
  });
  const [step, setStep] = useState(() => {
    if (preSelectedSystem && VALID_PRE.includes(preSelectedSystem)) {
      return 1;
    }
    return 0;
  });
  const [formData, setFormData] = useState<CharacterFormData>(initialFormData);
  const [vampiroFormData, setVampiroFormData] = useState<VampiroFormData>(initialVampiroFormData);
  const [lobisomemFormData, setLobisomemFormData] = useState<LobisomemFormData>(initialLobisomemFormData);
  const [magoFormData, setMagoFormData] = useState<MagoFormData>(initialMagoFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps =
    gameSystem === 'vampiro_v3' ? 6 :
    gameSystem === 'lobisomem_w20' ? 6 :
    gameSystem === 'metamorfos_w20' ? 6 :
    gameSystem === 'mago_m20' ? 7 :
    4;
  const progress = ((step + 1) / totalSteps) * 100;

  const validateStep = (currentStep: number): boolean => {
    if (gameSystem === 'herois_marcados') {
      switch (currentStep) {
        case 0: return gameSystem !== null && getGameSystem(gameSystem)?.available === true;
        case 1: return formData.name.trim().length >= 2;
        case 2: {
          const types = Object.values(formData.attributes);
          return types.filter(t => t === 'strong').length === 2 && types.filter(t => t === 'neutral').length === 1 && types.filter(t => t === 'weak').length === 2;
        }
        case 3: return formData.selectedMarks.length === 2;
        default: return false;
      }
    } else if (gameSystem === 'vampiro_v3') {
      switch (currentStep) {
        case 0: return gameSystem !== null && getGameSystem(gameSystem)?.available === true;
        case 1: return vampiroFormData.name.trim().length >= 2 && vampiroFormData.clan.length > 0;
        case 2: case 3: case 4: case 5: return true;
        default: return false;
      }
    } else if (gameSystem === 'lobisomem_w20' || gameSystem === 'metamorfos_w20') {
      switch (currentStep) {
        case 0: return gameSystem !== null && getGameSystem(gameSystem)?.available === true;
        case 1:
          // Para Metamorfos, tribo/auspício são opcionais (espécie é livre, editada depois).
          if (gameSystem === 'metamorfos_w20') return lobisomemFormData.name.trim().length >= 2;
          return lobisomemFormData.name.trim().length >= 2 && lobisomemFormData.tribe.length > 0 && lobisomemFormData.auspice.length > 0;
        case 2: case 3: case 4: case 5: return true;
        default: return false;
      }
    } else if (gameSystem === 'mago_m20') {
      switch (currentStep) {
        case 0: return gameSystem !== null && getGameSystem(gameSystem)?.available === true;
        case 1: return magoFormData.name.trim().length >= 2 && magoFormData.tradition.length > 0;
        case 2: case 3: case 4: case 5: case 6: return true;
        default: return false;
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
    console.log('[CreateCharacter] handleSubmit called', { user: !!user, gameSystem });
    if (!user || !gameSystem) {
      console.warn('[CreateCharacter] handleSubmit aborted', { user: !!user, gameSystem });
      return;
    }

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
      } else if (gameSystem === 'lobisomem_w20' || gameSystem === 'metamorfos_w20') {
        const { error } = await supabase.from('characters').insert({
          user_id: user.id,
          name: lobisomemFormData.name.trim(),
          concept: lobisomemFormData.concept.trim() || null,
          game_system: gameSystem,
          vampiro_data: {
            player: lobisomemFormData.player,
            chronicle: lobisomemFormData.chronicle,
            nature: lobisomemFormData.nature,
            demeanor: lobisomemFormData.demeanor,
            tribe: lobisomemFormData.tribe,
            auspice: lobisomemFormData.auspice,
            rank: lobisomemFormData.rank,
            breed: lobisomemFormData.breed,
            pack: lobisomemFormData.pack,
            totem: lobisomemFormData.totem,
            attributes: lobisomemFormData.attributes,
            abilities: lobisomemFormData.abilities,
            specializations: lobisomemFormData.specializations,
            gnosis: lobisomemFormData.gnosis,
            rage: lobisomemFormData.rage,
            willpower: lobisomemFormData.willpower,
            gifts: lobisomemFormData.gifts,
            backgrounds: lobisomemFormData.backgrounds,
            renown: lobisomemFormData.renown,
            merits_flaws: lobisomemFormData.merits_flaws || [],
            // Metamorfos começa com lista vazia de formas — configurar na edição.
            ...(gameSystem === 'metamorfos_w20' ? { metamorph_forms: [], metamorph_species: '' } : {}),
          },
        });
        if (error) throw error;
      } else if (gameSystem === 'mago_m20') {
        const { error } = await supabase.from('characters').insert({
          user_id: user.id,
          name: magoFormData.name.trim(),
          concept: magoFormData.concept.trim() || null,
          game_system: gameSystem,
          vampiro_data: {
            player: magoFormData.player,
            chronicle: magoFormData.chronicle,
            nature: magoFormData.nature,
            demeanor: magoFormData.demeanor,
            tradition: magoFormData.tradition,
            essence: magoFormData.essence,
            cabal: magoFormData.cabal,
            attributes: magoFormData.attributes,
            abilities: magoFormData.abilities,
            specializations: magoFormData.specializations,
            spheres: magoFormData.spheres,
            rotes: magoFormData.rotes,
            backgrounds: magoFormData.backgrounds,
            arete: magoFormData.arete,
            willpower: magoFormData.willpower,
            quintessence: magoFormData.quintessence,
            paradox: magoFormData.paradox,
            merits_flaws: magoFormData.merits_flaws || [],
          },
        });
        if (error) throw error;
      }

      const charName = gameSystem === 'vampiro_v3' ? vampiroFormData.name
        : (gameSystem === 'lobisomem_w20' || gameSystem === 'metamorfos_w20') ? lobisomemFormData.name
        : gameSystem === 'mago_m20' ? magoFormData.name
        : formData.name;

      toast({
        title: t.character.create,
        description: language === 'pt-BR' 
          ? `${charName} foi criado com sucesso!`
          : `${charName} was created successfully!`,
      });

      const returnTo = searchParams.get('returnTo');
      navigate(returnTo || '/dashboard');
    } catch (error) {
      console.error('[CreateCharacter] Error creating character:', error);
      toast({
        title: 'Erro',
        description: (error as { message?: string })?.message || 'Não foi possível criar o personagem.',
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
          <div className="max-w-4xl mx-auto">
            <Card className="medieval-card">
              <CardHeader className="text-center pb-4">
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
          <StepBasicInfo formData={formData} updateFormData={updateFormData} />
        )}
        {step === 2 && gameSystem === 'herois_marcados' && (
          <StepAttributes formData={formData} updateFormData={updateFormData} />
        )}
        {step === 3 && gameSystem === 'herois_marcados' && (
          <StepMinorMarks formData={formData} updateFormData={updateFormData} />
        )}

        {/* Lobisomem & Metamorfos Steps (compartilham os mesmos componentes) */}
        {step === 1 && (gameSystem === 'lobisomem_w20' || gameSystem === 'metamorfos_w20') && (
          <StepLobisomemBasicInfo
            formData={lobisomemFormData}
            updateFormData={(u) => setLobisomemFormData(prev => ({ ...prev, ...u }))}
            gameSystem={gameSystem}
          />
        )}
        {step === 2 && (gameSystem === 'lobisomem_w20' || gameSystem === 'metamorfos_w20') && (
          <StepLobisomemAttributes
            formData={lobisomemFormData}
            updateFormData={(u) => setLobisomemFormData(prev => ({ ...prev, ...u }))}
          />
        )}
        {step === 3 && (gameSystem === 'lobisomem_w20' || gameSystem === 'metamorfos_w20') && (
          <StepLobisomemGifts
            formData={lobisomemFormData}
            updateFormData={(u) => setLobisomemFormData(prev => ({ ...prev, ...u }))}
          />
        )}
        {step === 4 && (gameSystem === 'lobisomem_w20' || gameSystem === 'metamorfos_w20') && (
          <StepLobisomemBackgrounds
            formData={lobisomemFormData}
            updateFormData={(u) => setLobisomemFormData(prev => ({ ...prev, ...u }))}
          />
        )}
        {step === 5 && (gameSystem === 'lobisomem_w20' || gameSystem === 'metamorfos_w20') && (
          <StepLobisomemMeritsFlaws
            formData={lobisomemFormData}
            updateFormData={(u) => setLobisomemFormData(prev => ({ ...prev, ...u }))}
          />
        )}

        {/* Mago Steps */}
        {step === 1 && gameSystem === 'mago_m20' && (
          <StepMagoBasicInfo
            formData={magoFormData}
            updateFormData={(u) => setMagoFormData(prev => ({ ...prev, ...u }))}
          />
        )}
        {step === 2 && gameSystem === 'mago_m20' && (
          <StepMagoAttributes
            formData={magoFormData}
            updateFormData={(u) => setMagoFormData(prev => ({ ...prev, ...u }))}
          />
        )}
        {step === 3 && gameSystem === 'mago_m20' && (
          <StepMagoSpheres
            formData={magoFormData}
            updateFormData={(u) => setMagoFormData(prev => ({ ...prev, ...u }))}
          />
        )}
        {step === 4 && gameSystem === 'mago_m20' && (
          <StepMagoRotes
            formData={magoFormData}
            updateFormData={(u) => setMagoFormData(prev => ({ ...prev, ...u }))}
          />
        )}
        {step === 5 && gameSystem === 'mago_m20' && (
          <StepMagoBackgrounds
            formData={magoFormData}
            updateFormData={(u) => setMagoFormData(prev => ({ ...prev, ...u }))}
          />
        )}
        {step === 6 && gameSystem === 'mago_m20' && (
          <StepMagoMeritsFlaws
            formData={magoFormData}
            updateFormData={(u) => setMagoFormData(prev => ({ ...prev, ...u }))}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 max-w-2xl mx-auto">
          <Button variant="outline" onClick={handleBack}>
            {t.common.back}
          </Button>

          {step < totalSteps - 1 && (
            <Button onClick={handleNext} disabled={!validateStep(step)}>
              {t.common.next}
            </Button>
          )}

          {step === totalSteps - 1 && (
            <Button
              onClick={handleSubmit}
              disabled={
                (gameSystem === 'herois_marcados' && !validateStep(step)) ||
                (gameSystem === 'vampiro_v3' && (!vampiroFormData.name.trim() || !vampiroFormData.clan)) ||
                (gameSystem === 'lobisomem_w20' && (!lobisomemFormData.name.trim() || !lobisomemFormData.tribe)) ||
                (gameSystem === 'metamorfos_w20' && !lobisomemFormData.name.trim()) ||
                (gameSystem === 'mago_m20' && (!magoFormData.name.trim() || !magoFormData.tradition)) ||
                isSubmitting
              }
            >
              {isSubmitting ? t.common.loading : t.common.finish}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
