import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Users, Loader2, History, Play, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  concept: string | null;
}

interface JoinedSession {
  id: string;
  name: string;
  description: string | null;
  status: string;
  game_system: string;
  characterName: string;
  joinedAt: string;
}

export default function JoinSession() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const [inviteCode, setInviteCode] = useState(code || '');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [joinedSessions, setJoinedSessions] = useState<JoinedSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Redirect if not authenticated or is a narrator
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Fetch user's characters
  useEffect(() => {
    if (!user) return;

    const fetchCharacters = async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, concept')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching characters:', error);
      } else {
        setCharacters(data || []);
        if (data && data.length === 1) {
          setSelectedCharacterId(data[0].id);
        }
      }
      setLoadingCharacters(false);
    };

    fetchCharacters();
  }, [user]);

  // Fetch sessions the user has joined
  useEffect(() => {
    if (!user) return;

    const fetchJoinedSessions = async () => {
      setLoadingSessions(true);
      
      const { data: participations, error } = await supabase
        .from('session_participants')
        .select(`
          id,
          joined_at,
          character_id,
          characters:character_id (name),
          sessions:session_id (
            id,
            name,
            description,
            status,
            game_system
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching joined sessions:', error);
      } else if (participations) {
        const sessions: JoinedSession[] = participations
          .filter(p => p.sessions && !['completed'].includes((p.sessions as any).status))
          .map(p => ({
            id: (p.sessions as any).id,
            name: (p.sessions as any).name,
            description: (p.sessions as any).description,
            status: (p.sessions as any).status,
            game_system: (p.sessions as any).game_system || 'herois_marcados',
            characterName: (p.characters as any)?.name || 'Sem personagem',
            joinedAt: p.joined_at,
          }));
        setJoinedSessions(sessions);
      }
      
      setLoadingSessions(false);
    };

    fetchJoinedSessions();
  }, [user]);

  // Auto-join if code is in URL
  useEffect(() => {
    if (code && user && !authLoading && characters.length > 0 && selectedCharacterId) {
      // Don't auto-join, let user select character first
    }
  }, [code, user, authLoading, characters, selectedCharacterId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    const codeToUse = inviteCode.trim().toUpperCase();

    if (!codeToUse) {
      toast({
        title: 'Código inválido',
        description: 'Digite o código de convite',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCharacterId) {
      toast({
        title: 'Selecione um personagem',
        description: 'Você precisa escolher um personagem para entrar na sessão',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setIsJoining(true);

    try {
      // Find session by invite code using secure edge function
      const { data: validateData, error: validateError } = await supabase.functions.invoke(
        'validate-invite-code',
        { body: { invite_code: codeToUse } }
      );

      if (validateError || !validateData?.session) {
        throw new Error('Sessão não encontrada com este código');
      }

      const sessionData = validateData.session;

      // Check if already a participant
      const { data: existingParticipant } = await supabase
        .from('session_participants')
        .select('id')
        .eq('session_id', sessionData.id)
        .eq('user_id', user.id)
        .single();

      if (existingParticipant) {
        // Already joined, just navigate (with correct route for game system)
        if (sessionData.status === 'active') {
          const route = sessionData.game_system === 'vampiro_v3' 
            ? `/session/vampire/${sessionData.id}` 
            : `/session/${sessionData.id}`;
          navigate(route);
        } else {
          navigate(`/session/${sessionData.id}/lobby`);
        }
        return;
      }

      // Join the session
      const { error: joinError } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionData.id,
          user_id: user.id,
          character_id: selectedCharacterId,
        });

      if (joinError) throw joinError;

      toast({
        title: 'Entrou na sessão!',
        description: 'Aguardando o Narrador iniciar...',
      });

      // Navigate to lobby or active session (with correct route for game system)
      if (sessionData.status === 'active') {
        const route = sessionData.game_system === 'vampiro_v3' 
          ? `/session/vampire/${sessionData.id}` 
          : `/session/${sessionData.id}`;
        navigate(route);
      } else {
        navigate(`/session/${sessionData.id}/lobby`);
      }
    } catch (error: any) {
      console.error('Error joining session:', error);
      toast({
        title: 'Erro ao entrar na sessão',
        description: error.message || 'Verifique o código e tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleRejoinSession = (session: JoinedSession) => {
    if (session.status === 'active') {
      const route = session.game_system === 'vampiro_v3' 
        ? `/session/vampire/${session.id}` 
        : `/session/${session.id}`;
      navigate(route);
    } else {
      navigate(`/session/${session.id}/lobby`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <Play className="w-3 h-3 mr-1" />
            Ativa
          </Badge>
        );
      case 'lobby':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando
          </Badge>
        );
      case 'ended':
        return (
          <Badge className="bg-muted text-muted-foreground border-muted-foreground/30">
            <XCircle className="w-3 h-3 mr-1" />
            Encerrada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-medieval text-2xl">
          {t.common.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-medieval text-lg sm:text-xl md:text-2xl text-foreground truncate">
            {t.session.join}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Previously Joined Sessions - First on mobile, second on desktop */}
          <div className="order-1 lg:order-2">
            {loadingSessions ? (
              <Card className="medieval-card">
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : joinedSessions.length > 0 ? (
              <Card className="medieval-card h-full">
                <CardHeader>
                  <div className="w-12 h-12 mx-auto lg:mx-0 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <History className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="font-medieval text-xl text-center lg:text-left">
                    Minhas Aventuras
                  </CardTitle>
                  <CardDescription className="font-body text-center lg:text-left">
                    Sessões que você já participou
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {joinedSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleRejoinSession(session)}
                      className="w-full p-4 rounded-lg border border-border bg-card/50 hover:bg-primary/5 hover:border-primary/50 transition-all text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medieval text-foreground truncate">
                            {session.name}
                          </h4>
                          {session.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {session.description}
                            </p>
                          )}
                          <p className="text-xs text-primary mt-2 font-body">
                            Como: {session.characterName}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(session.status)}
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className="medieval-card h-full">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="font-medieval text-lg text-muted-foreground">
                    Nenhuma aventura ainda
                  </p>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Entre em uma sessão para começar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Join New Session Card - Second on mobile, first on desktop */}
          <div className="order-2 lg:order-1">
            <Card className="medieval-card h-full">
              <CardHeader className="text-center lg:text-left">
                <div className="w-12 h-12 mx-auto lg:mx-0 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-medieval text-xl">
                  Entrar na Aventura
                </CardTitle>
                <CardDescription className="font-body">
                  Digite o código de convite e escolha seu personagem
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleJoin} className="space-y-6">
                  {/* Invite Code */}
                  <div className="space-y-2">
                    <Label htmlFor="code" className="font-medieval">
                      {t.session.inviteCode}
                    </Label>
                    <Input
                      id="code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="Ex: ABC123"
                      className="font-mono text-xl text-center tracking-widest uppercase"
                      maxLength={6}
                      disabled={isJoining}
                    />
                  </div>

                  {/* Character Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="character" className="font-medieval">
                      Personagem
                    </Label>
                    {loadingCharacters ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    ) : characters.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground font-body text-sm mb-3">
                          Você ainda não tem personagens
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate('/character/create')}
                        >
                          Criar Personagem
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={selectedCharacterId}
                        onValueChange={setSelectedCharacterId}
                        disabled={isJoining}
                      >
                        <SelectTrigger className="font-body">
                          <SelectValue placeholder="Selecione um personagem" />
                        </SelectTrigger>
                        <SelectContent>
                          {characters.map((char) => (
                            <SelectItem key={char.id} value={char.id}>
                              <span className="font-medieval">{char.name}</span>
                              {char.concept && (
                                <span className="text-muted-foreground ml-2 text-sm">
                                  - {char.concept}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full font-medieval text-lg h-12"
                    disabled={isJoining || !inviteCode.trim() || !selectedCharacterId || characters.length === 0}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Entrando...
                      </>
                    ) : (
                      t.session.join
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
