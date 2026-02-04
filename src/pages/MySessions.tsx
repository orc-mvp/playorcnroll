import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  BookOpen, 
  Users, 
  Calendar,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface Session {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  status: string;
  created_at: string;
  updated_at: string;
  participant_count?: number;
}

const statusConfig: Record<string, { label: string; labelEn: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline'; className?: string }> = {
  lobby: { label: 'Aguardando', labelEn: 'Waiting', icon: Pause, variant: 'secondary' },
  active: { label: 'Em Andamento', labelEn: 'Active', icon: Play, variant: 'default' },
  completed: { label: 'Encerrada', labelEn: 'Completed', icon: CheckCircle, variant: 'outline' },
  ended: { label: 'Encerrada', labelEn: 'Ended', icon: CheckCircle, variant: 'outline', className: 'bg-muted/50' },
};

export default function MySessions() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { t, language } = useI18n();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const isNarrator = profile?.role === 'narrator';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      if (isNarrator) {
        // Fetch sessions where user is narrator
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('narrator_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error fetching sessions:', error);
        } else {
          // Get participant counts
          const sessionsWithCounts = await Promise.all(
            (data || []).map(async (session) => {
              const { count } = await supabase
                .from('session_participants')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', session.id);

              return { ...session, participant_count: count || 0 };
            })
          );
          setSessions(sessionsWithCounts);
        }
      } else {
        // Fetch sessions where user is participant (players don't need invite_code)
        const { data: participantData, error } = await supabase
          .from('session_participants')
          .select(`
            session_id,
            sessions:session_id (
              id,
              name,
              description,
              status,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching sessions:', error);
        } else {
          const sessionsData = participantData
            ?.map((p) => p.sessions as unknown as Session)
            .filter(Boolean)
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

          setSessions(sessionsData || []);
        }
      }
      setLoading(false);
    };

    fetchSessions();
  }, [user, isNarrator]);

  const handleSessionClick = (session: Session) => {
    if (session.status === 'active') {
      navigate(`/session/${session.id}`);
    } else if (session.status === 'ended') {
      // For ended sessions, narrator goes to lobby to restart
      navigate(`/session/${session.id}/lobby`);
    } else {
      navigate(`/session/${session.id}/lobby`);
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

  const dateLocale = language === 'pt-BR' ? ptBR : enUS;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-medieval text-lg sm:text-xl md:text-2xl text-foreground truncate">
              {t.session.mySessions}
            </h1>
          </div>

          {isNarrator && (
            <Button asChild className="shrink-0">
              <Link to="/session/create">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t.session.create}</span>
                <span className="sm:hidden">Nova</span>
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {sessions.length === 0 ? (
          <Card className="medieval-card">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-medieval text-xl mb-2">{t.session.noSessions}</h3>
              <p className="text-muted-foreground font-body mb-6">
                {isNarrator
                  ? 'Crie sua primeira sessão para começar uma aventura!'
                  : 'Entre em uma sessão usando o código de convite.'}
              </p>
              {isNarrator ? (
                <Button asChild>
                  <Link to="/session/create">
                    <Plus className="w-4 h-4 mr-2" />
                    {t.session.create}
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/join">
                    <Users className="w-4 h-4 mr-2" />
                    {t.session.join}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => {
              const status = statusConfig[session.status] || statusConfig.lobby;
              const StatusIcon = status.icon;

              return (
                <Card
                  key={session.id}
                  className="medieval-card hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => handleSessionClick(session)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="font-medieval text-lg truncate">
                          {session.name}
                        </CardTitle>
                        {session.description && (
                          <CardDescription className="font-body mt-1 line-clamp-2">
                            {session.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={status.variant} className={`shrink-0 ${status.className || ''}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {language === 'pt-BR' ? status.label : status.labelEn}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className="font-body">
                          {format(new Date(session.updated_at), 'dd MMM yyyy', {
                            locale: dateLocale,
                          })}
                        </span>
                      </div>
                      {isNarrator && session.participant_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="font-body">
                            {session.participant_count} jogador(es)
                          </span>
                        </div>
                      )}
                      {/* Only show invite code to narrators - players don't need to see it */}
                      {isNarrator && (
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {session.invite_code}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
