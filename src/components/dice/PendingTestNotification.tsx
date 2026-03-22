import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TestRequestModal } from './TestRequestModal';
import { Dices, AlertCircle } from 'lucide-react';
import type { AttributeType } from '@/lib/dice/extremeTable';

interface PendingTest {
  id: string;
  attribute: string;
  difficulty: number;
  context: string | null;
  test_type: string;
}

interface PendingTestNotificationProps {
  sessionId: string;
  characterId: string;
  sceneId: string;
  sceneName: string;
  character: {
    aggression_type: string;
    determination_type: string;
    seduction_type: string;
    cunning_type: string;
    faith_type: string;
  };
}

export function PendingTestNotification({ sessionId, characterId, sceneId, sceneName, character }: PendingTestNotificationProps) {
  const { t } = useI18n();
  const [pendingTests, setPendingTests] = useState<PendingTest[]>([]);
  const [activeTest, setActiveTest] = useState<PendingTest | null>(null);
  const [rolledTestIds, setRolledTestIds] = useState<Set<string>>(new Set());

  // Refs para controlar estado do modal de forma estável (sem re-renders)
  const isModalOpenRef = useRef(false);
  const rolledTestIdsRef = useRef<Set<string>>(new Set());

  // Fetch pending tests
  useEffect(() => {
    // Não executar fetch se o modal estiver aberto
    if (isModalOpenRef.current) return;

    const fetchPendingTests = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Get tests that are pending for this session
      const { data: tests } = await supabase
        .from('tests')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'pending');

      if (!tests || tests.length === 0) {
        setPendingTests([]);
        return;
      }

      // Get test_requested events to find which characters each test targets
      const { data: testEvents } = await supabase
        .from('session_events')
        .select('event_data')
        .eq('session_id', sessionId)
        .eq('event_type', 'test_requested');

      // Build a map of test_id -> targeted character IDs
      const testTargetMap = new Map<string, string[]>();
      (testEvents || []).forEach(e => {
        const data = e.event_data as any;
        if (data?.test_id && data?.players) {
          testTargetMap.set(data.test_id, data.players);
        }
      });

      // Filter tests that target this character
      const myTests = tests.filter(test => {
        const targets = testTargetMap.get(test.id);
        // If no target info found, show to all (backwards compat)
        if (!targets) return true;
        return targets.includes(characterId);
      });

      // Check which tests the user has already rolled
      const { data: rolls } = await supabase
        .from('test_rolls')
        .select('test_id')
        .eq('user_id', user.user.id);

      const rolledIds = new Set((rolls || []).map(r => r.test_id));
      
      // Merge com IDs marcados localmente
      rolledTestIdsRef.current.forEach(id => rolledIds.add(id));
      rolledTestIdsRef.current = rolledIds;
      setRolledTestIds(rolledIds);

      // Filter tests that haven't been rolled yet
      const pending = myTests.filter(test => !rolledIds.has(test.id));
      setPendingTests(pending);
    };

    fetchPendingTests();

    // Subscribe to new tests
    const channel = supabase
      .channel(`pending-tests-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tests', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          // Ignorar se modal estiver aberto
          if (isModalOpenRef.current) return;
          
          const newTest = payload.new as PendingTest;
          if (!rolledTestIdsRef.current.has(newTest.id)) {
            setPendingTests(prev => [...prev, newTest]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tests', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as PendingTest & { status: string };
          if (updated.status === 'completed') {
            setPendingTests(prev => prev.filter(t => t.id !== updated.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]); // REMOVIDO rolledTestIds das dependências

  const getAttributeType = (attribute: string): AttributeType => {
    const key = `${attribute}_type` as keyof typeof character;
    return (character[key] as AttributeType) || 'neutral';
  };

  // Função para abrir o modal de teste
  const handleOpenTest = (test: PendingTest) => {
    isModalOpenRef.current = true;
    setActiveTest(test);
  };

  // Called when user manually closes the modal
  const handleCloseModal = () => {
    if (activeTest) {
      // Marcar como rolado
      const newRolled = new Set(rolledTestIdsRef.current);
      newRolled.add(activeTest.id);
      rolledTestIdsRef.current = newRolled;
      setRolledTestIds(newRolled);
      
      // Remover da lista de pendentes
      setPendingTests(prev => prev.filter(t => t.id !== activeTest.id));
    }
    isModalOpenRef.current = false;
    setActiveTest(null);
  };

  if (pendingTests.length === 0) return null;

  return (
    <>
      <Card className="medieval-card border-primary/50 animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-primary" />
            <span className="font-medieval text-primary">
              {pendingTests.length} teste{pendingTests.length > 1 ? 's' : ''} pendente{pendingTests.length > 1 ? 's' : ''}!
            </span>
          </div>
          
          <div className="space-y-2">
            {pendingTests.map((test) => (
              <Button
                key={test.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleOpenTest(test)}
              >
                <Dices className="w-4 h-4 mr-2" />
                <span className="font-medieval">
                  {t.attributes[test.attribute as keyof typeof t.attributes]}
                </span>
                {test.context && (
                  <span className="text-xs text-muted-foreground ml-2 truncate">
                    - {test.context}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeTest && (
        <TestRequestModal
          testId={activeTest.id}
          sessionId={sessionId}
          sceneId={sceneId}
          sceneName={sceneName}
          attribute={activeTest.attribute}
          attributeType={getAttributeType(activeTest.attribute)}
          difficulty={activeTest.difficulty}
          context={activeTest.context || undefined}
          characterId={characterId}
          isGroupTest={activeTest.test_type === 'group'}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
