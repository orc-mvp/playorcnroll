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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DiceRoller } from './DiceRoller';
import { HeroicMoveModal } from './HeroicMoveModal';
import type { AttributeType, TestResult } from '@/lib/dice/extremeTable';
import { Dices, Sparkles, Users, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface GroupRollStatus {
  characterId: string;
  characterName: string;
  hasRolled: boolean;
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
  
  // Group test specific state
  const [groupRollStatus, setGroupRollStatus] = useState<GroupRollStatus[]>([]);
  const [allGroupRolled, setAllGroupRolled] = useState(false);
  const [showPullGroupOption, setShowPullGroupOption] = useState(false);

  // Fetch group test status if it's a group test
  useEffect(() => {
    if (!isGroupTest) return;

    const fetchGroupStatus = async () => {
      // Get test event data to find expected players
      const { data: events } = await supabase
        .from('session_events')
        .select('event_data')
        .eq('session_id', sessionId)
        .eq('event_type', 'test_requested')
        .order('created_at', { ascending: false })
        .limit(10);

      const testEvent = events?.find(e => 
        (e.event_data as any)?.test_id === testId
      );
      
      const expectedPlayers = (testEvent?.event_data as any)?.players || [];

      // Get participants with character names
      const { data: participants } = await supabase
        .from('session_participants')
        .select('character_id, characters:character_id(id, name)')
        .eq('session_id', sessionId);

      // Get existing rolls
      const { data: rolls } = await supabase
        .from('test_rolls')
        .select('character_id')
        .eq('test_id', testId);

      const rolledCharIds = new Set((rolls || []).map(r => r.character_id));

      const status: GroupRollStatus[] = expectedPlayers.map((charId: string) => {
        const participant = participants?.find(p => p.character_id === charId);
        const char = participant?.characters as any;
        return {
          characterId: charId,
          characterName: char?.name || 'Jogador',
          hasRolled: rolledCharIds.has(charId),
        };
      });

      setGroupRollStatus(status);
      
      // Check if all have rolled
      const allRolled = status.every(s => s.hasRolled);
      setAllGroupRolled(allRolled);
    };

    fetchGroupStatus();

    // Subscribe to roll updates
    const channel = supabase
      .channel(`group-rolls-${testId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'test_rolls', filter: `test_id=eq.${testId}` },
        () => fetchGroupStatus()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isGroupTest, testId, sessionId]);

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

      // For group tests, hide individual results in feed
      if (!isGroupTest) {
        // Create event for feed (individual test only)
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
      }

      // If positive extreme, increment heroic moves and show option to use
      if (result.hasPositiveExtreme) {
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

        // If group test with positive extreme, show pull group option
        if (isGroupTest) {
          setShowPullGroupOption(true);
        }
      }

      // If negative extreme, notify
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

  const handlePullGroup = async () => {
    try {
      // Update roll to indicate pull group was used
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('test_rolls')
        .update({ pull_group_used: true })
        .eq('test_id', testId)
        .eq('user_id', user.id);

      // Deduct the heroic move
      const { data: character } = await supabase
        .from('characters')
        .select('heroic_moves_stored')
        .eq('id', characterId)
        .single();

      if (character && character.heroic_moves_stored > 0) {
        await supabase
          .from('characters')
          .update({ heroic_moves_stored: character.heroic_moves_stored - 1 })
          .eq('id', characterId);
      }

      // Create event
      await supabase.from('session_events').insert({
        session_id: sessionId,
        event_type: 'pull_group',
        event_data: { character_id: characterId },
      });

      toast({ title: t.tests.pullGroup + ' ativado! +1 sucesso coletivo' });
      setShowPullGroupOption(false);
      onClose();
    } catch (error) {
      console.error('Error using pull group:', error);
    }
  };

  const handleUseHeroicMove = () => {
    setShowHeroicModal(true);
  };

  const handleHeroicMoveComplete = () => {
    setShowHeroicModal(false);
    onClose();
  };

  const groupProgress = groupRollStatus.length > 0 
    ? (groupRollStatus.filter(s => s.hasRolled).length / groupRollStatus.length) * 100 
    : 0;

  return (
    <>
      <Dialog open={!showHeroicModal} onOpenChange={(open) => !open && !showHeroicModal && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-medieval flex items-center gap-2">
              <Dices className="w-5 h-5 text-primary" />
              {isGroupTest ? t.tests.group : t.tests.request}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {context && (
              <p className="text-sm text-muted-foreground font-body italic">
                "{context}"
              </p>
            )}

          {/* Group Test Status */}
          {isGroupTest && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medieval flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t.tests.group}
                </span>
                <span className="text-xs text-muted-foreground">
                  {groupRollStatus.filter(s => s.hasRolled).length}/{groupRollStatus.length}
                </span>
              </div>
              <Progress value={groupProgress} className="h-1.5" />
              <div className="flex flex-wrap gap-1">
                {groupRollStatus.map(status => (
                  <Badge 
                    key={status.characterId}
                    variant="outline"
                    className={cn(
                      "text-xs",
                      status.hasRolled 
                        ? "bg-green-500/20 text-green-500 border-green-500/30"
                        : "bg-muted"
                    )}
                  >
                    {status.hasRolled ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {status.characterName}
                  </Badge>
                ))}
              </div>
            </div>
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
              {/* Pull Group Option (only for group tests with positive extreme) */}
              {showPullGroupOption && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 space-y-2">
                  <p className="text-sm font-body text-yellow-500">
                    Você pode usar seu Movimento Heroico para {t.tests.pullGroup}!
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                      onClick={handlePullGroup}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {t.tests.pullGroup}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="flex-1"
                      onClick={() => {
                        setShowPullGroupOption(false);
                        setShowHeroicModal(true);
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t.tests.keepForSelf}
                    </Button>
                  </div>
                </div>
              )}

              {rollResult.hasPositiveExtreme && !showPullGroupOption && (
                <Button 
                  variant="outline" 
                  className="w-full border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                  onClick={handleUseHeroicMove}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Usar Movimento Heroico Agora
                </Button>
              )}

              {isGroupTest && !allGroupRolled && (
                <p className="text-xs text-center text-muted-foreground">
                  Aguardando outros jogadores rolarem...
                </p>
              )}
              
              <Button onClick={onClose} disabled={isSaving}>
                {isSaving ? t.common.loading : 'Fechar'}
              </Button>
            </div>
          )}
          </div>
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
