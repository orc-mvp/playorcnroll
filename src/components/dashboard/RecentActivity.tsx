import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Scroll, 
  BookOpen, 
  Users, 
  Dices, 
  UserPlus,
  Sword,
  Play,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'session_created' | 'session_joined' | 'session_started' | 'session_ended' | 'character_created' | 'dice_rolled';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
  metadata?: Record<string, any>;
}

interface RecentActivityProps {
  userId: string;
  isNarrator: boolean;
}

export function RecentActivity({ userId, isNarrator }: RecentActivityProps) {
  const { language } = useI18n();
  const dateLocale = language === 'pt-BR' ? ptBR : enUS;
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      const allActivities: ActivityItem[] = [];

      try {
        if (isNarrator) {
          // Fetch narrator's sessions
          const { data: sessions } = await supabase
            .from('sessions')
            .select('id, name, status, game_system, created_at, updated_at')
            .eq('narrator_id', userId)
            .order('updated_at', { ascending: false })
            .limit(10);

          if (sessions) {
            sessions.forEach(session => {
              // Determine correct route based on game system
              const getSessionLink = (s: typeof session) => {
                if (s.status === 'active') {
                  return s.game_system === 'vampiro_v3' 
                    ? `/session/vampire/${s.id}` 
                    : `/session/${s.id}`;
                }
                return `/session/${s.id}/lobby`;
              };

              // Session created
              allActivities.push({
                id: `session-created-${session.id}`,
                type: 'session_created',
                title: language === 'pt-BR' ? 'Sessão criada' : 'Session created',
                description: session.name,
                timestamp: session.created_at,
                link: getSessionLink(session),
                metadata: { status: session.status }
              });

              // Session status changes
              if (session.status === 'active' && session.updated_at !== session.created_at) {
                allActivities.push({
                  id: `session-started-${session.id}`,
                  type: 'session_started',
                  title: language === 'pt-BR' ? 'Sessão iniciada' : 'Session started',
                  description: session.name,
                  timestamp: session.updated_at,
                  link: getSessionLink(session),
                  metadata: { status: session.status }
                });
              }

              if (session.status === 'ended') {
                allActivities.push({
                  id: `session-ended-${session.id}`,
                  type: 'session_ended',
                  title: language === 'pt-BR' ? 'Sessão encerrada' : 'Session ended',
                  description: session.name,
                  timestamp: session.updated_at,
                  link: `/session/${session.id}/lobby`,
                  metadata: { status: session.status }
                });
              }
            });
          }

          // Fetch recent events from narrator's sessions
          const { data: events } = await supabase
            .from('session_events')
            .select(`
              id, 
              event_type, 
              event_data, 
              created_at,
              sessions!inner(id, name, narrator_id)
            `)
            .eq('sessions.narrator_id', userId)
            .in('event_type', ['dice_rolled', 'player_joined', 'scene_created'])
            .order('created_at', { ascending: false })
            .limit(10);

          if (events) {
            events.forEach(event => {
              const eventData = event.event_data as Record<string, any>;
              const sessionName = (event.sessions as any)?.name || '';

              if (event.event_type === 'dice_rolled') {
                allActivities.push({
                  id: `event-${event.id}`,
                  type: 'dice_rolled',
                  title: language === 'pt-BR' ? 'Rolagem de dados' : 'Dice roll',
                  description: `${eventData.character_name || 'Jogador'} - ${sessionName}`,
                  timestamp: event.created_at,
                  link: `/session/${(event.sessions as any)?.id}`,
                  metadata: eventData
                });
              } else if (event.event_type === 'player_joined') {
                allActivities.push({
                  id: `event-${event.id}`,
                  type: 'session_joined',
                  title: language === 'pt-BR' ? 'Jogador entrou' : 'Player joined',
                  description: `${eventData.player_name || 'Jogador'} - ${sessionName}`,
                  timestamp: event.created_at,
                  link: `/session/${(event.sessions as any)?.id}`,
                  metadata: eventData
                });
              }
            });
          }
        } else {
          // Player: Fetch characters
          const { data: characters } = await supabase
            .from('characters')
            .select('id, name, created_at, updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(5);

          if (characters) {
            characters.forEach(char => {
              allActivities.push({
                id: `char-${char.id}`,
                type: 'character_created',
                title: language === 'pt-BR' ? 'Personagem criado' : 'Character created',
                description: char.name,
                timestamp: char.created_at,
                link: `/character/${char.id}`
              });
            });
          }

          // Player: Fetch sessions they participate in
          const { data: participations } = await supabase
            .from('session_participants')
            .select(`
              id,
              joined_at,
              sessions(id, name, status, game_system)
            `)
            .eq('user_id', userId)
            .order('joined_at', { ascending: false })
            .limit(5);

          if (participations) {
            participations.forEach(p => {
              const session = p.sessions as any;
              if (session) {
                const link = session.status === 'active' 
                  ? (session.game_system === 'vampiro_v3' 
                    ? `/session/vampire/${session.id}` 
                    : `/session/${session.id}`)
                  : `/session/${session.id}/lobby`;
                
                allActivities.push({
                  id: `joined-${p.id}`,
                  type: 'session_joined',
                  title: language === 'pt-BR' ? 'Entrou na sessão' : 'Joined session',
                  description: session.name,
                  timestamp: p.joined_at,
                  link,
                  metadata: { status: session.status }
                });
              }
            });
          }

          // Player: Fetch their dice rolls
          const { data: rolls } = await supabase
            .from('test_rolls')
            .select(`
              id,
              dice1,
              dice2,
              total,
              result,
              rolled_at,
              characters(name),
              tests(
                attribute,
                sessions(id, name)
              )
            `)
            .eq('user_id', userId)
            .not('rolled_at', 'is', null)
            .order('rolled_at', { ascending: false })
            .limit(5);

          if (rolls) {
            rolls.forEach(roll => {
              const charName = (roll.characters as any)?.name || 'Personagem';
              const sessionName = (roll.tests as any)?.sessions?.name || '';
              const attr = (roll.tests as any)?.attribute || '';

              allActivities.push({
                id: `roll-${roll.id}`,
                type: 'dice_rolled',
                title: language === 'pt-BR' ? 'Rolagem de dados' : 'Dice roll',
                description: `${charName} (${attr}) - ${roll.total}`,
                timestamp: roll.rolled_at!,
                link: `/session/${(roll.tests as any)?.sessions?.id}`,
                metadata: { result: roll.result, dice1: roll.dice1, dice2: roll.dice2 }
              });
            });
          }
        }

        // Sort all activities by timestamp (most recent first)
        allActivities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setActivities(allActivities.slice(0, 10));
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [userId, isNarrator, language]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'session_created':
        return <BookOpen className="w-4 h-4" />;
      case 'session_joined':
        return <UserPlus className="w-4 h-4" />;
      case 'session_started':
        return <Play className="w-4 h-4" />;
      case 'session_ended':
        return <CheckCircle className="w-4 h-4" />;
      case 'character_created':
        return <Sword className="w-4 h-4" />;
      case 'dice_rolled':
        return <Dices className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'session_created':
        return 'text-blue-500';
      case 'session_joined':
        return 'text-green-500';
      case 'session_started':
        return 'text-emerald-500';
      case 'session_ended':
        return 'text-muted-foreground';
      case 'character_created':
        return 'text-primary';
      case 'dice_rolled':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">Sucesso</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs">Parcial</Badge>;
      case 'failure':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs">Falha</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="medieval-card">
      <CardHeader>
        <CardTitle className="font-medieval flex items-center gap-2">
          <Scroll className="w-5 h-5 text-primary" />
          {language === 'pt-BR' ? 'Atividade Recente' : 'Recent Activity'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground font-body">
            <div className="animate-pulse">
              {language === 'pt-BR' ? 'Carregando...' : 'Loading...'}
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground font-body">
            <Scroll className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>{language === 'pt-BR' ? 'Nenhuma atividade recente' : 'No recent activity'}</p>
            <p className="text-sm mt-2">
              {isNarrator 
                ? (language === 'pt-BR' ? 'Crie uma sessão para começar!' : 'Create a session to get started!')
                : (language === 'pt-BR' ? 'Crie um personagem ou entre em uma sessão!' : 'Create a character or join a session!')
              }
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  to={activity.link || '#'}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-colors group"
                >
                  <div className={`mt-0.5 ${getActivityColor(activity.type)} group-hover:scale-110 transition-transform`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-body text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      {activity.metadata?.result && getResultBadge(activity.metadata.result)}
                    </div>
                    <p className="font-body text-xs text-muted-foreground truncate">
                      {activity.description}
                    </p>
                    <span className="text-xs text-muted-foreground/70">
                      {formatDistanceToNow(new Date(activity.timestamp), { 
                        addSuffix: true, 
                        locale: dateLocale 
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
