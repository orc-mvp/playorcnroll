import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestRoll {
  id: string;
  user_id: string;
  character_id: string;
  dice1: number | null;
  dice2: number | null;
  total: number | null;
  result: string | null;
  has_positive_extreme: boolean | null;
  has_negative_extreme: boolean | null;
  pull_group_used: boolean | null;
  rolled_at: string | null;
}

interface GroupTestPanelProps {
  testId: string;
  sessionId: string;
  attribute: string;
  expectedPlayers: string[]; // character IDs
  participants: Array<{
    character_id: string | null;
    character?: { id: string; name: string } | null;
  }>;
  isNarrator: boolean;
}

export function GroupTestPanel({ 
  testId, 
  sessionId, 
  attribute,
  expectedPlayers,
  participants,
  isNarrator 
}: GroupTestPanelProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [rolls, setRolls] = useState<TestRoll[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [groupResult, setGroupResult] = useState<{
    successes: number;
    partials: number;
    failures: number;
    pullGroupCount: number;
    finalResult: 'success' | 'partial' | 'failure';
  } | null>(null);

  // Fetch existing rolls and subscribe to updates
  useEffect(() => {
    const fetchRolls = async () => {
      const { data } = await supabase
        .from('test_rolls')
        .select('*')
        .eq('test_id', testId);
      
      if (data) {
        setRolls(data);
        checkCompletion(data);
      }
    };

    fetchRolls();

    // Subscribe to new rolls
    const channel = supabase
      .channel(`group-test-${testId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'test_rolls', filter: `test_id=eq.${testId}` },
        () => fetchRolls()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [testId]);

  const checkCompletion = (currentRolls: TestRoll[]) => {
    // Check if all expected players have rolled
    const rolledCharacterIds = new Set(currentRolls.map(r => r.character_id));
    const allRolled = expectedPlayers.every(charId => rolledCharacterIds.has(charId));
    
    if (allRolled && currentRolls.length >= expectedPlayers.length) {
      setIsComplete(true);
      calculateGroupResult(currentRolls);
    }
  };

  const calculateGroupResult = (currentRolls: TestRoll[]) => {
    let successes = 0;
    let partials = 0;
    let failures = 0;
    let pullGroupCount = 0;

    currentRolls.forEach(roll => {
      if (roll.result === 'success') successes++;
      else if (roll.result === 'partial') partials++;
      else if (roll.result === 'failure') failures++;
      
      if (roll.pull_group_used) pullGroupCount++;
    });

    // Add pull group bonus to successes
    successes += pullGroupCount;

    // Determine final result by majority
    let finalResult: 'success' | 'partial' | 'failure';
    if (successes > partials && successes > failures) {
      finalResult = 'success';
    } else if (failures > successes && failures > partials) {
      finalResult = 'failure';
    } else {
      finalResult = 'partial';
    }

    setGroupResult({ successes, partials, failures, pullGroupCount, finalResult });
  };

  const getCharacterName = (characterId: string): string => {
    const participant = participants.find(p => p.character_id === characterId);
    return participant?.character?.name || 'Jogador';
  };

  const getRollStatus = (characterId: string): 'waiting' | 'rolled' => {
    return rolls.some(r => r.character_id === characterId && r.rolled_at) ? 'rolled' : 'waiting';
  };

  const handleCompleteTest = async () => {
    // Mark test as completed
    await supabase
      .from('tests')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', testId);

    // Create event with group result
    await supabase.from('session_events').insert({
      session_id: sessionId,
      event_type: 'group_test_completed',
      event_data: {
        test_id: testId,
        attribute,
        ...groupResult,
      },
    });

    toast({ title: 'Teste de grupo finalizado!' });
  };

  const progress = (rolls.length / expectedPlayers.length) * 100;

  return (
    <Card className="medieval-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-medieval text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          {t.tests.group}: {t.attributes[attribute as keyof typeof t.attributes]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-body">
              {isComplete ? t.tests.allRolled : t.tests.waitingForRolls}
            </span>
            <span className="font-medieval">
              {rolls.length}/{expectedPlayers.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Player Status List */}
        <div className="space-y-2">
          {expectedPlayers.map(charId => {
            const status = getRollStatus(charId);
            const roll = rolls.find(r => r.character_id === charId);
            
            return (
              <div 
                key={charId}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg border",
                  status === 'rolled' 
                    ? "border-green-500/30 bg-green-500/10" 
                    : "border-border bg-muted/30"
                )}
              >
                <span className="font-medieval text-sm">
                  {getCharacterName(charId)}
                </span>
                
                {status === 'waiting' ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Aguardando
                  </Badge>
                ) : isComplete && roll ? (
                  <div className="flex items-center gap-2">
                    {/* Show result only when all have rolled */}
                    <Badge 
                      variant="outline" 
                      className={cn(
                        roll.result === 'success' && 'bg-green-500/20 text-green-500 border-green-500/30',
                        roll.result === 'partial' && 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
                        roll.result === 'failure' && 'bg-red-500/20 text-red-500 border-red-500/30',
                      )}
                    >
                      {roll.result === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {roll.result === 'partial' && <MinusCircle className="w-3 h-3 mr-1" />}
                      {roll.result === 'failure' && <XCircle className="w-3 h-3 mr-1" />}
                      {roll.dice1}+{roll.dice2}={roll.total}
                    </Badge>
                    
                    {roll.has_positive_extreme && (
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    )}
                    {roll.has_negative_extreme && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    {roll.pull_group_used && (
                      <Badge variant="default" className="text-xs">+1</Badge>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="bg-green-500/20 text-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Rolou
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Group Result (shown when complete) */}
        {isComplete && groupResult && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
            <h4 className="font-medieval text-center">{t.tests.groupResult}</h4>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-green-500/10">
                <p className="text-2xl font-medieval text-green-500">{groupResult.successes}</p>
                <p className="text-xs text-muted-foreground">{t.tests.success}</p>
              </div>
              <div className="p-2 rounded bg-yellow-500/10">
                <p className="text-2xl font-medieval text-yellow-500">{groupResult.partials}</p>
                <p className="text-xs text-muted-foreground">{t.tests.partial}</p>
              </div>
              <div className="p-2 rounded bg-red-500/10">
                <p className="text-2xl font-medieval text-red-500">{groupResult.failures}</p>
                <p className="text-xs text-muted-foreground">{t.tests.failure}</p>
              </div>
            </div>

            {groupResult.pullGroupCount > 0 && (
              <p className="text-sm text-center text-muted-foreground">
                +{groupResult.pullGroupCount} de {t.tests.pullGroup}
              </p>
            )}

            <div className={cn(
              "text-center p-3 rounded-lg font-medieval text-lg",
              groupResult.finalResult === 'success' && "bg-green-500/20 text-green-500",
              groupResult.finalResult === 'partial' && "bg-yellow-500/20 text-yellow-500",
              groupResult.finalResult === 'failure' && "bg-red-500/20 text-red-500",
            )}>
              {t.tests[groupResult.finalResult]}
            </div>

            {isNarrator && (
              <Button className="w-full" onClick={handleCompleteTest}>
                Finalizar Teste
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
