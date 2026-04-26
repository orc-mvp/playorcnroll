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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Users, Loader2, History, Play, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getSessionRoute } from '@/lib/sessionRoutes';
import {
  getSystemAdapter,
  isStorytellerSystem,
} from '@/lib/storyteller/systemRegistry';
import {
  filterCompatibleCharacters,
  buildInitialTrackerPatch,
} from '@/lib/storyteller/joinHelpers';

interface Character {
  id: string;
  name: string;
  concept: string | null;
  game_system: string;
}

interface ValidatedSession {
  id: string;
  name: string;
  description: string | null;
  status: string;
  game_system: string;
  join_locked?: boolean;
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

/** Label legível do sistema/família. */
function getSystemLabel(gameSystem: string): string {
  if (gameSystem === 'herois_marcados') return 'Heróis Marcados';
  // Família genérica criada pelo seletor de sessão — aceita qualquer ficha WoD.
  if (gameSystem === 'storyteller') return 'Storyteller (WoD)';
  if (isStorytellerSystem(gameSystem)) {
    // Sessões antigas amarradas a um sistema único.
    return `Storyteller (${getSystemAdapter(gameSystem).shortLabel})`;
  }
  return gameSystem;
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
  const [validatedSession, setValidatedSession] = useState<ValidatedSession | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchCharacters = async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, concept, game_system')
        .eq('user_id', user.id);

      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching characters:', error);
      } else {
        setCharacters(data || []);
      }
      setLoadingCharacters(false);
    };

    fetchCharacters();
  }, [user]);

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
        if (import.meta.env.DEV) console.error('Error fetching joined sessions:', error);
      } else if (participations) {
        const sessions: JoinedSession[] = participations
          .filter(p => p.sessions && !['completed'].includes((p.sessions as any).status))
          .map(p => ({
            id: (p.sessions as any).id,
            name: (p.sessions as any).name,
            description: (p.sessions as any).description,
            status: (p.sessions as any).status,
            game_system: (p.sessions as any).game_system || 'herois_marcados',
            characterName: (p.characters as any)?.name || t.session.noCharacter,
            joinedAt: p.joined_at,
          }));
        setJoinedSessions(sessions);
      }

      setLoadingSessions(false);
    };

    fetchJoinedSessions();
  }, [user, t.session.noCharacter]);

  const handleValidateCode = async () => {
    const codeToUse = inviteCode.trim().toUpperCase();

    if (!codeToUse || codeToUse.length < 6) {
      toast({
        title: t.session.invalidCode,
        description: t.session.enterFullCode,
        variant: 'destructive',
      });
      return;
    }

    setIsValidating(true);

    try {
      const { data: validateData, error: validateError } = await supabase.functions.invoke(
        'validate-invite-code',
        { body: { invite_code: codeToUse } }
      );

      if (validateError || !validateData?.session) {
        throw new Error(t.session.sessionNotFoundWithCode);
      }

      setValidatedSession(validateData.session);
      setSelectedCharacterId('');

      toast({
        title: t.session.sessionFound,
        description: validateData.session.name,
      });
    } catch (error: any) {
      toast({
        title: t.session.errorValidatingCode,
        description: error.message || t.session.checkCodeAndRetry,
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatedSession) {
      toast({
        title: t.session.validateFirst,
        description: t.session.clickVerify,
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCharacterId) {
      toast({
        title: t.session.selectCharacter,
        description: t.session.selectCharacterDesc,
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setIsJoining(true);

    try {
      const sessionData = validatedSession;

      // Existing participant?
      const { data: existingParticipant } = await supabase
        .from('session_participants')
        .select('id, character_id, sheet_locked')
        .eq('session_id', sessionData.id)
        .eq('user_id', user.id)
        .single();

      if (existingParticipant) {
        if (selectedCharacterId && existingParticipant.character_id !== selectedCharacterId) {
          if (existingParticipant.sheet_locked) {
            toast({
              title: t.sessionRejoin.sheetLockedByNarrator,
              variant: 'destructive',
            });
            setIsJoining(false);
            return;
          }

          const { data: newCharData } = await supabase
            .from('characters')
            .select('game_system, vampiro_data')
            .eq('id', selectedCharacterId)
            .single();

          // Patch via adapter (Vampiro: Sangue+Vontade; Lobisomem: Gnose+Fúria+Vontade+Forma; etc.)
          const patch = buildInitialTrackerPatch(
            newCharData?.game_system || sessionData.game_system,
            newCharData?.vampiro_data,
          );

          const { error: updateError } = await supabase
            .from('session_participants')
            .update({ character_id: selectedCharacterId, ...patch })
            .eq('id', existingParticipant.id);

          if (updateError) throw updateError;

          toast({ title: t.sessionRejoin.characterUpdated });
        }

        if (sessionData.status === 'active') {
          navigate(getSessionRoute(sessionData.id, sessionData.game_system));
        } else {
          navigate(`/session/${sessionData.id}/lobby`);
        }
        return;
      }

      // New player
      if (sessionData.join_locked) {
        toast({
          title: t.managePlayers.joinLockedByNarrator,
          variant: 'destructive',
        });
        setIsJoining(false);
        return;
      }

      const { data: characterData } = await supabase
        .from('characters')
        .select('game_system, vampiro_data')
        .eq('id', selectedCharacterId)
        .single();

      const patch = buildInitialTrackerPatch(
        characterData?.game_system || sessionData.game_system,
        characterData?.vampiro_data,
      );

      const { error: joinError } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionData.id,
          user_id: user.id,
          character_id: selectedCharacterId,
          ...patch,
        });

      if (joinError) throw joinError;

      toast({
        title: t.session.joinedSession,
        description: t.session.waitingNarratorStart,
      });

      if (sessionData.status === 'active') {
        navigate(getSessionRoute(sessionData.id, sessionData.game_system));
      } else {
        navigate(`/session/${sessionData.id}/lobby`);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error joining session:', error);
      toast({
        title: t.session.errorJoiningSession,
        description: error.message || t.session.checkCodeAndRetry,
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleRejoinSession = (session: JoinedSession) => {
    if (session.status === 'active') {
      navigate(getSessionRoute(session.id, session.game_system));
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
            {t.session.statusActive}
          </Badge>
        );
      case 'lobby':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            {t.session.statusWaiting}
          </Badge>
        );
      case 'ended':
        return (
          <Badge className="bg-muted text-muted-foreground border-muted-foreground/30">
            <XCircle className="w-3 h-3 mr-1" />
            {t.session.statusEnded}
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Previously Joined Sessions */}
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
                    {t.session.myAdventures}
                  </CardTitle>
                  <CardDescription className="font-body text-center lg:text-left">
                    {t.session.sessionsParticipated}
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
                            {t.session.playingAs} {session.characterName}
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
                    {t.session.noAdventuresYet}
                  </p>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    {t.session.joinToStart}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Join New Session Card */}
          <div className="order-2 lg:order-1">
            <Card className="medieval-card h-full">
              <CardHeader className="text-center lg:text-left">
                <div className="w-12 h-12 mx-auto lg:mx-0 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-medieval text-xl">
                  {t.session.joinAdventure}
                </CardTitle>
                <CardDescription className="font-body">
                  {t.session.enterCodeAndChoose}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleJoin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="font-medieval">
                      {t.session.inviteCode}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="code"
                        value={inviteCode}
                        onChange={(e) => {
                          setInviteCode(e.target.value.toUpperCase());
                          setValidatedSession(null);
                          setSelectedCharacterId('');
                        }}
                        placeholder={t.session.inviteCodePlaceholder}
                        className="font-mono text-xl text-center tracking-widest uppercase flex-1"
                        maxLength={6}
                        disabled={isJoining || isValidating}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleValidateCode}
                        disabled={isValidating || inviteCode.length < 6 || !!validatedSession}
                      >
                        {isValidating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : validatedSession ? (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        ) : (
                          t.session.verify
                        )}
                      </Button>
                    </div>
                    {validatedSession && (
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                        <p className="text-sm font-medieval text-primary">{validatedSession.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.session.systemLabel} {getSystemLabel(validatedSession.game_system)}
                        </p>
                      </div>
                    )}
                  </div>

                  {validatedSession && (
                    <div className="space-y-2">
                      <Label htmlFor="character" className="font-medieval">
                        {t.session.character} ({getSystemLabel(validatedSession.game_system)})
                      </Label>
                      {loadingCharacters ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      ) : (() => {
                        const compatibleCharacters = filterCompatibleCharacters(
                          characters,
                          validatedSession.game_system,
                        );

                        if (compatibleCharacters.length === 0) {
                          return (
                            <div className="text-center py-4 bg-muted/30 rounded-lg">
                              <p className="text-muted-foreground font-body text-sm mb-3">
                                {t.session.noCharactersForSystem}{' '}
                                <span className="font-medieval text-foreground">
                                  {getSystemLabel(validatedSession.game_system)}
                                </span>
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate(`/character/create?system=${validatedSession.game_system}&returnTo=/join/${inviteCode.trim().toUpperCase()}`)}
                              >
                                {t.session.createCharacterFor} {getSystemLabel(validatedSession.game_system)}
                              </Button>
                            </div>
                          );
                        }

                        return (
                          <Select
                            value={selectedCharacterId}
                            onValueChange={setSelectedCharacterId}
                            disabled={isJoining}
                          >
                            <SelectTrigger className="font-body">
                              <SelectValue placeholder={t.session.selectCharacterPlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {compatibleCharacters.map((char) => {
                                const adapter = isStorytellerSystem(char.game_system)
                                  ? getSystemAdapter(char.game_system)
                                  : null;
                                return (
                                  <SelectItem key={char.id} value={char.id}>
                                    <span className="font-medieval">{char.name}</span>
                                    {adapter && (
                                      <span className="text-muted-foreground ml-2 text-xs">
                                        [{adapter.shortLabel}]
                                      </span>
                                    )}
                                    {char.concept && (
                                      <span className="text-muted-foreground ml-2 text-sm">
                                        - {char.concept}
                                      </span>
                                    )}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full font-medieval text-lg h-12"
                    disabled={isJoining || !validatedSession || !selectedCharacterId}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        {t.session.joining}
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
