import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Sword, Moon, Trash2, Crown, Users as UsersIcon } from 'lucide-react';
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

interface SessionWithRole {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  status: string;
  game_system: string;
  created_at: string;
  updated_at: string;
  narrator_id: string;
  participant_count?: number;
  contextRole: 'narrator' | 'player';
}

const statusConfig: Record<string, { label: string; labelEn: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline'; className?: string }> = {
  lobby: { label: 'Aguardando', labelEn: 'Waiting', icon: Pause, variant: 'secondary' },
  active: { label: 'Em Andamento', labelEn: 'Active', icon: Play, variant: 'default' },
  completed: { label: 'Encerrada', labelEn: 'Completed', icon: CheckCircle, variant: 'outline' },
  ended: { label: 'Encerrada', labelEn: 'Ended', icon: CheckCircle, variant: 'outline', className: 'bg-muted/50' },
};

export default function MySessions() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useI18n();

  const [sessions, setSessions] = useState<SessionWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteSession, setDeleteSession] = useState<SessionWithRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      // Fetch both narrator and participant sessions in parallel
      const [narratorResult, participantResult] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .eq('narrator_id', user.id),
        supabase
          .from('session_participants')
          .select(`
            session_id,
            sessions:session_id (*)
          `)
          .eq('user_id', user.id),
      ]);

      const allSessions: SessionWithRole[] = [];

      // Add narrator sessions
      if (narratorResult.data) {
        // Get participant counts for narrator sessions
        const withCounts = await Promise.all(
          narratorResult.data.map(async (session) => {
            const { count } = await supabase
              .from('session_participants')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.id);

            return { ...session, participant_count: count || 0, contextRole: 'narrator' as const };
          })
        );
        allSessions.push(...withCounts);
      }

      // Add participant sessions (exclude ones where user is also narrator)
      if (participantResult.data) {
        const narratorIds = new Set(narratorResult.data?.map(s => s.id) || []);
        participantResult.data.forEach((p) => {
          const session = p.sessions as unknown as SessionWithRole;
          if (session && !narratorIds.has(session.id)) {
            allSessions.push({ ...session, contextRole: 'player' });
          }
        });
      }

      // Sort by updated_at
      allSessions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setSessions(allSessions);
      setLoading(false);
    };

    fetchSessions();
  }, [user]);

  const handleSessionClick = (session: SessionWithRole) => {
    if (session.status === 'active') {
      const route = session.game_system === 'vampiro_v3' 
        ? `/session/vampire/${session.id}` 
        : `/session/${session.id}`;
      navigate(route);
    } else {
      navigate(`/session/${session.id}/lobby`);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteSession) return;
    
    setIsDeleting(true);
    
    try {
      // Delete in order to respect foreign key constraints
      const { data: tests } = await supabase
        .from('tests')
        .select('id')
        .eq('session_id', deleteSession.id);
      
      if (tests && tests.length > 0) {
        const testIds = tests.map(t => t.id);
        await supabase.from('test_rolls').delete().in('test_id', testIds);
      }
      
      await supabase.from('tests').delete().eq('session_id', deleteSession.id);
      await supabase.from('complications').delete().eq('session_id', deleteSession.id);
      await supabase.from('session_events').delete().eq('session_id', deleteSession.id);
      await supabase.from('session_participants').delete().eq('session_id', deleteSession.id);
      await supabase.from('scenes').delete().eq('session_id', deleteSession.id);
      
      const { error } = await supabase.from('sessions').delete().eq('id', deleteSession.id);
      if (error) throw error;
      
      setSessions(prev => prev.filter(s => s.id !== deleteSession.id));
      toast.success(language === 'pt-BR' ? 'Sessão excluída com sucesso' : 'Session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error(language === 'pt-BR' ? 'Erro ao excluir sessão' : 'Error deleting session');
    } finally {
      setIsDeleting(false);
      setDeleteSession(null);
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

          <Button asChild className="shrink-0">
            <Link to="/session/create">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t.session.create}</span>
              <span className="sm:hidden">Nova</span>
            </Link>
          </Button>
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
                {language === 'pt-BR'
                  ? 'Crie uma sessão ou entre em uma com código de convite!'
                  : 'Create a session or join one with an invite code!'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link to="/session/create">
                    <Plus className="w-4 h-4 mr-2" />
                    {t.session.create}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/join">
                    <Users className="w-4 h-4 mr-2" />
                    {t.session.join}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => {
              const status = statusConfig[session.status] || statusConfig.lobby;
              const StatusIcon = status.icon;
              const isNarrator = session.contextRole === 'narrator';

              return (
                <Card
                  key={session.id}
                  className="medieval-card hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => handleSessionClick(session)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {session.game_system === 'vampiro_v3' ? (
                            <Moon className="w-4 h-4 text-destructive shrink-0" />
                          ) : (
                            <Sword className="w-4 h-4 text-primary shrink-0" />
                          )}
                          <span className="text-xs text-muted-foreground font-body">
                            {session.game_system === 'vampiro_v3' ? 'Vampiro 3ª Ed.' : 'Heróis Marcados'}
                          </span>
                          {/* Contextual role badge */}
                          <Badge variant="outline" className="text-xs">
                            {isNarrator ? (
                              <><Crown className="w-3 h-3 mr-1" />{t.roles.narrator}</>
                            ) : (
                              <><UsersIcon className="w-3 h-3 mr-1" />{t.roles.player}</>
                            )}
                          </Badge>
                        </div>
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
                            {session.participant_count} {language === 'pt-BR' ? 'jogador(es)' : 'player(s)'}
                          </span>
                        </div>
                      )}
                      {isNarrator && (
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {session.invite_code}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteSession(session);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteSession} onOpenChange={(open) => !open && setDeleteSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-medieval">
              {language === 'pt-BR' ? 'Excluir Sessão' : 'Delete Session'}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              {language === 'pt-BR' 
                ? `Tem certeza que deseja excluir a sessão "${deleteSession?.name}"? Esta ação não pode ser desfeita. Todos os dados da sessão (cenas, eventos, testes) serão permanentemente removidos.`
                : `Are you sure you want to delete the session "${deleteSession?.name}"? This action cannot be undone. All session data (scenes, events, tests) will be permanently removed.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting 
                ? (language === 'pt-BR' ? 'Excluindo...' : 'Deleting...') 
                : (language === 'pt-BR' ? 'Excluir' : 'Delete')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
