import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Copy, 
  Link as LinkIcon, 
  Users, 
  Play,
  Crown,
  User,
  Loader2
} from 'lucide-react';

interface Session {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  narrator_id: string;
  status: string;
}

interface Participant {
  id: string;
  user_id: string;
  character_id: string | null;
  joined_at: string;
  character?: {
    id: string;
    name: string;
    concept: string | null;
  } | null;
  profile?: {
    display_name: string | null;
  } | null;
}

export default function SessionLobby() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const isNarrator = session?.narrator_id === user?.id;

  // Fetch session and participants
  useEffect(() => {
    if (!sessionId || !user) return;

    const fetchSession = async () => {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        toast({
          title: 'Sessão não encontrada',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setSession(sessionData);

      // Fetch participants with their characters
      const { data: participantsData } = await supabase
        .from('session_participants')
        .select(`
          id,
          user_id,
          character_id,
          joined_at,
          characters:character_id (
            id,
            name,
            concept
          )
        `)
        .eq('session_id', sessionId);

      if (participantsData) {
        // Fetch profiles for each participant
        const participantsWithProfiles = await Promise.all(
          participantsData.map(async (p) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', p.user_id)
              .maybeSingle();

            return {
              ...p,
              character: p.characters as Participant['character'],
              profile: profileData,
            };
          })
        );

        setParticipants(participantsWithProfiles);
      }

      setLoading(false);
    };

    fetchSession();

    // Subscribe to realtime updates for participants
    const channel = supabase
      .channel(`session-lobby-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Refetch participants on any change
          fetchSession();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newSession = payload.new as Session;
          setSession(newSession);
          
          // Redirect to active session if started
          if (newSession.status === 'active') {
            navigate(`/session/${sessionId}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, user, navigate, toast]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: `${label} copiado!`,
        duration: 2000,
      });
    } catch {
      toast({
        title: 'Erro ao copiar',
        variant: 'destructive',
      });
    }
  };

  const handleStartSession = async () => {
    if (!session || !isNarrator) return;

    setIsStarting(true);

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'active' })
        .eq('id', session.id);

      if (error) throw error;

      navigate(`/session/${session.id}`);
    } catch (error: any) {
      toast({
        title: 'Erro ao iniciar sessão',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
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

  if (!session) {
    return null;
  }

  const inviteLink = `${window.location.origin}/join/${session.invite_code}`;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="font-medieval text-lg sm:text-xl md:text-2xl text-foreground truncate">
                {session.name}
              </h1>
              <span className="text-sm text-muted-foreground font-body">
                {t.session.lobby}
              </span>
            </div>
          </div>

          {isNarrator && (
            <div className="flex items-center gap-2 shrink-0">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medieval hidden sm:inline">
                {t.roles.narrator}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl overflow-hidden">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Invite Section */}
          <Card className="medieval-card overflow-hidden">
            <CardHeader>
              <CardTitle className="font-medieval flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary shrink-0" />
                <span className="truncate">Convide Jogadores</span>
              </CardTitle>
              <CardDescription className="font-body">
                Compartilhe o código ou link com seus jogadores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 overflow-hidden">
              {/* Invite Code */}
              <div className="space-y-2">
                <label className="text-sm font-medieval text-muted-foreground">
                  {t.session.inviteCode}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0 bg-muted rounded-md px-4 py-3 font-mono text-xl sm:text-2xl text-center tracking-widest overflow-hidden">
                    {session.invite_code}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => copyToClipboard(session.invite_code, 'Código')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Invite Link */}
              <div className="space-y-2 overflow-hidden">
                <label className="text-sm font-medieval text-muted-foreground">
                  {t.session.inviteLink}
                </label>
                <div className="flex gap-2 min-w-0">
                  <div className="flex-1 min-w-0 bg-muted rounded-md px-3 py-2 text-sm font-body overflow-hidden text-ellipsis whitespace-nowrap">
                    {inviteLink}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => copyToClipboard(inviteLink, 'Link')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connected Players */}
          <Card className="medieval-card">
            <CardHeader>
              <CardTitle className="font-medieval flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {t.session.connectedPlayers}
              </CardTitle>
              <CardDescription className="font-body">
                {participants.length} jogador(es) conectado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-body">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aguardando jogadores...</p>
                  <p className="text-sm mt-1">
                    Compartilhe o código de convite
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {participants.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medieval truncate">
                          {p.character?.name || 'Sem personagem'}
                        </p>
                        <p className="text-sm text-muted-foreground font-body truncate">
                          {p.profile?.display_name || 'Jogador'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Description */}
        {session.description && (
          <Card className="medieval-card mt-6">
            <CardHeader>
              <CardTitle className="font-medieval">
                {t.session.description}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-body text-muted-foreground">
                {session.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Start Session Button (Narrator only) */}
        {isNarrator && (
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="font-medieval text-lg px-8 h-14"
              onClick={handleStartSession}
              disabled={isStarting}
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  {t.session.start}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Waiting Message (Player) */}
        {!isNarrator && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-muted">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="font-body text-muted-foreground">
                {t.session.waitingForNarrator}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
