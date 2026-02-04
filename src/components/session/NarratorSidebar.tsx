import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Crown, 
  Users, 
  Dices, 
  User,
  Sword,
  Shield,
  Heart,
  Brain,
  Flame,
  Scroll,
  Eye
} from 'lucide-react';
import { GroupTestPanel } from '@/components/dice/GroupTestPanel';
import { ComplicationsNarratorPanel } from '@/components/complications/ComplicationsNarratorPanel';
import { MarksModal } from '@/components/character/MarksModal';
import type { SessionData, Participant, Scene } from '@/pages/Session';

interface NarratorSidebarProps {
  session: SessionData;
  participants: Participant[];
  currentScene: Scene | null;
}

const attributeIcons: Record<string, React.ElementType> = {
  aggression: Sword,
  determination: Shield,
  seduction: Heart,
  cunning: Brain,
  faith: Flame,
};

const attributeKeys = ['aggression', 'determination', 'seduction', 'cunning', 'faith'] as const;

const difficultyLabels: Record<number, string> = {
  [-3]: 'veryEasy',
  [-2]: 'easy',
  [-1]: 'easy',
  [0]: 'normal',
  [1]: 'hard',
  [2]: 'veryHard',
  [3]: 'nearlyImpossible',
};

export function NarratorSidebar({ session, participants, currentScene }: NarratorSidebarProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  
  const [selectedAttribute, setSelectedAttribute] = useState<string>('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<number>(0);
  const [context, setContext] = useState<string>('');
  const [isRequestingTest, setIsRequestingTest] = useState(false);
  const [activeGroupTest, setActiveGroupTest] = useState<{
    id: string;
    attribute: string;
    players: string[];
  } | null>(null);
  
  // State for viewing player marks
  const [viewingMarksFor, setViewingMarksFor] = useState<Participant | null>(null);

  // Check for active group tests
  useEffect(() => {
    const fetchActiveGroupTest = async () => {
      const { data: tests } = await supabase
        .from('tests')
        .select('id, attribute, status, test_type')
        .eq('session_id', session.id)
        .eq('status', 'pending')
        .eq('test_type', 'group')
        .order('created_at', { ascending: false })
        .limit(1);

      if (tests && tests.length > 0) {
        // Get the expected players from the event
        const { data: events } = await supabase
          .from('session_events')
          .select('event_data')
          .eq('session_id', session.id)
          .eq('event_type', 'test_requested')
          .order('created_at', { ascending: false })
          .limit(10);

        const testEvent = events?.find(e => 
          (e.event_data as any)?.test_id === tests[0].id
        );
        
        const players = (testEvent?.event_data as any)?.players || [];
        
        setActiveGroupTest({
          id: tests[0].id,
          attribute: tests[0].attribute,
          players,
        });
      } else {
        setActiveGroupTest(null);
      }
    };

    fetchActiveGroupTest();

    // Subscribe to test updates
    const channel = supabase
      .channel(`narrator-tests-${session.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tests', filter: `session_id=eq.${session.id}` },
        () => fetchActiveGroupTest()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id]);

  const handleRequestTest = async () => {
    if (!selectedAttribute || selectedPlayers.length === 0 || !currentScene) {
      toast({
        title: 'Selecione atributo e jogadores',
        variant: 'destructive',
      });
      return;
    }

    setIsRequestingTest(true);

    try {
      // Create test
      const { data: test, error } = await supabase
        .from('tests')
        .insert({
          session_id: session.id,
          scene_id: currentScene.id,
          attribute: selectedAttribute,
          test_type: selectedPlayers.length > 1 ? 'group' : 'individual',
          created_by: session.narrator_id,
          difficulty: difficulty,
          context: context.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Get character names for the event
      const playerNames = selectedPlayers.map((charId) => {
        const participant = participants.find(p => p.character?.id === charId);
        return participant?.character?.name || 'Jogador';
      });

      // Add event
      await supabase.from('session_events').insert({
        session_id: session.id,
        scene_id: currentScene.id,
        event_type: 'test_requested',
        event_data: {
          test_id: test.id,
          attribute: selectedAttribute,
          difficulty: difficulty,
          players: selectedPlayers,
          player_names: playerNames,
          context: context.trim() || null,
          scene_name: currentScene.name,
        },
      });

      toast({ title: 'Teste solicitado!', duration: 2000 });
      setSelectedAttribute('');
      setSelectedPlayers([]);
      setDifficulty(0);
      setContext('');
    } catch (error: any) {
      toast({ title: 'Erro ao solicitar teste', variant: 'destructive' });
    } finally {
      setIsRequestingTest(false);
    }
  };

  const togglePlayer = (charId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(charId)
        ? prev.filter((id) => id !== charId)
        : [...prev, charId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Narrator Badge */}
      <div className="flex items-center gap-2 text-primary">
        <Crown className="w-5 h-5" />
        <span className="font-medieval">{t.roles.narrator}</span>
      </div>

      {/* Active Group Test Panel */}
      {activeGroupTest && (
        <GroupTestPanel
          testId={activeGroupTest.id}
          sessionId={session.id}
          attribute={activeGroupTest.attribute}
          expectedPlayers={activeGroupTest.players}
          participants={participants}
          isNarrator={true}
        />
      )}

      {/* Request Test Card */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Dices className="w-4 h-4 text-primary" />
            {t.tests.request}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Attribute Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medieval text-muted-foreground">
              {t.tests.selectAttribute}
            </Label>
            <Select value={selectedAttribute} onValueChange={setSelectedAttribute}>
              <SelectTrigger className="font-body">
                <SelectValue placeholder="Escolha o atributo" />
              </SelectTrigger>
              <SelectContent>
                {attributeKeys.map((attr) => {
                  const Icon = attributeIcons[attr];
                  return (
                    <SelectItem key={attr} value={attr}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{t.attributes[attr]}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medieval text-muted-foreground">
              {t.tests.difficulty}: {t.tests[difficultyLabels[difficulty] as keyof typeof t.tests] || 'Normal'}
            </Label>
            <Slider
              value={[difficulty]}
              onValueChange={([val]) => setDifficulty(val)}
              min={-3}
              max={3}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-3</span>
              <span>0</span>
              <span>+3</span>
            </div>
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label className="text-sm font-medieval text-muted-foreground">
              {t.tests.context}
            </Label>
            <Input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={t.tests.contextPlaceholder}
              className="font-body text-sm"
            />
          </div>

          {/* Player Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medieval text-muted-foreground">
              {t.tests.selectPlayers}
            </Label>
            <div className="space-y-2">
              {participants.map((p) => {
                if (!p.character) return null;
                const isSelected = selectedPlayers.includes(p.character.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlayer(p.character!.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medieval text-sm flex-1">
                      {p.character.name}
                    </span>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        ✓
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Request Button */}
          <Button
            className="w-full font-medieval"
            onClick={handleRequestTest}
            disabled={!selectedAttribute || selectedPlayers.length === 0 || !currentScene || isRequestingTest}
          >
            <Dices className="w-4 h-4 mr-2" />
            {t.tests.request}
          </Button>

          {!currentScene && (
            <p className="text-xs text-muted-foreground text-center">
              Crie uma cena primeiro
            </p>
          )}
        </CardContent>
      </Card>

      {/* Connected Players */}
      <Card className="medieval-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-medieval text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {t.session.connectedPlayers}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum jogador conectado
            </p>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => {
                const minorMarksCount = p.character?.minor_marks?.length || 0;
                const majorMarksCount = (p.character?.major_marks as any[])?.length || 0;
                const epicMarksCount = ((p.character as any)?.epic_marks as any[])?.length || 0;
                const totalMarks = minorMarksCount + majorMarksCount + epicMarksCount;
                
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <User className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medieval text-sm truncate">
                        {p.character?.name || 'Sem personagem'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.profile?.display_name || 'Jogador'}
                      </p>
                    </div>
                    {p.character && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 gap-1 shrink-0"
                        onClick={() => setViewingMarksFor(p)}
                        title="Ver marcas do jogador"
                      >
                        <Scroll className="w-3 h-3" />
                        <span className="text-xs">{totalMarks}</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complications Panel */}
      <ComplicationsNarratorPanel 
        sessionId={session.id}
        participants={participants}
      />

      {/* Marks Modal for viewing player marks */}
      {viewingMarksFor?.character && (
        <MarksModal
          open={!!viewingMarksFor}
          onOpenChange={(open) => !open && setViewingMarksFor(null)}
          minorMarkIds={viewingMarksFor.character.minor_marks || []}
          majorMarks={(viewingMarksFor.character.major_marks as any[]) || []}
          epicMarks={((viewingMarksFor.character as any).epic_marks as any[]) || []}
          negativeMarks={((viewingMarksFor.character as any).negative_marks as any[]) || []}
        />
      )}
    </div>
  );
}
