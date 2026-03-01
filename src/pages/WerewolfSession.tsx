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
import WerewolfTestRequestModal, { WerewolfTestConfig } from '@/components/session/werewolf/WerewolfTestRequestModal';
import NarratorRollModal from '@/components/session/vampire/NarratorRollModal';
import { WerewolfNarratorSidebar } from '@/components/session/werewolf/WerewolfNarratorSidebar';
import { WerewolfEventFeed } from '@/components/session/werewolf/WerewolfEventFeed';
import { VampirePendingTest } from '@/components/session/vampire/VampirePendingTest';
import { MobilePendingTestDrawer } from '@/components/session/vampire/MobilePendingTestDrawer';
import { WerewolfTrackers } from '@/components/session/werewolf/WerewolfTrackers';
import { SessionHeader } from '@/components/session/SessionHeader';
import { ManagePlayersModal } from '@/components/session/vampire/ManagePlayersModal';
import LobisomemCharacterSheet from '@/components/character/lobisomem/LobisomemCharacterSheet';
import {
  Dog,
  Users,
  BookOpen,
  Scroll,
  Dices,
  User,
  Flame,
  Plus,
  History,
  ChevronDown,
  Eye,
  FileText,
  AlertTriangle,
  Sparkles,
  Crown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { LobisomemCharacterData } from '@/lib/lobisomem/diceUtils';

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

interface Participant {
  id: string;
  user_id: string;
  character_id: string | null;
  session_gnosis?: number;
  session_rage?: number;
  session_willpower_current?: number;
  session_health_damage?: boolean[];
  session_form?: string;
  experience_points?: number;
  sheet_locked?: boolean;
  character?: {
    id: string;
    name: string;
    concept: string | null;
    game_system: string;
    vampiro_data: LobisomemCharacterData | null;
  } | null;
  profile?: {
    display_name: string | null;
  } | null;
}

export default function WerewolfSession() {
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
  const [showManagePlayersModal, setShowManagePlayersModal] = useState(false);

  const isNarrator = session?.narrator_id === user?.id;

  useEffect(() => {
    if (!sessionId || !user) return;

    const fetchSessionData = async () => {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions').select('*').eq('id', sessionId).single();

      if (sessionError || !sessionData) {
        toast({ title: t.session.sessionNotFound, variant: 'destructive' });
        navigate('/dashboard');
        return;
      }

      if (sessionData.game_system !== 'lobisomem_w20') {
        navigate(`/session/${sessionId}`);
        return;
      }

      if (sessionData.status !== 'active') {
        navigate(`/session/${sessionId}/lobby`);
        return;
      }

      setSession(sessionData);

      const { data: scenesData } = await supabase
        .from('scenes').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
      setScenes(scenesData || []);

      if (sessionData.current_scene_id) {
        const current = scenesData?.find(s => s.id === sessionData.current_scene_id);
        setCurrentScene(current || null);
      }

      const { data: eventsData } = await supabase
        .from('session_events').select('*').eq('session_id', sessionId)
        .order('created_at', { ascending: false }).limit(50);
      setEvents((eventsData || []) as SessionEvent[]);

      await fetchParticipants();
      setLoading(false);
    };

    const fetchParticipants = async () => {
      const { data: participantsData } = await supabase
        .from('session_participants')
        .select(`
          id, user_id, character_id,
          session_gnosis, session_rage,
          session_willpower_current, session_health_damage,
          session_form, sheet_locked, experience_points,
          characters:character_id (id, name, concept, game_system, vampiro_data)
        `)
        .eq('session_id', sessionId);

      if (participantsData) {
        const withProfiles = await Promise.all(
          participantsData.map(async (p) => {
            const { data: profile } = await supabase
              .from('profiles').select('display_name').eq('user_id', p.user_id).maybeSingle();

            const character = p.characters as Participant['character'];
            let gnosis = p.session_gnosis ?? 0;
            let rage = p.session_rage ?? 0;
            let willpower = p.session_willpower_current ?? 0;
            let healthDamage = (p.session_health_damage as boolean[] | null) || Array(7).fill(false);
            let form = p.session_form || 'hominid';

            // Auto-initialize for lobisomem characters
            if (character?.game_system === 'lobisomem_w20' && character.vampiro_data) {
              const lobData = character.vampiro_data as LobisomemCharacterData;
              if (gnosis === 0 && willpower === 0) {
                gnosis = lobData.gnosis || 1;
                rage = lobData.rage || 1;
                willpower = lobData.willpower || 1;

                await supabase.from('session_participants').update({
                  session_gnosis: gnosis,
                  session_rage: rage,
                  session_willpower_current: willpower,
                  session_health_damage: healthDamage,
                  session_form: form,
                }).eq('id', p.id);
              }
            }

            return {
              ...p,
              session_gnosis: gnosis,
              session_rage: rage,
              session_willpower_current: willpower,
              session_health_damage: healthDamage,
              session_form: form,
              character,
              profile,
            };
          })
        );
        setParticipants(withProfiles);
      }
    };

    fetchSessionData();

    const channel = supabase
      .channel(`werewolf-session-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as SessionData;
          setSession(updated);
          if (updated.status === 'completed') {
            toast({ title: t.vampireSession.sessionEndedByNarrator });
            navigate('/dashboard');
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scenes', filter: `session_id=eq.${sessionId}` },
        () => {
          supabase.from('scenes').select('*').eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .then(({ data }) => {
              setScenes(data || []);
              if (session?.current_scene_id) {
                setCurrentScene(data?.find(s => s.id === session.current_scene_id) || null);
              }
            });
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_events', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const newEvent = payload.new as SessionEvent;
          setEvents((prev) => {
            const localIndex = prev.findIndex(
              (e) => e.id.startsWith('local-') && e.event_type === newEvent.event_type &&
                (e.event_data as any).character_name === (newEvent.event_data as any).character_name
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_participants', filter: `session_id=eq.${sessionId}` },
        () => fetchParticipants()
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters' },
        () => fetchParticipants()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user?.id]);

  // Fallback polling
  useEffect(() => {
    if (!sessionId) return;
    const pollInterval = setInterval(async () => {
      const { data: latestEvents } = await supabase
        .from('session_events').select('*').eq('session_id', sessionId)
        .order('created_at', { ascending: false }).limit(50);
      if (latestEvents) setEvents(latestEvents as SessionEvent[]);
    }, 4000);
    return () => clearInterval(pollInterval);
  }, [sessionId]);

  useEffect(() => {
    if (session?.current_scene_id && scenes.length > 0) {
      setCurrentScene(scenes.find(s => s.id === session.current_scene_id) || null);
    }
  }, [session?.current_scene_id, scenes]);

  const handleEndSession = async () => {
    if (!session) return;
    await supabase.from('sessions').update({ status: 'completed' }).eq('id', session.id);
    toast({ title: t.vampireSession.sessionEnded });
    navigate('/dashboard');
  };

  const handleLeaveSession = () => navigate('/dashboard');

  const handleLocalEvent = (eventPartial: { event_type: string; event_data: Record<string, unknown>; scene_id: string | null; session_id: string }) => {
    const localEvent: SessionEvent = { id: `local-${Date.now()}`, ...eventPartial, created_at: new Date().toISOString() };
    setEvents((prev) => {
      const isDuplicate = prev.some(
        (e) => e.event_type === localEvent.event_type &&
          (e.event_data as any).character_name === (localEvent.event_data as any).character_name &&
          Math.abs(new Date(e.created_at).getTime() - new Date(localEvent.created_at).getTime()) < 3000
      );
      if (isDuplicate) return prev;
      return [localEvent, ...prev].slice(0, 50);
    });
  };

  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const myCharacter = myParticipant?.character;
  const myLobData = myCharacter?.vampiro_data;

  const pendingTestEvent = events.find((e) => {
    if (e.event_type !== 'vampire_test_requested') return false;
    const config = e.event_data as unknown as WerewolfTestConfig;
    return myCharacter && config.targetCharacterIds?.includes(myCharacter.id);
  });

  const hasRolledForPendingTest = pendingTestEvent
    ? events.some(
        (e) => e.event_type === 'vampire_test_result' &&
          (e.event_data as Record<string, unknown>).test_event_id === pendingTestEvent.id &&
          (e.event_data as Record<string, unknown>).character_id === myCharacter?.id
      )
    : false;

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [rollModalOpen, setRollModalOpen] = useState(false);
  const [showPendingTestDrawer, setShowPendingTestDrawer] = useState(false);

  useEffect(() => {
    if (pendingTestEvent && !hasRolledForPendingTest && isMobile) {
      setShowPendingTestDrawer(true);
    }
  }, [pendingTestEvent, hasRolledForPendingTest, isMobile]);

  const handleRequestTest = async (config: WerewolfTestConfig) => {
    if (!sessionId) return;
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
        <div className="animate-pulse text-emerald-500 font-medieval text-2xl flex items-center gap-3">
          <Dog className="w-8 h-8" />
          {t.common.loading}
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SessionHeader
        session={session}
        isNarrator={isNarrator}
        participants={participants as any}
        onEndSession={handleEndSession}
        onSessionUpdate={(updates) => setSession(prev => prev ? { ...prev, ...updates } : prev)}
        onManagePlayers={() => setShowManagePlayersModal(true)}
        onLeaveSession={handleLeaveSession}
      />

      {isMobile ? (
        <Tabs defaultValue="feed" className="flex-1 flex flex-col">
          <TabsList className="grid mx-4 mt-2" style={{ gridTemplateColumns: `repeat(${myParticipant && myCharacter ? 4 : 3}, minmax(0, 1fr))` }}>
            <TabsTrigger value="feed" className="font-medieval text-xs">
              <Scroll className="w-4 h-4 mr-1" />
              {t.mobile.tabFeed}
            </TabsTrigger>
            <TabsTrigger value="scenes" className="font-medieval text-xs">
              <BookOpen className="w-4 h-4 mr-1" />
              {t.mobile.tabScenes}
            </TabsTrigger>
            {myParticipant && myCharacter && (
              <TabsTrigger value="trackers" className="font-medieval text-xs">
                <Flame className="w-4 h-4 mr-1" />
                {t.mobile.tabTrackers}
              </TabsTrigger>
            )}
            <TabsTrigger value="info" className="font-medieval text-xs">
              <User className="w-4 h-4 mr-1" />
              {t.mobile.tabInfo}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="flex-1 p-4 overflow-auto">
            <WerewolfEventFeed events={events} />
          </TabsContent>

          <TabsContent value="scenes" className="flex-1 p-4 overflow-auto">
            <WerewolfScenePanel sessionId={sessionId!} currentScene={currentScene} scenes={scenes} isNarrator={isNarrator} onSceneChange={setCurrentScene} />
          </TabsContent>

          {myParticipant && myCharacter && (
            <TabsContent value="trackers" className="flex-1 p-4 overflow-auto">
              <WerewolfTrackers
                participantId={myParticipant.id}
                sessionId={sessionId!}
                sceneId={currentScene?.id || null}
                character={myCharacter}
                initialGnosis={myParticipant.session_gnosis || 0}
                initialRage={myParticipant.session_rage || 0}
                initialWillpower={myParticipant.session_willpower_current || 0}
                initialHealthDamage={myParticipant.session_health_damage || Array(7).fill(false)}
                initialForm={myParticipant.session_form || 'hominid'}
              />
            </TabsContent>
          )}

          <TabsContent value="info" className="flex-1 p-4 overflow-auto">
            <div className="space-y-4">
              {isNarrator ? (
                <WerewolfNarratorSidebar
                  sessionId={sessionId!}
                  participants={participants}
                  scenes={scenes}
                  currentScene={currentScene}
                  onRequestTest={() => setTestModalOpen(true)}
                  onRequestRoll={() => setRollModalOpen(true)}
                  onSceneChange={setCurrentScene}
                  onEventCreated={handleLocalEvent}
                />
              ) : (
                <WerewolfPlayerPanel character={myCharacter} experiencePoints={myParticipant?.experience_points} sessionTrackers={{ gnosis: myParticipant?.session_gnosis ?? 0, rage: myParticipant?.session_rage ?? 0, willpower: myParticipant?.session_willpower_current ?? 0, healthDamage: myParticipant?.session_health_damage || Array(7).fill(false), form: myParticipant?.session_form || 'hominid' }} sheetLocked={myParticipant?.sheet_locked ?? true} participants={participants} currentUserId={user?.id} />
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar */}
          <aside className="w-80 shrink-0 border-r border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-background overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-4">
              {isNarrator ? (
                <WerewolfNarratorSidebar
                  sessionId={sessionId!}
                  participants={participants}
                  scenes={scenes}
                  currentScene={currentScene}
                  onRequestTest={() => setTestModalOpen(true)}
                  onRequestRoll={() => setRollModalOpen(true)}
                  onSceneChange={setCurrentScene}
                  onEventCreated={handleLocalEvent}
                />
              ) : (
                <div className="space-y-4">
                  {pendingTestEvent && !hasRolledForPendingTest && myCharacter && myLobData && (
                    <VampirePendingTest
                      sessionId={sessionId!}
                      sceneId={currentScene?.id || null}
                      characterId={myCharacter.id}
                      characterName={myCharacter.name}
                      vampiroData={myLobData}
                      testEvent={{
                        id: pendingTestEvent.id,
                        event_data: pendingTestEvent.event_data as any,
                        created_at: pendingTestEvent.created_at,
                      }}
                      onTestComplete={() => {}}
                    />
                  )}
                  <WerewolfPlayerPanel character={myCharacter} experiencePoints={myParticipant?.experience_points} sessionTrackers={{ gnosis: myParticipant?.session_gnosis ?? 0, rage: myParticipant?.session_rage ?? 0, willpower: myParticipant?.session_willpower_current ?? 0, healthDamage: myParticipant?.session_health_damage || Array(7).fill(false), form: myParticipant?.session_form || 'hominid' }} sheetLocked={myParticipant?.sheet_locked ?? true} participants={participants} currentUserId={user?.id} />
                </div>
              )}
            </ScrollArea>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 grid grid-rows-[auto_1fr] gap-4 p-4 overflow-hidden">
              <div className="overflow-auto min-h-0">
                <WerewolfScenePanel sessionId={sessionId!} currentScene={currentScene} scenes={scenes} isNarrator={isNarrator} onSceneChange={setCurrentScene} />
              </div>
              <div className="overflow-auto min-h-0">
                <WerewolfEventFeed events={events} />
              </div>
            </div>
          </main>

          {/* Right Sidebar - Trackers */}
          <aside className="w-72 shrink-0 border-l border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-background overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-4">
              {myParticipant && myCharacter ? (
                <WerewolfTrackers
                  participantId={myParticipant.id}
                  sessionId={sessionId!}
                  sceneId={currentScene?.id || null}
                  character={myCharacter}
                  initialGnosis={myParticipant.session_gnosis || 0}
                  initialRage={myParticipant.session_rage || 0}
                  initialWillpower={myParticipant.session_willpower_current || 0}
                  initialHealthDamage={myParticipant.session_health_damage || Array(7).fill(false)}
                  initialForm={myParticipant.session_form || 'hominid'}
                />
              ) : !isNarrator && myParticipant && !myCharacter ? (
                <NoCharacterCard inviteCode={session?.invite_code} />
              ) : null}
            </ScrollArea>
          </aside>
        </div>
      )}

      {/* Test Request Modal */}
      <WerewolfTestRequestModal
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
        participants={participants}
        onRequestTest={handleRequestTest}
      />

      {/* Narrator Roll Modal */}
      <NarratorRollModal
        open={rollModalOpen}
        onOpenChange={setRollModalOpen}
        onRollComplete={async (result) => {
          if (!sessionId) return;
          await supabase.from('session_events').insert([{
            session_id: sessionId,
            scene_id: currentScene?.id || null,
            event_type: 'narrator_roll',
            event_data: {
              dice_count: result.diceCount, difficulty: result.difficulty,
              results: result.results, successes: result.successes,
              ones_count: result.onesCount, final_successes: result.finalSuccesses,
              is_botch: result.isBotch, is_exceptional: result.isExceptional,
              context: result.context, scene_name: currentScene?.name || null,
            },
          }]);
        }}
      />

      {/* Mobile Pending Test */}
      {!isNarrator && pendingTestEvent && !hasRolledForPendingTest && isMobile && (
        <button
          onClick={() => setShowPendingTestDrawer(true)}
          className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg animate-pulse flex items-center justify-center"
        >
          <Dices className="w-6 h-6" />
        </button>
      )}

      {!isNarrator && pendingTestEvent && !hasRolledForPendingTest && myCharacter && myLobData && (
        <MobilePendingTestDrawer
          open={showPendingTestDrawer}
          onOpenChange={setShowPendingTestDrawer}
          sessionId={sessionId!}
          sceneId={currentScene?.id || null}
          characterId={myCharacter.id}
          characterName={myCharacter.name}
          vampiroData={myLobData}
          testEvent={{
            id: pendingTestEvent.id,
            event_data: pendingTestEvent.event_data as any,
            created_at: pendingTestEvent.created_at,
          }}
        />
      )}

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

// Scene Panel
function WerewolfScenePanel({ sessionId, currentScene, scenes, isNarrator, onSceneChange }: {
  sessionId: string; currentScene: Scene | null; scenes: Scene[]; isNarrator: boolean; onSceneChange: (scene: Scene) => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(false);
  const [showNewScene, setShowNewScene] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneDesc, setNewSceneDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);

  const previousScenes = scenes.filter(s => s.id !== currentScene?.id);

  const handleCreateScene = async () => {
    if (!newSceneName.trim()) return;
    setIsCreating(true);
    try {
      if (currentScene) await supabase.from('scenes').update({ is_active: false }).eq('id', currentScene.id);
      const { data: scene, error } = await supabase.from('scenes')
        .insert({ session_id: sessionId, name: newSceneName.trim(), description: newSceneDesc.trim() || null, is_active: true })
        .select().single();
      if (error) throw error;
      await supabase.from('sessions').update({ current_scene_id: scene.id }).eq('id', sessionId);
      await supabase.from('session_events').insert({
        session_id: sessionId, scene_id: scene.id, event_type: 'scene_started',
        event_data: { scene_name: scene.name, scene_description: scene.description },
      });
      toast({ title: t.vampireSession.sceneCreated });
      setNewSceneName(''); setNewSceneDesc(''); setShowNewScene(false);
      onSceneChange(scene);
    } catch { toast({ title: t.vampireSession.errorCreatingScene, variant: 'destructive' }); }
    finally { setIsCreating(false); }
  };

  return (
    <Card className="medieval-card border-emerald-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-medieval flex items-center gap-2 text-emerald-500">
            <BookOpen className="w-5 h-5" />
            {t.vampireSession.currentScene}
          </CardTitle>
          {isNarrator && (
            <Button size="sm" variant="outline" className="border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => setShowNewScene(true)}>
              <Plus className="w-3 h-3 mr-1" /> {t.vampireSession.newScene}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentScene ? (
          <div className="space-y-2">
            <h3 className="font-medieval text-lg">{currentScene.name}</h3>
            {currentScene.description && <p className="text-muted-foreground font-body text-sm">{currentScene.description}</p>}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4 font-body">{t.vampireSession.noActiveScene}</p>
        )}

        {showNewScene && isNarrator && (
          <div className="space-y-2 pt-3 border-t border-border">
            <Input placeholder={t.vampireSession.sceneName} value={newSceneName} onChange={(e) => setNewSceneName(e.target.value)} className="text-sm" />
            <Textarea placeholder={t.vampireSession.descriptionOptional} value={newSceneDesc} onChange={(e) => setNewSceneDesc(e.target.value)} rows={2} className="text-sm" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateScene} disabled={!newSceneName.trim() || isCreating} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                {t.common.create}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewScene(false)}>{t.common.cancel}</Button>
            </div>
          </div>
        )}

        {previousScenes.length > 0 && (
          <Collapsible open={showHistory} onOpenChange={setShowHistory}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                <span className="flex items-center gap-2"><History className="w-4 h-4" /> {t.vampireSession.previousScenes} ({previousScenes.length})</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 pt-2">
                {previousScenes.map((scene) => (
                  <div key={scene.id}>
                    <button onClick={() => setExpandedSceneId(expandedSceneId === scene.id ? null : scene.id)} className="w-full flex items-center gap-2 p-2 rounded text-left hover:bg-muted/50 text-sm">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate flex-1">{scene.name}</span>
                    </button>
                    {expandedSceneId === scene.id && scene.description && (
                      <p className="px-2 pb-2 text-xs text-muted-foreground whitespace-pre-wrap">{scene.description}</p>
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

// Player Panel
function WerewolfPlayerPanel({ character, experiencePoints, sessionTrackers, sheetLocked = true, participants = [], currentUserId }: {
  character: Participant['character'];
  experiencePoints?: number;
  sessionTrackers?: { gnosis?: number; rage?: number; willpower?: number; healthDamage?: boolean[]; form?: string };
  sheetLocked?: boolean;
  participants?: Participant[];
  currentUserId?: string;
}) {
  const { t, language } = useI18n();
  const lobData = character?.vampiro_data as LobisomemCharacterData | null;
  const [showSheet, setShowSheet] = useState(false);

  if (!character) {
    return (
      <Card className="medieval-card border-emerald-500/20">
        <CardContent className="py-8 text-center">
          <Dog className="w-12 h-12 mx-auto mb-3 text-emerald-500/30" />
          <p className="text-muted-foreground font-body">{t.vampireSession.noCharacterSelected}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Character Header */}
        <Card className="medieval-card border-emerald-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                <Dog className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medieval text-lg">{character.name}</h3>
                  {(experiencePoints ?? 0) > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-mono">{experiencePoints} XP</Badge>
                  )}
                </div>
                {lobData?.tribe && (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-xs">{lobData.tribe}</Badge>
                )}
                {lobData?.auspice && (
                  <Badge variant="outline" className="border-emerald-500/20 text-muted-foreground text-xs ml-1">{lobData.auspice}</Badge>
                )}
              </div>
            </div>
            {character.concept && <p className="text-sm text-muted-foreground mt-2 font-body">{character.concept}</p>}
            <Button variant="outline" size="sm" onClick={() => setShowSheet(true)} className="w-full mt-3">
              <FileText className="w-4 h-4 mr-2" /> {t.vampireSession.viewFullSheet}
            </Button>
          </CardContent>
        </Card>

        {/* Gifts summary */}
        {lobData?.gifts && Object.values(lobData.gifts).some(g => g?.length > 0) && (
          <Card className="medieval-card border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-medieval text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                {t.lobisomem.gifts}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {[1, 2, 3, 4, 5].map(level => {
                  const gifts = lobData.gifts?.[level] || [];
                  if (gifts.length === 0) return null;
                  return gifts.map((gift, i) => (
                    <div key={`${level}-${i}`} className="text-sm font-body pl-2 border-l-2 border-emerald-500/30 py-0.5">
                      <span className="text-xs text-muted-foreground mr-1">{level}.</span>{gift}
                    </div>
                  ));
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Renown inline */}
        {lobData?.renown && (lobData.renown.glory > 0 || lobData.renown.honor > 0 || lobData.renown.wisdom > 0) && (
          <Card className="medieval-card border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-medieval text-sm flex items-center gap-2">
                <Crown className="w-4 h-4 text-emerald-500" />
                {t.lobisomem?.renown || 'Renome'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {[
                  { key: 'glory', label: t.lobisomem?.glory || 'Glória', value: lobData.renown.glory },
                  { key: 'honor', label: t.lobisomem?.honor || 'Honra', value: lobData.renown.honor },
                  { key: 'wisdom', label: t.lobisomem?.wisdom || 'Sabedoria', value: lobData.renown.wisdom },
                ].map(({ key, label, value }) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="font-body">{label}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < value ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experience Points */}
        {(experiencePoints ?? 0) > 0 && (
          <Card className="medieval-card border-emerald-500/20">
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

        {/* Pack members */}
        {(() => {
          const packMembers = participants.filter(p => p.character_id && p.user_id !== currentUserId);
          if (packMembers.length === 0) return null;
          return (
            <Card className="medieval-card border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="font-medieval text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  {language === 'pt-BR' ? 'Matilha' : 'Pack'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {packMembers.map(p => (
                    <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <User className="w-4 h-4 text-emerald-500/70" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medieval text-sm truncate">{p.character?.name || p.profile?.display_name || t.vampireSession.noCharacter}</p>
                        {p.character?.name && p.profile?.display_name && (
                          <p className="text-xs text-muted-foreground font-body truncate">{p.profile.display_name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {/* Character Sheet Modal */}
      <Dialog open={showSheet} onOpenChange={setShowSheet}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-medieval flex items-center gap-2">
              <Dog className="w-5 h-5 text-emerald-500" />
              {language === 'pt-BR' ? 'Minha Ficha' : 'My Character Sheet'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {character && character.vampiro_data && (
              <LobisomemCharacterSheet
                character={{ id: character.id, name: character.name, concept: character.concept, vampiro_data: character.vampiro_data }}
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

// No Character Card
function NoCharacterCard({ inviteCode }: { inviteCode?: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5">
      <CardContent className="flex flex-col items-center text-center py-8 gap-4">
        <AlertTriangle className="w-10 h-10 text-emerald-500" />
        <p className="text-sm text-muted-foreground">{t.sessionRejoin.noCharacterInSession}</p>
        <Button variant="outline" className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
          onClick={() => navigate(inviteCode ? `/join/${inviteCode}` : '/join')}>
          {t.sessionRejoin.rejoinWithCharacter}
        </Button>
      </CardContent>
    </Card>
  );
}
