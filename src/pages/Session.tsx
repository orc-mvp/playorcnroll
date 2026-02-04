import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { SessionHeader } from '@/components/session/SessionHeader';
import { ScenePanel } from '@/components/session/ScenePanel';
import { EventFeed } from '@/components/session/EventFeed';
import { NarratorSidebar } from '@/components/session/NarratorSidebar';
import { PlayerSidebar } from '@/components/session/PlayerSidebar';
import { PendingTestNotification } from '@/components/dice/PendingTestNotification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Scroll, User, Dices } from 'lucide-react';

export interface SessionData {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  narrator_id: string;
  status: string;
  current_scene_id: string | null;
}

export interface Scene {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  session_id: string;
}

export interface SessionEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
  scene_id: string | null;
  session_id: string;
}

export interface Participant {
  id: string;
  user_id: string;
  character_id: string | null;
  character?: {
    id: string;
    name: string;
    concept: string | null;
    aggression_type: string;
    determination_type: string;
    seduction_type: string;
    cunning_type: string;
    faith_type: string;
    heroic_moves_stored: number;
    minor_marks?: string[] | null;
    major_marks?: unknown[] | null;
    epic_marks?: unknown[] | null;
    negative_marks?: unknown[] | null;
  } | null;
  profile?: {
    display_name: string | null;
  } | null;
}

export default function Session() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
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
          characters:character_id (
            id,
            name,
            concept,
            aggression_type,
            determination_type,
            seduction_type,
            cunning_type,
            faith_type,
            heroic_moves_stored,
            minor_marks,
            major_marks,
            epic_marks,
            negative_marks
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
      .channel(`session-${sessionId}`)
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
          // Refetch scenes
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

  const handleCreateScene = async (name: string, description: string) => {
    if (!session) return;

    const { data: newScene, error } = await supabase
      .from('scenes')
      .insert({
        session_id: session.id,
        name,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro ao criar cena', variant: 'destructive' });
      return;
    }

    // Set as current scene
    await supabase
      .from('sessions')
      .update({ current_scene_id: newScene.id })
      .eq('id', session.id);

    // Add event
    await supabase.from('session_events').insert({
      session_id: session.id,
      scene_id: newScene.id,
      event_type: 'scene_created',
      event_data: { scene_name: name },
    });

    toast({ title: 'Cena criada!', duration: 2000 });
  };

  const handleEndSession = async () => {
    if (!session) return;

    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', session.id);

    toast({ title: 'Sessão encerrada' });
    navigate('/dashboard');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-medieval text-2xl">
          {t.common.loading}
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Get player's character for pending tests
  const myParticipant = participants.find((p) => p.user_id === user?.id);
  const myCharacter = myParticipant?.character;

  // Mobile layout with tabs
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SessionHeader 
          session={session} 
          isNarrator={isNarrator} 
          participants={participants}
          onEndSession={handleEndSession}
        />

        {/* Pending Test Notification for Players */}
        {!isNarrator && myCharacter && currentScene && (
          <div className="px-4 pt-2">
            <PendingTestNotification
              sessionId={session.id}
              characterId={myCharacter.id}
              sceneId={currentScene.id}
              sceneName={currentScene.name}
              character={myCharacter}
            />
          </div>
        )}

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
            <TabsTrigger value="dice" className="font-medieval text-xs">
              <Dices className="w-4 h-4 mr-1" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="panel" className="font-medieval text-xs">
              <User className="w-4 h-4 mr-1" />
              {isNarrator ? 'Ctrl' : 'Ficha'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scene" className="flex-1 p-4 overflow-auto">
            <ScenePanel 
              currentScene={currentScene} 
              scenes={scenes}
              isNarrator={isNarrator}
              onCreateScene={handleCreateScene}
            />
          </TabsContent>

          <TabsContent value="events" className="flex-1 p-4 overflow-auto">
            <EventFeed events={events} isNarrator={isNarrator} />
          </TabsContent>

          <TabsContent value="dice" className="flex-1 p-4 overflow-auto">
            {!isNarrator && myCharacter && currentScene ? (
              <PendingTestNotification
                sessionId={session.id}
                characterId={myCharacter.id}
                sceneId={currentScene.id}
                sceneName={currentScene.name}
                character={myCharacter}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Dices className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="font-body">Aguardando testes...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="panel" className="flex-1 p-4 overflow-auto">
            {isNarrator ? (
              <NarratorSidebar 
                session={session}
                participants={participants}
                currentScene={currentScene}
              />
            ) : (
              <PlayerSidebar 
                session={session}
                participants={participants}
                userId={user?.id || ''}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop layout with sidebars
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SessionHeader 
        session={session} 
        isNarrator={isNarrator} 
        participants={participants}
        onEndSession={handleEndSession}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 grid grid-rows-[1fr_2fr] gap-4 p-4 overflow-hidden">
            {/* Scene Panel - takes 1/3 of space */}
            <div className="overflow-auto min-h-0">
              <ScenePanel 
                currentScene={currentScene} 
                scenes={scenes}
                isNarrator={isNarrator}
                onCreateScene={handleCreateScene}
              />
            </div>

            {/* Event Feed - takes 2/3 of space */}
            <div className="overflow-auto min-h-0">
              <EventFeed events={events} isNarrator={isNarrator} />
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-80 border-l border-border bg-card/30 overflow-auto p-4">
          {/* Pending Test Notification for Players (Desktop) */}
          {!isNarrator && myCharacter && currentScene && (
            <div className="mb-4">
              <PendingTestNotification
                sessionId={session.id}
                characterId={myCharacter.id}
                sceneId={currentScene.id}
                sceneName={currentScene.name}
                character={myCharacter}
              />
            </div>
          )}
          
          {isNarrator ? (
            <NarratorSidebar 
              session={session}
              participants={participants}
              currentScene={currentScene}
            />
          ) : (
            <PlayerSidebar 
              session={session}
              participants={participants}
              userId={user?.id || ''}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
