/**
 * StorytellerSession — sala unificada para todos os sistemas WoD.
 *
 * Substitui VampireSession e WerewolfSession. Usa o adapter do sistema da
 * sessão (`getSystemAdapter(session.game_system)`) para renderizar trackers,
 * ficha, modais e painel lateral — mantendo o comportamento existente.
 *
 * NÃO duplica lógica: delega tudo aos componentes existentes via adapter.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scroll, BookOpen, User, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';

import { SessionHeader } from '@/components/session/SessionHeader';
import { ManagePlayersModal } from '@/components/session/vampire/ManagePlayersModal';
import { StorytellerNarratorRollModal } from '@/components/session/storyteller/StorytellerNarratorRollModal';
import StorytellerTestRequestModal from '@/components/session/storyteller/StorytellerTestRequestModal';
import { StorytellerRequestTestCard } from '@/components/session/storyteller/StorytellerRequestTestCard';
import { MobilePendingTestDrawer } from '@/components/session/vampire/MobilePendingTestDrawer';
import { VampireNarratorSidebar } from '@/components/session/vampire/VampireNarratorSidebar';
import { WerewolfNarratorSidebar } from '@/components/session/werewolf/WerewolfNarratorSidebar';

import {
  StorytellerScenePanel,
  getSceneThemeForSystem,
} from '@/components/session/shared/StorytellerScenePanel';
import { StorytellerEventFeed } from '@/components/session/shared/StorytellerEventFeed';
import { NoCharacterCard } from '@/components/session/shared/NoCharacterCard';

import { getSystemAdapter, isStorytellerSystem } from '@/lib/storyteller/systemRegistry';
import type {
  StorytellerSessionData,
  StorytellerScene,
  StorytellerEvent,
  StorytellerParticipant,
} from '@/lib/storyteller/types';

interface StorytellerThemeBundle {
  loadingIcon: React.ReactNode;
  loadingText: string; // tailwind color class
  asideBorder: string;
  asideBg: string;
  fabBg: string;
  fabText: string;
  // Pedido de teste compartilhado
  cardBorder: string;
  cardIconText: string;
  cardPrimaryBg: string;
  cardOutlineBorder: string;
  cardOutlineHover: string;
}

function getThemeBundle(
  systemId: string,
  AdapterIcon: React.ComponentType<{ className?: string }>,
): StorytellerThemeBundle {
  if (systemId === 'lobisomem_w20') {
    return {
      loadingIcon: <AdapterIcon className="w-8 h-8" />,
      loadingText: 'text-emerald-500',
      asideBorder: 'border-emerald-500/20',
      asideBg: 'from-emerald-500/5 to-background',
      fabBg: 'bg-emerald-500 hover:bg-emerald-600',
      fabText: 'text-white',
      cardBorder: 'border-emerald-500/20',
      cardIconText: 'text-emerald-500',
      cardPrimaryBg: 'bg-emerald-500 hover:bg-emerald-600',
      cardOutlineBorder: 'border-emerald-500/30',
      cardOutlineHover: 'hover:bg-emerald-500/10',
    };
  }
  if (systemId === 'metamorfos_w20') {
    return {
      loadingIcon: <AdapterIcon className="w-8 h-8" />,
      loadingText: 'text-amber-500',
      asideBorder: 'border-amber-500/20',
      asideBg: 'from-amber-500/5 to-background',
      fabBg: 'bg-amber-500 hover:bg-amber-600',
      fabText: 'text-white',
      cardBorder: 'border-amber-500/20',
      cardIconText: 'text-amber-500',
      cardPrimaryBg: 'bg-amber-500 hover:bg-amber-600',
      cardOutlineBorder: 'border-amber-500/30',
      cardOutlineHover: 'hover:bg-amber-500/10',
    };
  }
  if (systemId === 'mago_m20') {
    return {
      loadingIcon: <AdapterIcon className="w-8 h-8" />,
      loadingText: 'text-purple-500',
      asideBorder: 'border-purple-500/20',
      asideBg: 'from-purple-500/5 to-background',
      fabBg: 'bg-purple-500 hover:bg-purple-600',
      fabText: 'text-white',
      cardBorder: 'border-purple-500/20',
      cardIconText: 'text-purple-500',
      cardPrimaryBg: 'bg-purple-500 hover:bg-purple-600',
      cardOutlineBorder: 'border-purple-500/30',
      cardOutlineHover: 'hover:bg-purple-500/10',
    };
  }
  // default vampire
  return {
    loadingIcon: <AdapterIcon className="w-8 h-8" />,
    loadingText: 'text-destructive',
    asideBorder: 'border-destructive/20',
    asideBg: 'from-destructive/5 to-background',
    fabBg: 'bg-destructive hover:bg-destructive/90',
    fabText: 'text-destructive-foreground',
    cardBorder: 'border-destructive/20',
    cardIconText: 'text-destructive',
    cardPrimaryBg: 'bg-destructive hover:bg-destructive/90',
    cardOutlineBorder: 'border-destructive/30',
    cardOutlineHover: 'hover:bg-destructive/10',
  };
}

export default function StorytellerSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [session, setSession] = useState<StorytellerSessionData | null>(null);
  const [currentScene, setCurrentScene] = useState<StorytellerScene | null>(null);
  const [scenes, setScenes] = useState<StorytellerScene[]>([]);
  const [events, setEvents] = useState<StorytellerEvent[]>([]);
  const [participants, setParticipants] = useState<StorytellerParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManagePlayersModal, setShowManagePlayersModal] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  /** Quem abriu o modal de teste — define o escopo de alvos disponíveis. */
  const [testRequester, setTestRequester] = useState<'narrator' | 'player'>('narrator');
  const [rollModalOpen, setRollModalOpen] = useState(false);
  const [showPendingTestDrawer, setShowPendingTestDrawer] = useState(false);

  const isNarrator = session?.narrator_id === user?.id;

  useEffect(() => {
    if (!sessionId || !user) return;

    const fetchParticipants = async () => {
      const { data: participantsData } = await supabase
        .from('session_participants')
        .select(`
          id, user_id, character_id,
          session_blood_pool, session_willpower_current, session_health_damage,
          session_gnosis, session_rage, session_form,
          sheet_locked, experience_points,
          characters:character_id (id, name, concept, game_system, vampiro_data)
        `)
        .eq('session_id', sessionId);

      if (!participantsData) return;

      const withProfiles = await Promise.all(
        participantsData.map(async (p) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', p.user_id)
            .maybeSingle();

          const character = p.characters as StorytellerParticipant['character'];

          // Inicialização lazy via adapter do sistema do PERSONAGEM
          // (não da sessão — permite ficha mista no futuro)
          const charSystem = character?.game_system || session?.game_system;
          const adapter = getSystemAdapter(charSystem || '');
          const baseParticipant: StorytellerParticipant = {
            ...p,
            session_health_damage:
              (p.session_health_damage as boolean[] | null) ||
              [false, false, false, false, false, false, false],
            character,
            profile: profile || undefined,
          };

          const initPatch = adapter.initializeTrackers(baseParticipant);
          if (initPatch) {
            await supabase
              .from('session_participants')
              .update(initPatch as any)
              .eq('id', p.id);
            return { ...baseParticipant, ...initPatch };
          }
          return baseParticipant;
        }),
      );
      setParticipants(withProfiles);
    };

    const fetchSessionData = async () => {
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

      // Sala storyteller só atende sistemas WoD
      if (!isStorytellerSystem(sessionData.game_system)) {
        navigate(`/session/${sessionId}`);
        return;
      }

      if (sessionData.status !== 'active') {
        navigate(`/session/${sessionId}/lobby`);
        return;
      }

      setSession(sessionData);

      const { data: scenesData } = await supabase
        .from('scenes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      setScenes(scenesData || []);

      if (sessionData.current_scene_id) {
        const current = scenesData?.find((s) => s.id === sessionData.current_scene_id);
        setCurrentScene(current || null);
      }

      const { data: eventsData } = await supabase
        .from('session_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50);
      setEvents((eventsData || []) as StorytellerEvent[]);

      await fetchParticipants();
      setLoading(false);
    };

    fetchSessionData();

    const channel = supabase
      .channel(`storyteller-session-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as StorytellerSessionData;
          setSession(updated);
          if (updated.status === 'completed') {
            toast({ title: t.vampireSession.sessionEndedByNarrator });
            navigate('/dashboard');
          }
        },
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
              setScenes((data || []) as StorytellerScene[]);
            });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_events',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newEvent = payload.new as StorytellerEvent;
          setEvents((prev) => {
            const localIndex = prev.findIndex(
              (e) =>
                e.id.startsWith('local-') &&
                e.event_type === newEvent.event_type &&
                (e.event_data as any).character_name ===
                  (newEvent.event_data as any).character_name,
            );
            if (localIndex >= 0) {
              const updated = [...prev];
              updated[localIndex] = newEvent;
              return updated;
            }
            return [newEvent, ...prev].slice(0, 50);
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => fetchParticipants(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'characters' },
        () => fetchParticipants(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user?.id]);

  // Polling fallback (4s) — garante sincronização mesmo se realtime falhar
  useEffect(() => {
    if (!sessionId) return;
    const pollInterval = setInterval(async () => {
      const { data: latestEvents } = await supabase
        .from('session_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (latestEvents) setEvents(latestEvents as StorytellerEvent[]);
    }, 4000);
    return () => clearInterval(pollInterval);
  }, [sessionId]);

  useEffect(() => {
    if (session?.current_scene_id && scenes.length > 0) {
      setCurrentScene(scenes.find((s) => s.id === session.current_scene_id) || null);
    }
  }, [session?.current_scene_id, scenes]);

  const handleEndSession = async () => {
    if (!session) return;
    await supabase.from('sessions').update({ status: 'completed' }).eq('id', session.id);
    toast({ title: t.vampireSession.sessionEnded });
    navigate('/dashboard');
  };

  const handleLeaveSession = () => navigate('/dashboard');

  const handleLocalEvent = (eventPartial: {
    event_type: string;
    event_data: Record<string, unknown>;
    scene_id: string | null;
    session_id: string;
  }) => {
    const localEvent: StorytellerEvent = {
      id: `local-${Date.now()}`,
      ...eventPartial,
      created_at: new Date().toISOString(),
    };
    setEvents((prev) => {
      const isDuplicate = prev.some(
        (e) =>
          e.event_type === localEvent.event_type &&
          (e.event_data as any).character_name === (localEvent.event_data as any).character_name &&
          Math.abs(new Date(e.created_at).getTime() - new Date(localEvent.created_at).getTime()) <
            3000,
      );
      if (isDuplicate) return prev;
      return [localEvent, ...prev].slice(0, 50);
    });
  };

  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const myCharacter = myParticipant?.character;
  const myCharData = myCharacter?.vampiro_data;

  // Adapter do sistema do MEU personagem (não da sessão) — futuro suporte misto
  const myAdapter = getSystemAdapter(myCharacter?.game_system || session?.game_system || '');
  // Adapter primário da sessão (usado para sidebar do narrador, modais)
  const sessionAdapter = getSystemAdapter(session?.game_system || '');

  // Pending test
  const pendingTestEvent = events.find((e) => {
    if (e.event_type !== 'vampire_test_requested') return false;
    const config = e.event_data as any;
    return myCharacter && config.targetCharacterIds?.includes(myCharacter.id);
  });

  const hasRolledForPendingTest = pendingTestEvent
    ? events.some(
        (e) =>
          e.event_type === 'vampire_test_result' &&
          (e.event_data as any).test_event_id === pendingTestEvent.id &&
          (e.event_data as any).character_id === myCharacter?.id,
      )
    : false;

  useEffect(() => {
    if (pendingTestEvent && !hasRolledForPendingTest && isMobile) {
      setShowPendingTestDrawer(true);
    }
  }, [pendingTestEvent, hasRolledForPendingTest, isMobile]);

  const handleRequestTest = async (config: any) => {
    if (!sessionId) return;
    await supabase.from('session_events').insert([
      {
        session_id: sessionId,
        scene_id: currentScene?.id || null,
        event_type: 'vampire_test_requested',
        event_data: JSON.parse(JSON.stringify(config)),
      },
    ]);
    toast({
      title: t.vampiroTests.requestTest,
      description: `${config.testType} - ${t.vampiroTests.difficulty}: ${config.difficulty}`,
    });
  };

  if (authLoading || loading || !session) {
    const Icon = sessionAdapter.icon;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div
          className={cn(
            'animate-pulse font-medieval text-2xl flex items-center gap-3',
            session?.game_system === 'lobisomem_w20'
              ? 'text-emerald-500'
              : 'text-destructive',
          )}
        >
          <Icon className="w-8 h-8" />
          {t.common.loading}
        </div>
      </div>
    );
  }

  const theme = getThemeBundle(session.game_system, sessionAdapter.icon);
  const sceneTheme = getSceneThemeForSystem(session.game_system);
  const noCharThemeKey: 'vampire' | 'werewolf' =
    session.game_system === 'lobisomem_w20' ? 'werewolf' : 'vampire';

  // Sidebars do narrador agora são CONTEXTUAIS POR PERSONAGEM:
  // separamos os participantes por sistema do personagem e renderizamos a
  // sidebar correspondente para cada grupo. Assim, numa sessão mista o
  // narrador vê cards de Vampiro com trackers de Sangue/Humanidade e cards
  // de Lobisomem com Gnose/Fúria/Forma — cada um na ficha correta.
  const vampireParticipants = participants.filter(
    (p) => !p.character || p.character.game_system === 'vampiro_v3',
  );
  const werewolfParticipants = participants.filter(
    (p) => p.character?.game_system === 'lobisomem_w20' ||
           p.character?.game_system === 'metamorfos_w20',
  );

  const renderNarratorSidebar = () => (
    <div className="space-y-6">
      {vampireParticipants.length > 0 && (
        <VampireNarratorSidebar
          sessionId={sessionId!}
          participants={vampireParticipants as any}
          scenes={scenes as any}
          currentScene={currentScene as any}
          onRequestTest={() => setTestModalOpen(true)}
          onRequestRoll={() => setRollModalOpen(true)}
          onSceneChange={setCurrentScene as any}
          onEventCreated={handleLocalEvent}
        />
      )}
      {werewolfParticipants.length > 0 && (
        <WerewolfNarratorSidebar
          sessionId={sessionId!}
          participants={werewolfParticipants as any}
          scenes={scenes as any}
          currentScene={currentScene as any}
          onRequestTest={() => setTestModalOpen(true)}
          onRequestRoll={() => setRollModalOpen(true)}
          onSceneChange={setCurrentScene as any}
          onEventCreated={handleLocalEvent}
        />
      )}
    </div>
  );

  const PlayerSidePanel = myAdapter.PlayerSidePanel;
  const PendingTestComponent = myAdapter.PendingTestComponent;
  const TrackersComponent = myAdapter.PlayerTrackersComponent;

  // Props para trackers (variam por sistema)
  const buildTrackerProps = () => {
    if (!myParticipant || !myCharacter) return null;
    const base = {
      participantId: myParticipant.id,
      sessionId: sessionId!,
      sceneId: currentScene?.id || null,
      character: myCharacter,
      initialWillpower: myParticipant.session_willpower_current || 0,
      initialHealthDamage:
        (myParticipant.session_health_damage as boolean[]) ||
        [false, false, false, false, false, false, false],
    };
    if (myCharacter.game_system === 'lobisomem_w20' || myCharacter.game_system === 'metamorfos_w20') {
      return {
        ...base,
        initialGnosis: myParticipant.session_gnosis || 0,
        initialRage: myParticipant.session_rage || 0,
        initialForm: myParticipant.session_form || 'hominid',
      };
    }
    return {
      ...base,
      initialBloodPool: myParticipant.session_blood_pool || 0,
    };
  };
  const trackerProps = buildTrackerProps();

  // Props para PlayerSidePanel
  const sidePanelProps = {
    character: myCharacter,
    experiencePoints: myParticipant?.experience_points,
    sessionTrackers:
      (myCharacter?.game_system === 'lobisomem_w20' || myCharacter?.game_system === 'metamorfos_w20')
        ? {
            gnosis: myParticipant?.session_gnosis ?? 0,
            rage: myParticipant?.session_rage ?? 0,
            willpower: myParticipant?.session_willpower_current ?? 0,
            healthDamage:
              (myParticipant?.session_health_damage as boolean[]) ||
              Array(7).fill(false),
            form: myParticipant?.session_form || 'hominid',
          }
        : {
            bloodPool: myParticipant?.session_blood_pool ?? 0,
            willpower: myParticipant?.session_willpower_current ?? 0,
            healthDamage:
              (myParticipant?.session_health_damage as boolean[]) ||
              [false, false, false, false, false, false, false],
          },
    sheetLocked: myParticipant?.sheet_locked ?? true,
    participants,
    currentUserId: user?.id,
  };

  const pendingTestSharedProps =
    pendingTestEvent && myCharacter && myCharData
      ? {
          sessionId: sessionId!,
          sceneId: currentScene?.id || null,
          characterId: myCharacter.id,
          characterName: myCharacter.name,
          vampiroData: myCharData,
          testEvent: {
            id: pendingTestEvent.id,
            event_data: pendingTestEvent.event_data,
            created_at: pendingTestEvent.created_at,
          },
          onTestComplete: () => {},
          ...((myCharacter.game_system === 'lobisomem_w20' || myCharacter.game_system === 'metamorfos_w20')
            ? {
                currentForm: myParticipant?.session_form || 'hominid',
                gameSystem: myCharacter.game_system as 'lobisomem_w20' | 'metamorfos_w20',
              }
            : {}),
        }
      : null;

  const tabsCount = 2 + (trackerProps ? 1 : 0) + 1; // feed + scenes + (trackers?) + info

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SessionHeader
        session={session as any}
        isNarrator={isNarrator}
        participants={participants as any}
        onEndSession={handleEndSession}
        onSessionUpdate={(updates) =>
          setSession((prev) => (prev ? { ...prev, ...updates } : prev))
        }
        onManagePlayers={() => setShowManagePlayersModal(true)}
        onLeaveSession={handleLeaveSession}
      />

      {isMobile ? (
        <>
          <Tabs defaultValue="feed" className="flex-1 flex flex-col">
            <TabsList
              className="grid mx-4 mt-2"
              style={{ gridTemplateColumns: `repeat(${tabsCount}, minmax(0, 1fr))` }}
            >
              <TabsTrigger value="feed" className="font-medieval text-xs">
                <Scroll className="w-4 h-4 mr-1" />
                {t.mobile.tabFeed}
              </TabsTrigger>
              <TabsTrigger value="scenes" className="font-medieval text-xs">
                <BookOpen className="w-4 h-4 mr-1" />
                {t.mobile.tabScenes}
              </TabsTrigger>
              {trackerProps && (
                <TabsTrigger value="trackers" className="font-medieval text-xs">
                  <Dices className="w-4 h-4 mr-1" />
                  {t.mobile.tabTrackers}
                </TabsTrigger>
              )}
              <TabsTrigger value="info" className="font-medieval text-xs">
                <User className="w-4 h-4 mr-1" />
                {t.mobile.tabInfo}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="flex-1 p-4 overflow-auto">
              <StorytellerEventFeed
                events={events}
                gameSystem={session.game_system}
                currentUserId={user?.id}
                isNarrator={isNarrator}
              />
            </TabsContent>

            <TabsContent value="scenes" className="flex-1 p-4 overflow-auto">
              <StorytellerScenePanel
                sessionId={sessionId!}
                currentScene={currentScene}
                scenes={scenes}
                isNarrator={isNarrator}
                onSceneChange={setCurrentScene}
                theme={sceneTheme}
              />
            </TabsContent>

            {trackerProps && (
              <TabsContent value="trackers" className="flex-1 p-4 overflow-auto">
                <TrackersComponent {...(trackerProps as any)} />
              </TabsContent>
            )}

            <TabsContent value="info" className="flex-1 p-4 overflow-auto">
              <div className="space-y-4">
                {isNarrator ? (
                  renderNarratorSidebar()
                ) : (
                  <PlayerSidePanel {...(sidePanelProps as any)} />
                )}
              </div>
            </TabsContent>
          </Tabs>

          {!isNarrator && pendingTestEvent && !hasRolledForPendingTest && (
            <button
              onClick={() => setShowPendingTestDrawer(true)}
              className={cn(
                'fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full shadow-lg animate-pulse flex items-center justify-center',
                theme.fabBg,
                theme.fabText,
              )}
            >
              <Dices className="w-6 h-6" />
            </button>
          )}

          {pendingTestSharedProps && (
            <MobilePendingTestDrawer
              open={showPendingTestDrawer}
              onOpenChange={setShowPendingTestDrawer}
              {...(pendingTestSharedProps as any)}
            />
          )}
        </>
      ) : (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar */}
          <aside
            className={cn(
              'w-80 shrink-0 border-r overflow-hidden flex flex-col bg-gradient-to-b',
              theme.asideBorder,
              theme.asideBg,
            )}
          >
            <ScrollArea className="flex-1">
              <div className="p-4">
                {isNarrator ? (
                  renderNarratorSidebar()
                ) : (
                  <div className="space-y-4">
                    {pendingTestSharedProps && !hasRolledForPendingTest && (
                      <PendingTestComponent {...(pendingTestSharedProps as any)} />
                    )}
                    <PlayerSidePanel {...(sidePanelProps as any)} />
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 grid grid-rows-[auto_1fr] gap-4 p-4 overflow-hidden">
              <div className="overflow-auto min-h-0">
                <StorytellerScenePanel
                  sessionId={sessionId!}
                  currentScene={currentScene}
                  scenes={scenes}
                  isNarrator={isNarrator}
                  onSceneChange={setCurrentScene}
                  theme={sceneTheme}
                />
              </div>
              <div className="overflow-auto min-h-0">
                <StorytellerEventFeed
                  events={events}
                  gameSystem={session.game_system}
                  currentUserId={user?.id}
                  isNarrator={isNarrator}
                />
              </div>
            </div>
          </main>

          {/* Right Sidebar - Trackers */}
          <aside
            className={cn(
              'w-72 shrink-0 border-l overflow-hidden flex flex-col bg-gradient-to-b',
              theme.asideBorder,
              theme.asideBg,
            )}
          >
            <ScrollArea className="flex-1">
              <div className="p-4">
                {trackerProps ? (
                  <TrackersComponent {...(trackerProps as any)} />
                ) : !isNarrator && myParticipant && !myCharacter ? (
                  <NoCharacterCard
                    inviteCode={session.invite_code}
                    themeKey={noCharThemeKey}
                  />
                ) : null}
              </div>
            </ScrollArea>
          </aside>
        </div>
      )}

      {/* Test Request Modal — unificado, mostra categorias por sistema dos alvos */}
      <StorytellerTestRequestModal
        open={testModalOpen}
        onOpenChange={setTestModalOpen}
        participants={participants as any}
        onRequestTest={handleRequestTest}
      />

      {/* Narrator Roll Modal — unificado, lê narratorRollConfig do adapter */}
      <StorytellerNarratorRollModal
        open={rollModalOpen}
        onOpenChange={setRollModalOpen}
        gameSystem={session.game_system}
        onRollComplete={async (result) => {
          if (!sessionId) return;
          await supabase.from('session_events').insert([
            {
              session_id: sessionId,
              scene_id: currentScene?.id || null,
              event_type: 'narrator_roll',
              event_data: {
                dice_count: result.diceCount,
                difficulty: result.difficulty,
                results: result.results,
                extra_results: result.extraResults,
                successes: result.successes,
                ones_count: result.onesCount,
                final_successes: result.finalSuccesses,
                is_botch: result.isBotch,
                is_exceptional: result.isExceptional,
                context: result.context,
                pool_id: result.poolId,
                exploded: result.exploded,
                scene_name: currentScene?.name || null,
              },
            },
          ]);
        }}
      />

      {isNarrator && sessionId && (
        <ManagePlayersModal
          open={showManagePlayersModal}
          onOpenChange={setShowManagePlayersModal}
          participants={participants as any}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}
