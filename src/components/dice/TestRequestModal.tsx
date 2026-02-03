import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DiceRoller } from './DiceRoller';
import { HeroicMoveModal } from './HeroicMoveModal';
import type { AttributeType, TestResult } from '@/lib/dice/extremeTable';
import { Dices, Sparkles } from 'lucide-react';

interface TestRequestModalProps {
  testId: string;
  sessionId: string;
  attribute: string;
  attributeType: AttributeType;
  difficulty: number;
  context?: string;
  characterId: string;
  isGroupTest: boolean;
  onClose: () => void;
}

export function TestRequestModal({
  testId,
  sessionId,
  attribute,
  attributeType,
  difficulty,
  context,
  characterId,
  isGroupTest,
  onClose,
}: TestRequestModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [hasRolled, setHasRolled] = useState(false);
  const [rollResult, setRollResult] = useState<{
    dice1: number;
    dice2: number;
    total: number;
    result: TestResult;
    hasPositiveExtreme: boolean;
    hasNegativeExtreme: boolean;
  } | null>(null);
  const [showHeroicModal, setShowHeroicModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleRollComplete = async (result: {
    dice1: number;
    dice2: number;
    total: number;
    result: TestResult;
    hasPositiveExtreme: boolean;
    hasNegativeExtreme: boolean;
  }) => {
    setRollResult(result);
    setHasRolled(true);
    setIsSaving(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Get attribute modifier
      const attrMod = attributeType === 'strong' ? 2 : attributeType === 'neutral' ? 1 : 0;

      // Save roll to database
      await supabase.from('test_rolls').insert({
        test_id: testId,
        user_id: user.id,
        character_id: characterId,
        dice1: result.dice1,
        dice2: result.dice2,
        attribute_modifier: attrMod,
        difficulty_modifier: difficulty,
        total: result.total,
        result: result.result,
        has_positive_extreme: result.hasPositiveExtreme,
        has_negative_extreme: result.hasNegativeExtreme,
        rolled_at: new Date().toISOString(),
      });

      // Create event for feed
      await supabase.from('session_events').insert({
        session_id: sessionId,
        event_type: 'dice_rolled',
        event_data: {
          character_id: characterId,
          attribute,
          dice1: result.dice1,
          dice2: result.dice2,
          total: result.total,
          result: result.result,
          has_positive_extreme: result.hasPositiveExtreme,
          has_negative_extreme: result.hasNegativeExtreme,
        },
      });

      // If positive extreme, show heroic move modal
      if (result.hasPositiveExtreme) {
        // Increment heroic moves stored
        const { data: character } = await supabase
          .from('characters')
          .select('heroic_moves_stored')
          .eq('id', characterId)
          .single();

        if (character) {
          await supabase
            .from('characters')
            .update({ heroic_moves_stored: character.heroic_moves_stored + 1 })
            .eq('id', characterId);
        }

        toast({
          title: t.tests.heroicMoveEarned,
          duration: 3000,
        });
      }

      // If negative extreme, notify (complication will be created by narrator)
      if (result.hasNegativeExtreme) {
        toast({
          title: t.tests.extremeNegative,
          description: 'O Narrador pode criar uma Complicação',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error saving roll:', error);
      toast({
        title: 'Erro ao salvar rolagem',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseHeroicMove = () => {
    setShowHeroicModal(true);
  };

  const handleHeroicMoveComplete = () => {
    setShowHeroicModal(false);
    onClose();
  };

  return (
    <>
      <Dialog open={!showHeroicModal} onOpenChange={(open) => !open && !showHeroicModal && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-medieval flex items-center gap-2">
              <Dices className="w-5 h-5 text-primary" />
              {t.tests.request}
            </DialogTitle>
          </DialogHeader>

          {context && (
            <p className="text-sm text-muted-foreground font-body italic">
              "{context}"
            </p>
          )}

          <DiceRoller
            attribute={attribute}
            attributeType={attributeType}
            difficulty={difficulty}
            onRollComplete={handleRollComplete}
            disabled={hasRolled}
          />

          {hasRolled && rollResult && (
            <div className="flex flex-col gap-2">
              {rollResult.hasPositiveExtreme && (
                <Button 
                  variant="outline" 
                  className="w-full border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                  onClick={handleUseHeroicMove}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Usar Movimento Heroico Agora
                </Button>
              )}
              
              <Button onClick={onClose} disabled={isSaving}>
                {isSaving ? t.common.loading : 'Fechar'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showHeroicModal && (
        <HeroicMoveModal
          characterId={characterId}
          sessionId={sessionId}
          isGroupTest={isGroupTest}
          onClose={handleHeroicMoveComplete}
        />
      )}
    </>
  );
}
