import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import VampireTestRequestModal, { TestConfig } from '@/components/session/vampire/VampireTestRequestModal';
import { VampireNarratorSidebar } from '@/components/session/vampire/VampireNarratorSidebar';
import { VampireEventFeed } from '@/components/session/vampire/VampireEventFeed';
import { VampirePendingTest } from '@/components/session/vampire/VampirePendingTest';
import { VampireTrackers } from '@/components/session/vampire/VampireTrackers';
import { 
  Moon, 
  Users, 
  BookOpen, 
  Scroll, 
  Dices, 
  User, 
  LogOut,
  Droplets,
  Heart,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';

interface SessionData {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  narrator_id: string;
  status: string;
  current_scene_id: string | null;
  game_system: string;
}

interface Scene {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  session_id: string;
}

interface SessionEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
  scene_id: string | null;
  session_id: string;
}

interface VampiroCharacterData {
  player?: string;
  chronicle?: string;
  clan?: string;
  generation?: string;
  attributes?: {
    physical: { strength: number; dexterity: number; stamina: number };
    social: { charisma: number; manipulation: number; appearance: number };
    mental: { perception: number; intelligence: number; wits: number };
  };
  disciplines?: Record<string, number>;
  humanity?: number;
  willpower?: number;
}

interface Participant {
  id: string;
  user_id: string;
  character_id: string | null;
  session_blood_pool?: number;
  session_willpower_current?: number;
  session_health_damage?: boolean[];
  character?: {
    id: string;
    name: string;
    concept: string | null;
    game_system: string;
    vampiro_data: VampiroCharacterData | null;
  } | null;
  profile?: {
    display_name: string | null;
  } | null;
}

