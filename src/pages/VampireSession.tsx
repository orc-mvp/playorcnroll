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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import VampireTestRequestModal, { TestConfig } from '@/components/session/vampire/VampireTestRequestModal';
import { VampireNarratorSidebar } from '@/components/session/vampire/VampireNarratorSidebar';
import { VampireEventFeed } from '@/components/session/vampire/VampireEventFeed';
import { VampirePendingTest } from '@/components/session/vampire/VampirePendingTest';
import { MobilePendingTestDrawer } from '@/components/session/vampire/MobilePendingTestDrawer';
import { VampireTrackers } from '@/components/session/vampire/VampireTrackers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserMenu } from '@/components/UserMenu';
import { SessionInfoModal } from '@/components/session/SessionInfoModal';
import { ManagePlayersModal } from '@/components/session/vampire/ManagePlayersModal';
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
  Link,
  Plus,
  History,
  ChevronDown,
  Eye,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import VampiroCharacterSheet from '@/components/character/vampiro/VampiroCharacterSheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  experience_points?: number;
  sheet_locked?: boolean;
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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showManagePlayersModal, setShowManagePlayersModal] = useState(false);

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
        toast({ title: t.session.sessionNotFound, variant: 'destructive' });
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
          sheet_locked,
          experience_points,
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

            const character = p.characters as Participant['character'];
            let bloodPool = p.session_blood_pool ?? 0;
            let willpower = p.session_willpower_current ?? 0;
            let healthDamage = (p.session_health_damage as boolean[] | null) || [false, false, false, false, false, false, false];

            // Auto-initialize tracker values for vampire characters with zero values
            if (character?.game_system === 'vampiro_v3' && character.vampiro_data) {
              const vampiroData = character.vampiro_data as VampiroCharacterData;
              const needsInit = bloodPool === 0 && willpower === 0;

              if (needsInit) {
                // Calculate initial blood pool based on generation
                const generation = parseInt(vampiroData.generation || '13', 10);
                if (generation <= 7) bloodPool = 20;
                else if (generation === 8) bloodPool = 15;
                else if (generation <= 10) bloodPool = 13;
                else if (generation <= 12) bloodPool = 11;
                else bloodPool = 10;

                // Willpower starts at max
                willpower = vampiroData.willpower || 1;

                // Update database with initialized values
                await supabase
                  .from('session_participants')
                  .update({
                    session_blood_pool: bloodPool,
                    session_willpower_current: willpower,
                    session_health_damage: healthDamage,
                  })
                  .eq('id', p.id);
              }
            }

            return {
              ...p,
              session_blood_pool: bloodPool,
              session_willpower_current: willpower,
              session_health_damage: healthDamage,
              character,
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
            toast({ title: t.vampireSession.sessionEndedByNarrator });
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
          const newEvent = payload.new as SessionEvent;
          setEvents((prev) => {
            // Replace local optimistic event or prepend
            const localIndex = prev.findIndex(
              (e) =>
                e.id.startsWith('local-') &&
                e.event_type === newEvent.event_type &&
                (e.event_data as any).character_name === (newEvent.event_data as any).character_name &&
                (e.event_data as any).tracker_type === (newEvent.event_data as any).tracker_type
            );
            if (localIndex >= 0) {
              const updated = [...prev];
              updated[localIndex] = newEvent;
              return updated;
            }
            return [newEvent, ...prev].slice(0, 50);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_participants', filter: `session_id=eq.${sessionId}` },
        () => fetchParticipants()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'characters' },
        () => fetchParticipants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user?.id]);

  // Fallback polling for events (every 4s) to ensure both narrator and players see updates even if realtime misses
  useEffect(() => {
    if (!sessionId) return;

    const pollInterval = setInterval(async () => {
      const { data: latestEvents } = await supabase
        .from('session_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (latestEvents) {
        setEvents(latestEvents as SessionEvent[]);
      }
    }, 4000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

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

    toast({ title: t.vampireSession.sessionEnded });
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
  const [showPendingTestDrawer, setShowPendingTestDrawer] = useState(false);

  // Auto-open drawer when pending test arrives on mobile
  useEffect(() => {
    if (pendingTestEvent && !hasRolledForPendingTest && isMobile) {
      setShowPendingTestDrawer(true);
    }
  }, [pendingTestEvent, hasRolledForPendingTest, isMobile]);

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

  // Handle optimistic local event insertion (narrator changes)
  const handleLocalEvent = (eventPartial: { event_type: string; event_data: Record<string, unknown>; scene_id: string | null; session_id: string }) => {
    const localEvent: SessionEvent = {
      id: `local-${Date.now()}`,
      ...eventPartial,
      created_at: new Date().toISOString(),
    };
    setEvents((prev) => {
      // Avoid duplicate if realtime already delivered it
      const isDuplicate = prev.some(
        (e) =>
          e.event_type === localEvent.event_type &&
          (e.event_data as any).character_name === (localEvent.event_data as any).character_name &&
          (e.event_data as any).tracker_type === (localEvent.event_data as any).tracker_type &&
          Math.abs(new Date(e.created_at).getTime() - new Date(localEvent.created_at).getTime()) < 3000
      );
      if (isDuplicate) return prev;
      return [localEvent, ...prev].slice(0, 50);
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
            <button
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={() => setShowInfoModal(true)}
            >
              <Moon className="w-6 h-6 text-destructive" />
              <h1 className="font-medieval text-xl text-foreground underline-offset-4 hover:underline decoration-destructive/30">{session.name}</h1>
            </button>
            <Badge variant="outline" className="border-destructive/30 text-destructive">
              Vampiro: A Máscara
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* Participants count - clickable for narrator */}
            {isNarrator ? (
              <button
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowManagePlayersModal(true)}
              >
                <Users className="w-4 h-4" />
                <span className="underline-offset-4 hover:underline">{participants.length} {t.vampireSession.players}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{participants.length} {t.vampireSession.players}</span>
              </div>
            )}


            {/* Actions */}
            {isNarrator && (
              <div className="flex items-center gap-2">
                {/* Invite Code Badge */}
                <Badge variant="outline" className="font-mono text-xs border-destructive/30">
                  {session.invite_code}
                </Badge>
                
                {/* Copy Link Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const url = `${window.location.origin}/join/${session.invite_code}`;
                          navigator.clipboard.writeText(url);
                          toast({ title: t.vampireSession.linkCopied });
                        }}
                      >
                        <Link className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t.vampireSession.copyInviteLink}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            <UserMenu extraItems={[
              isNarrator
                ? {
                    label: t.vampireSession.endSession,
                    icon: <LogOut className="w-4 h-4" />,
                    onClick: handleEndSession,
                    variant: 'destructive' as const,
                  }
                : {
                    label: t.vampireSession.leave,
                    icon: <LogOut className="w-4 h-4" />,
                    onClick: handleLeaveSession,
                    variant: 'destructive' as const,
                  },
            ]} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      {isMobile ? (
        // Mobile layout with tabs
        <>
          <Tabs defaultValue="feed" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-3 mx-4 mt-2">
              <TabsTrigger value="feed" className="font-medieval text-xs">
                <Scroll className="w-4 h-4 mr-1" />
                {t.mobile.tabFeed}
              </TabsTrigger>
              <TabsTrigger value="trackers" className="font-medieval text-xs">
                <Droplets className="w-4 h-4 mr-1" />
                {t.mobile.tabTrackers}
              </TabsTrigger>
              <TabsTrigger value="info" className="font-medieval text-xs">
                <User className="w-4 h-4 mr-1" />
                {t.mobile.tabInfo}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="flex-1 p-4 overflow-auto">
              <VampireEventFeed events={events} />
            </TabsContent>

            <TabsContent value="trackers" className="flex-1 p-4 overflow-auto">
              {myParticipant && myCharacter ? (
                <VampireTrackers
                  participantId={myParticipant.id}
                  sessionId={sessionId!}
                  sceneId={currentScene?.id || null}
                  character={myCharacter}
                  initialBloodPool={myParticipant.session_blood_pool || 0}
                  initialWillpower={myParticipant.session_willpower_current || 0}
                  initialHealthDamage={myParticipant.session_health_damage || [false, false, false, false, false, false, false]}
                />
              ) : !isNarrator && myParticipant && !myCharacter ? (
                <NoCharacterCard inviteCode={session?.invite_code} />
              ) : null}
            </TabsContent>

            <TabsContent value="info" className="flex-1 p-4 overflow-auto">
              <div className="space-y-4">
                <VampireScenePanel 
                  sessionId={sessionId!}
                  currentScene={currentScene}
                  scenes={scenes}
                  isNarrator={isNarrator}
                  onSceneChange={setCurrentScene}
                />
                {isNarrator ? (
                  <VampireNarratorSidebar 
                    sessionId={sessionId!}
                    participants={participants}
                    scenes={scenes}
                    currentScene={currentScene}
                    onRequestTest={() => setTestModalOpen(true)}
                    onSceneChange={setCurrentScene}
                    onEventCreated={handleLocalEvent}
                  />
                ) : (
                  <VampirePlayerPanel character={myCharacter} experiencePoints={myParticipant?.experience_points} sessionTrackers={{ bloodPool: myParticipant?.session_blood_pool ?? 0, willpower: myParticipant?.session_willpower_current ?? 0, healthDamage: myParticipant?.session_health_damage as boolean[] ?? [false,false,false,false,false,false,false] }} sheetLocked={myParticipant?.sheet_locked ?? true} />
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* FAB for Pending Test - only mobile, bottom-left, z-40 */}
          {!isNarrator && pendingTestEvent && !hasRolledForPendingTest && (
            <button
              onClick={() => setShowPendingTestDrawer(true)}
              className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg animate-pulse flex items-center justify-center"
            >
              <Dices className="w-6 h-6" />
            </button>
          )}

          {/* Pending Test Drawer - mobile only */}
          {!isNarrator && pendingTestEvent && !hasRolledForPendingTest && myCharacter && myVampiroData && (
            <MobilePendingTestDrawer
              open={showPendingTestDrawer}
              onOpenChange={setShowPendingTestDrawer}
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
            />
          )}
        </>
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
                  onEventCreated={handleLocalEvent}
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
                  <VampirePlayerPanel character={myCharacter} experiencePoints={myParticipant?.experience_points} sessionTrackers={{ bloodPool: myParticipant?.session_blood_pool ?? 0, willpower: myParticipant?.session_willpower_current ?? 0, healthDamage: myParticipant?.session_health_damage as boolean[] ?? [false,false,false,false,false,false,false] }} sheetLocked={myParticipant?.sheet_locked ?? true} />
                </div>
              )}
            </ScrollArea>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 grid grid-rows-[auto_1fr] gap-4 p-4 overflow-hidden">
              {/* Scene Panel */}
              <div className="overflow-auto min-h-0">
                <VampireScenePanel 
                  sessionId={sessionId!}
                  currentScene={currentScene}
                  scenes={scenes}
                  isNarrator={isNarrator}
                  onSceneChange={setCurrentScene}
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
              {myParticipant && myCharacter ? (
                <VampireTrackers
                  participantId={myParticipant.id}
                  sessionId={sessionId!}
                  sceneId={currentScene?.id || null}
                  character={myCharacter}
                  initialBloodPool={myParticipant.session_blood_pool || 0}
                  initialWillpower={myParticipant.session_willpower_current || 0}
                  initialHealthDamage={myParticipant.session_health_damage || [false, false, false, false, false, false, false]}
                />
              ) : !isNarrator && myParticipant && !myCharacter ? (
                <NoCharacterCard inviteCode={session?.invite_code} />
              ) : null}
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

      <SessionInfoModal
        open={showInfoModal}
        onOpenChange={setShowInfoModal}
        session={session}
        isNarrator={isNarrator}
        onSessionUpdate={(updates) => setSession(prev => prev ? { ...prev, ...updates } : prev)}
      />

      {isNarrator && sessionId && (
        <ManagePlayersModal
          open={showManagePlayersModal}
          onOpenChange={setShowManagePlayersModal}
          participants={participants}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}

// Vampire Scene Panel Component
function VampireScenePanel({ 
  sessionId,
  currentScene, 
  scenes, 
  isNarrator,
  onSceneChange,
}: { 
  sessionId: string;
  currentScene: Scene | null; 
  scenes: Scene[];
  isNarrator: boolean;
  onSceneChange: (scene: Scene) => void;
}) {
  const { t, language } = useI18n();
  const { toast } = useToast();
  
  const [showHistory, setShowHistory] = useState(false);
  const [showNewScene, setShowNewScene] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneDesc, setNewSceneDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const previousScenes = scenes.filter(s => s.id !== currentScene?.id);

  const handleCreateScene = async () => {
    if (!newSceneName.trim()) return;
    setIsCreating(true);

    try {
      // Deactivate current scene
      if (currentScene) {
        await supabase.from('scenes').update({ is_active: false }).eq('id', currentScene.id);
      }

      // Create new scene
      const { data: scene, error } = await supabase
        .from('scenes')
        .insert({
          session_id: sessionId,
          name: newSceneName.trim(),
          description: newSceneDesc.trim() || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Update session
      await supabase.from('sessions').update({ current_scene_id: scene.id }).eq('id', sessionId);

      // Add event
      await supabase.from('session_events').insert({
        session_id: sessionId,
        scene_id: scene.id,
        event_type: 'scene_started',
        event_data: { scene_name: scene.name, scene_description: scene.description },
      });

      toast({ title: t.vampireSession.sceneCreated });
      setNewSceneName('');
      setNewSceneDesc('');
      setShowNewScene(false);
      onSceneChange(scene);
    } catch (error) {
      toast({ title: t.vampireSession.errorCreatingScene, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);

  return (
    <Card className="medieval-card border-destructive/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-medieval flex items-center gap-2 text-destructive">
            <BookOpen className="w-5 h-5" />
            {t.vampireSession.currentScene}
          </CardTitle>
          
          {isNarrator && (
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowNewScene(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              {t.vampireSession.newScene}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Scene Display */}
        {currentScene ? (
          <div className="space-y-2">
            <h3 className="font-medieval text-lg">{currentScene.name}</h3>
            {currentScene.description && (
              <p className="text-muted-foreground font-body text-sm">
                {currentScene.description}
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4 font-body">
            {t.vampireSession.noActiveScene}
          </p>
        )}

        {/* New Scene Form */}
        {showNewScene && isNarrator && (
          <div className="space-y-2 pt-3 border-t border-border">
            <Input
              placeholder={t.vampireSession.sceneName}
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              className="text-sm"
            />
            <Textarea
              placeholder={t.vampireSession.descriptionOptional}
              value={newSceneDesc}
              onChange={(e) => setNewSceneDesc(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreateScene}
                disabled={!newSceneName.trim() || isCreating}
                className="flex-1 bg-destructive hover:bg-destructive/90"
              >
                {t.common.create}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowNewScene(false)}
              >
                {t.common.cancel}
              </Button>
            </div>
          </div>
        )}

        {/* Previous Scenes Collapsible */}
        {previousScenes.length > 0 && (
          <Collapsible open={showHistory} onOpenChange={setShowHistory}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  {t.vampireSession.previousScenes} ({previousScenes.length})
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 pt-2">
                {previousScenes.map((scene) => (
                  <div key={scene.id}>
                    <button
                      onClick={() => setExpandedSceneId(expandedSceneId === scene.id ? null : scene.id)}
                      className="w-full flex items-center gap-2 p-2 rounded text-left hover:bg-muted/50 text-sm"
                    >
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate flex-1">{scene.name}</span>
                    </button>
                    {expandedSceneId === scene.id && scene.description && (
                      <p className="px-2 pb-2 text-xs text-muted-foreground whitespace-pre-wrap">
                        {scene.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

// VampireBloodTracker was replaced by VampireTrackers component

// VampireNarratorPanel was replaced by VampireNarratorSidebar component

// Vampire Player Panel Component
function VampirePlayerPanel({ character, sessionTrackers, experiencePoints, sheetLocked = true }: { character: Participant['character']; sessionTrackers?: { bloodPool?: number; willpower?: number; healthDamage?: boolean[] }; experiencePoints?: number; sheetLocked?: boolean }) {
  const { t, language } = useI18n();
  const vampiroData = character?.vampiro_data;
  const [showSheet, setShowSheet] = useState(false);

  if (!character) {
    return (
      <Card className="medieval-card border-destructive/20">
        <CardContent className="py-8 text-center">
          <Moon className="w-12 h-12 mx-auto mb-3 text-destructive/30" />
          <p className="text-muted-foreground font-body">
            {t.vampireSession.noCharacterSelected}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Character Header */}
        <Card className="medieval-card border-destructive/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/30">
                <Moon className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medieval text-lg">{character.name}</h3>
                  {(experiencePoints ?? 0) > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-mono">
                      {experiencePoints} XP
                    </Badge>
                  )}
                </div>
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
            
            {/* View Character Sheet Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSheet(true)}
              className="w-full mt-3"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t.vampireSession.viewFullSheet}
            </Button>
          </CardContent>
        </Card>

        {/* Disciplines (moved from right sidebar) */}
        {vampiroData?.disciplines && Object.keys(vampiroData.disciplines).length > 0 && (
          <Card className="medieval-card border-destructive/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-medieval text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-destructive" />
                {t.vampiro.disciplines}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(vampiroData.disciplines).map(([key, value]) =>
                  value > 0 ? (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="font-body capitalize">
                        {t.vampiro[key as keyof typeof t.vampiro] || key}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < value
                                ? 'bg-destructive'
                                : 'bg-muted-foreground/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experience Points */}
        {(experiencePoints ?? 0) > 0 && (
          <Card className="medieval-card border-destructive/20">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-medieval text-sm">{t.managePlayers.experience}</span>
                </div>
                <Badge variant="outline" className="font-mono text-sm px-2">
                  {experiencePoints} XP
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Character Sheet Modal */}
      <Dialog open={showSheet} onOpenChange={setShowSheet}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-medieval flex items-center gap-2">
              <Moon className="w-5 h-5 text-destructive" />
              {language === 'pt-BR' ? 'Minha Ficha' : 'My Character Sheet'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {character && character.vampiro_data && (
              <VampiroCharacterSheet
                character={{
                  id: character.id,
                  name: character.name,
                  concept: character.concept,
                  vampiro_data: character.vampiro_data,
                }}
                sessionTrackers={sessionTrackers}
                experiencePoints={experiencePoints}
                readOnly={sheetLocked}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// No Character Card Component
function NoCharacterCard({ inviteCode }: { inviteCode?: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col items-center text-center py-8 gap-4">
        <AlertTriangle className="w-10 h-10 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {t.sessionRejoin.noCharacterInSession}
        </p>
        <Button
          variant="outline"
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={() => navigate(inviteCode ? `/join/${inviteCode}` : '/join')}
        >
          {t.sessionRejoin.rejoinWithCharacter}
        </Button>
      </CardContent>
    </Card>
  );
}