export default function VampireSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useI18n();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [session, setSession] = useState<SessionData | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const isNarrator = session?.narrator_id === user?.id;

  // Fetch session data
  useEffect(() => {
    if (!sessionId || !user) return;

    const fetchSessionData = async () => {
      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        toast({ title: 'Sessão não encontrada', variant: 'destructive' });
        navigate('/dashboard');
        return;
      }

      // Verify it's a vampire session
      if (sessionData.game_system !== 'vampiro_v3') {
        toast({ title: 'Esta não é uma sessão de Vampiro', variant: 'destructive' });
        navigate(`/session/${sessionId}`);
        return;
      }

      // Redirect to lobby if not active
      if (sessionData.status !== 'active') {
        navigate(`/session/${sessionId}/lobby`);
        return;
      }

      setSession(sessionData);

      // Fetch scenes
      const { data: scenesData } = await supabase
        .from('scenes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      setScenes(scenesData || []);

      // Set current scene
      if (sessionData.current_scene_id) {
        const current = scenesData?.find(s => s.id === sessionData.current_scene_id);
        setCurrentScene(current || null);
      }

      // Fetch events
      const { data: eventsData } = await supabase
        .from('session_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50);

      setEvents((eventsData || []) as SessionEvent[]);

      // Fetch participants
      await fetchParticipants();

      setLoading(false);
    };

    const fetchParticipants = async () => {
      const { data: participantsData } = await supabase
        .from('session_participants')
        .select(`
          id,
          user_id,
          character_id,
          session_blood_pool,
          session_willpower_current,
          session_health_damage,
          characters:character_id (
            id,
            name,
            concept,
            game_system,
            vampiro_data
          )
        `)
        .eq('session_id', sessionId);

      if (participantsData) {
        const withProfiles = await Promise.all(
          participantsData.map(async (p) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', p.user_id)
              .maybeSingle();

            return {
              ...p,
              session_health_damage: (p.session_health_damage as boolean[] | null) || [false, false, false, false, false, false, false],
              character: p.characters as Participant['character'],
              profile,
            };
          })
        );
        setParticipants(withProfiles);
      }
    };

    fetchSessionData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`vampire-session-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as SessionData;
          setSession(updated);
          if (updated.status === 'completed') {
            toast({ title: 'Sessão encerrada pelo Narrador' });
            navigate('/dashboard');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scenes', filter: `session_id=eq.${sessionId}` },
        () => {
          supabase
            .from('scenes')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .then(({ data }) => {
              setScenes(data || []);
              if (session?.current_scene_id) {
                const current = data?.find(s => s.id === session.current_scene_id);
                setCurrentScene(current || null);
              }
            });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_events', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setEvents((prev) => [payload.new as SessionEvent, ...prev].slice(0, 50));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_participants', filter: `session_id=eq.${sessionId}` },
        () => fetchParticipants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, user, navigate, toast]);

  // Update current scene when session changes
  useEffect(() => {
    if (session?.current_scene_id && scenes.length > 0) {
      const current = scenes.find(s => s.id === session.current_scene_id);
      setCurrentScene(current || null);
    }
  }, [session?.current_scene_id, scenes]);

  const handleEndSession = async () => {
    if (!session) return;

    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', session.id);

    toast({ title: 'Sessão encerrada' });
    navigate('/dashboard');
  };

  const handleLeaveSession = () => {
    navigate('/dashboard');
  };

  // Get player's character
  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const myCharacter = myParticipant?.character;
  const myVampiroData = myCharacter?.vampiro_data;

  // Find pending test for this player
  const pendingTestEvent = events.find((e) => {
    if (e.event_type !== 'vampire_test_requested') return false;
    const config = e.event_data as unknown as TestConfig;
    if (!myCharacter) return false;
    return config.targetCharacterIds?.includes(myCharacter.id);
  });

  // Check if player already rolled for this test
  const hasRolledForPendingTest = pendingTestEvent
    ? events.some(
        (e) =>
          e.event_type === 'vampire_test_result' &&
          (e.event_data as Record<string, unknown>).test_event_id === pendingTestEvent.id &&
          (e.event_data as Record<string, unknown>).character_id === myCharacter?.id
      )
    : false;

  // Test request modal state
  const [testModalOpen, setTestModalOpen] = useState(false);

  const handleRequestTest = async (config: TestConfig) => {
    if (!sessionId) return;
    
    // Create test request event
    await supabase.from('session_events').insert([{
      session_id: sessionId,
      scene_id: currentScene?.id || null,
      event_type: 'vampire_test_requested',
      event_data: JSON.parse(JSON.stringify(config)),
    }]);

    toast({
      title: t.vampiroTests.requestTest,
      description: `${config.testType} - ${t.vampiroTests.difficulty}: ${config.difficulty}`,
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-destructive font-medieval text-2xl flex items-center gap-3">
          <Moon className="w-8 h-8" />
          {t.common.loading}
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Desktop layout
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Vampire Session Header */}
      <header className="border-b border-destructive/20 bg-gradient-to-r from-destructive/10 to-background px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Moon className="w-6 h-6 text-destructive" />
              <h1 className="font-medieval text-xl text-foreground">{session.name}</h1>
            </div>
            <Badge variant="outline" className="border-destructive/30 text-destructive">
              Vampiro: A Máscara
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* Participants count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{participants.length} {language === 'pt-BR' ? 'jogadores' : 'players'}</span>
            </div>

            {/* Current scene */}
            {currentScene && (
              <Badge variant="secondary" className="font-body">
                <BookOpen className="w-3 h-3 mr-1" />
                {currentScene.name}
              </Badge>
            )}

            {/* Actions */}
            {isNarrator ? (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleEndSession}
              >
                <LogOut className="w-4 h-4 mr-1" />
                {language === 'pt-BR' ? 'Encerrar' : 'End Session'}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLeaveSession}
              >
                <LogOut className="w-4 h-4 mr-1" />
                {language === 'pt-BR' ? 'Sair' : 'Leave'}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      {isMobile ? (
        // Mobile layout with tabs
        <Tabs defaultValue="scene" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-4 mx-4 mt-2">
            <TabsTrigger value="scene" className="font-medieval text-xs">
              <BookOpen className="w-4 h-4 mr-1" />
              Cena
            </TabsTrigger>
            <TabsTrigger value="events" className="font-medieval text-xs">
              <Scroll className="w-4 h-4 mr-1" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="blood" className="font-medieval text-xs">
              <Droplets className="w-4 h-4 mr-1" />
              Sangue
            </TabsTrigger>
            <TabsTrigger value="character" className="font-medieval text-xs">
              <User className="w-4 h-4 mr-1" />
              Ficha
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scene" className="flex-1 p-4 overflow-auto">
            <VampireScenePanel 
              currentScene={currentScene}
              scenes={scenes}
              isNarrator={isNarrator}
            />
          </TabsContent>

          <TabsContent value="events" className="flex-1 p-4 overflow-auto">
            <VampireEventFeed events={events} />
          </TabsContent>

          <TabsContent value="blood" className="flex-1 p-4 overflow-auto">
            {myParticipant && myCharacter && (
              <VampireTrackers
                participantId={myParticipant.id}
                character={myCharacter}
                initialBloodPool={myParticipant.session_blood_pool || 0}
                initialWillpower={myParticipant.session_willpower_current || 0}
                initialHealthDamage={myParticipant.session_health_damage || [false, false, false, false, false, false, false]}
              />
            )}
          </TabsContent>

          <TabsContent value="character" className="flex-1 p-4 overflow-auto">
             {isNarrator ? (
              <VampireNarratorSidebar 
                sessionId={sessionId!}
                participants={participants}
                scenes={scenes}
                currentScene={currentScene}
                onRequestTest={() => setTestModalOpen(true)}
                onSceneChange={setCurrentScene}
              />
            ) : (
              <div className="space-y-4">
                {/* Pending Test */}
                {pendingTestEvent && !hasRolledForPendingTest && myCharacter && myVampiroData && (
                  <VampirePendingTest
                    sessionId={sessionId!}
                    sceneId={currentScene?.id || null}
                    characterId={myCharacter.id}
                    characterName={myCharacter.name}
                    vampiroData={myVampiroData}
                    testEvent={{
                      id: pendingTestEvent.id,
                      event_data: pendingTestEvent.event_data as unknown as TestConfig,
                      created_at: pendingTestEvent.created_at,
                    }}
                    onTestComplete={() => {}}
                  />
                )}
                <VampirePlayerPanel character={myCharacter} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        // Desktop layout
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Character/Narrator Panel */}
          <aside className="w-80 border-r border-destructive/20 bg-gradient-to-b from-destructive/5 to-background overflow-auto">
            <ScrollArea className="h-full p-4">
              {isNarrator ? (
                <VampireNarratorSidebar 
                  sessionId={sessionId!}
                  participants={participants}
                  scenes={scenes}
                  currentScene={currentScene}
                  onRequestTest={() => setTestModalOpen(true)}
                  onSceneChange={setCurrentScene}
                />
              ) : (
                <div className="space-y-4">
                  {/* Pending Test */}
                  {pendingTestEvent && !hasRolledForPendingTest && myCharacter && myVampiroData && (
                    <VampirePendingTest
                      sessionId={sessionId!}
                      sceneId={currentScene?.id || null}
                      characterId={myCharacter.id}
                      characterName={myCharacter.name}
                      vampiroData={myVampiroData}
                      testEvent={{
                        id: pendingTestEvent.id,
                        event_data: pendingTestEvent.event_data as unknown as TestConfig,
                        created_at: pendingTestEvent.created_at,
                      }}
                      onTestComplete={() => {}}
                    />
                  )}
                  <VampirePlayerPanel character={myCharacter} />
                </div>
              )}
            </ScrollArea>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 grid grid-rows-[1fr_2fr] gap-4 p-4 overflow-hidden">
              {/* Scene Panel */}
              <div className="overflow-auto min-h-0">
                <VampireScenePanel 
                  currentScene={currentScene}
                  scenes={scenes}
                  isNarrator={isNarrator}
                />
              </div>

              {/* Event Feed */}
              <div className="overflow-auto min-h-0">
                <VampireEventFeed events={events} />
              </div>
            </div>
          </main>

          {/* Right Sidebar - Blood/Willpower Tracker */}
          <aside className="w-72 border-l border-destructive/20 bg-gradient-to-b from-destructive/5 to-background overflow-auto">
            <ScrollArea className="h-full p-4">
              {myParticipant && myCharacter && (
                <VampireTrackers
                  participantId={myParticipant.id}
                  character={myCharacter}
                  initialBloodPool={myParticipant.session_blood_pool || 0}
                  initialWillpower={myParticipant.session_willpower_current || 0}
                  initialHealthDamage={myParticipant.session_health_damage || [false, false, false, false, false, false, false]}
                />
              )}
            </ScrollArea>
          </aside>
        </div>
      )}

      {/* Test Request Modal */}
      <VampireTestRequestModal
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
        participants={participants}
        onRequestTest={handleRequestTest}
      />
    </div>
  );
}

// Vampire Scene Panel Component
function VampireScenePanel({ 
  currentScene, 
  scenes, 
  isNarrator 
}: { 
  currentScene: Scene | null; 
  scenes: Scene[];
  isNarrator: boolean;
}) {
  const { language } = useI18n();

  return (
    <Card className="medieval-card border-destructive/20 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="font-medieval flex items-center gap-2 text-destructive">
          <BookOpen className="w-5 h-5" />
          {language === 'pt-BR' ? 'Cena Atual' : 'Current Scene'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentScene ? (
          <div className="space-y-3">
            <h3 className="font-medieval text-lg">{currentScene.name}</h3>
            {currentScene.description && (
              <p className="text-muted-foreground font-body text-sm">
                {currentScene.description}
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8 font-body">
            {language === 'pt-BR' ? 'Nenhuma cena ativa' : 'No active scene'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// VampireBloodTracker was replaced by VampireTrackers component

// VampireNarratorPanel was replaced by VampireNarratorSidebar component

// Vampire Player Panel Component
function VampirePlayerPanel({ character }: { character: Participant['character'] }) {
  const { t, language } = useI18n();
  const vampiroData = character?.vampiro_data;

  if (!character) {
    return (
      <Card className="medieval-card border-destructive/20">
        <CardContent className="py-8 text-center">
          <Moon className="w-12 h-12 mx-auto mb-3 text-destructive/30" />
          <p className="text-muted-foreground font-body">
            {language === 'pt-BR' ? 'Nenhum personagem selecionado' : 'No character selected'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Character Header */}
      <Card className="medieval-card border-destructive/20">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/30">
              <Moon className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-medieval text-lg">{character.name}</h3>
              {vampiroData?.clan && (
                <Badge variant="outline" className="border-destructive/30 text-destructive text-xs">
                  {vampiroData.clan}
                </Badge>
              )}
            </div>
          </div>
          {character.concept && (
            <p className="text-sm text-muted-foreground mt-2 font-body">
              {character.concept}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {vampiroData && (
        <Card className="medieval-card border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-medieval text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-destructive" />
              {t.vampiro.humanity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-0.5 justify-center">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 ${
                    i < (vampiroData.humanity || 1)
                      ? 'bg-foreground border-foreground'
                      : 'bg-transparent border-muted-foreground/40'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">
              {vampiroData.humanity || 1}/10
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
