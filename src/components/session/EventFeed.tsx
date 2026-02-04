import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Scroll, 
  BookOpen, 
  Dices, 
  AlertTriangle, 
  Sparkles,
  UserPlus,
  MessageSquare,
  Users,
  CheckCircle,
  XCircle,
  MinusCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import type { SessionEvent } from '@/pages/Session';
import { cn } from '@/lib/utils';

interface EventFeedProps {
  events: SessionEvent[];
  isNarrator?: boolean;
}

const ITEMS_PER_PAGE = 10;
const MAX_EVENTS = 100;

// Helper to get translated attribute name
const getAttributeName = (attr: string, lang: string, t: any): string => {
  const attrKey = attr as keyof typeof t.attributes;
  return t.attributes[attrKey] || attr;
};

const getEventConfig = (t: any) => ({
  scene_created: {
    icon: BookOpen,
    color: 'text-blue-500',
    label: (data: Record<string, any>, lang: string) => lang === 'pt-BR' 
      ? `Nova cena: ${data.scene_name}` 
      : `New scene: ${data.scene_name}`,
  },
  test_requested: {
    icon: Dices,
    color: 'text-yellow-500',
    label: (data: Record<string, any>, lang: string) => {
      const isGroup = Array.isArray(data.players) && data.players.length > 1;
      const attrName = getAttributeName(data.attribute, lang, t);
      const playerNames = data.player_names?.join(', ') || '';
      return lang === 'pt-BR'
        ? `Teste ${isGroup ? 'em grupo ' : ''}de ${attrName}${playerNames ? ` para ${playerNames}` : ''}`
        : `${isGroup ? 'Group ' : ''}${attrName} test${playerNames ? ` for ${playerNames}` : ''}`;
    },
  },
  dice_rolled: {
    icon: Dices,
    color: 'text-green-500',
    label: (data: Record<string, any>, lang: string) => {
      const attrName = getAttributeName(data.attribute, lang, t);
      const resultText = data.result === 'success' 
        ? (lang === 'pt-BR' ? 'Sucesso' : 'Success')
        : data.result === 'partial' 
          ? (lang === 'pt-BR' ? 'Parcial' : 'Partial')
          : (lang === 'pt-BR' ? 'Falha' : 'Failure');
      const charName = data.character_name || (lang === 'pt-BR' ? 'Jogador' : 'Player');
      const groupTag = data.is_group_test ? (lang === 'pt-BR' ? ' [Grupo]' : ' [Group]') : '';
      return `${charName} (${attrName}): ${data.dice1}+${data.dice2}=${data.total} → ${resultText}${groupTag}`;
    },
  },
  group_test_completed: {
    icon: Users,
    color: 'text-purple-500',
    label: (data: Record<string, any>, lang: string) => {
      const attrName = getAttributeName(data.attribute, lang, t);
      const resultText = data.finalResult === 'success'
        ? (lang === 'pt-BR' ? 'Sucesso do Grupo' : 'Group Success')
        : data.finalResult === 'partial'
          ? (lang === 'pt-BR' ? 'Sucesso Parcial do Grupo' : 'Group Partial')
          : (lang === 'pt-BR' ? 'Falha do Grupo' : 'Group Failure');
      return `${attrName}: ${resultText}`;
    },
  },
  pull_group: {
    icon: Users,
    color: 'text-yellow-500',
    label: (data: Record<string, any>, lang: string) => {
      const charName = data.character_name || (lang === 'pt-BR' ? 'Jogador' : 'Player');
      return lang === 'pt-BR'
        ? `${charName} puxou o grupo! +1 sucesso`
        : `${charName} pulled the group! +1 success`;
    },
  },
  test_completed: {
    icon: Dices,
    color: 'text-green-500',
    label: (data: Record<string, any>, lang: string) => {
      const result = data.result === 'success' ? (lang === 'pt-BR' ? 'Sucesso' : 'Success')
        : data.result === 'partial' ? (lang === 'pt-BR' ? 'Sucesso Parcial' : 'Partial Success')
        : (lang === 'pt-BR' ? 'Falha' : 'Failure');
      return `${data.character_name}: ${result} (${data.total})`;
    },
  },
  extreme_positive: {
    icon: Sparkles,
    color: 'text-yellow-400',
    label: (data: Record<string, any>, lang: string) => lang === 'pt-BR'
      ? `${data.character_name} teve um Extremo Positivo!`
      : `${data.character_name} got a Positive Extreme!`,
  },
  extreme_negative: {
    icon: AlertTriangle,
    color: 'text-red-500',
    label: (data: Record<string, any>, lang: string) => lang === 'pt-BR'
      ? `${data.character_name} teve um Extremo Negativo!`
      : `${data.character_name} got a Negative Extreme!`,
  },
  complication_created: {
    icon: AlertTriangle,
    color: 'text-red-500',
    label: (data: Record<string, any>, lang: string) => lang === 'pt-BR'
      ? `Complicação criada para ${data.character_name}`
      : `Complication created for ${data.character_name}`,
  },
  complication_manifested: {
    icon: Sparkles,
    color: 'text-green-500',
    label: (data: Record<string, any>, lang: string) => lang === 'pt-BR'
      ? `Complicação resolvida: ${data.description?.substring(0, 30)}...`
      : `Complication resolved: ${data.description?.substring(0, 30)}...`,
  },
  player_joined: {
    icon: UserPlus,
    color: 'text-green-500',
    label: (data: Record<string, any>, lang: string) => lang === 'pt-BR'
      ? `${data.player_name} entrou na sessão`
      : `${data.player_name} joined the session`,
  },
  narrator_message: {
    icon: MessageSquare,
    color: 'text-primary',
    label: (data: Record<string, any>) => data.message,
  },
});

export function EventFeed({ events, isNarrator = false }: EventFeedProps) {
  const { t, language } = useI18n();
  const dateLocale = language === 'pt-BR' ? ptBR : enUS;
  const [currentPage, setCurrentPage] = useState(0);
  
  // Get event config with translations
  const eventConfig = useMemo(() => getEventConfig(t), [t]);

  // Filter out hidden complication events for players and limit to MAX_EVENTS
  const filteredEvents = useMemo(() => {
    const filtered = events.filter(event => {
      if (isNarrator) return true;
      if (event.event_type === 'complication_created') {
        const eventData = event.event_data as any;
        return eventData.is_visible !== false;
      }
      return true;
    });
    // Limit to the last MAX_EVENTS
    return filtered.slice(0, MAX_EVENTS);
  }, [events, isNarrator]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Card className="medieval-card h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Scroll className="w-5 h-5 text-primary" />
            {t.scene.events}
          </CardTitle>
          {filteredEvents.length > 0 && (
            <span className="text-xs text-muted-foreground font-body">
              {filteredEvents.length} {language === 'pt-BR' ? 'eventos' : 'events'}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-1 px-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-body">
              <Scroll className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{language === 'pt-BR' ? 'Nenhum evento ainda' : 'No events yet'}</p>
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {paginatedEvents.map((event) => {
                const config = eventConfig[event.event_type as keyof typeof eventConfig] || {
                  icon: MessageSquare,
                  color: 'text-muted-foreground',
                  label: () => event.event_type,
                };
                const Icon = config.icon;

                return (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border border-border/50",
                      event.event_type === 'group_test_completed' 
                        ? "bg-purple-500/10 border-purple-500/30"
                        : "bg-muted/30"
                    )}
                  >
                    <div className={`mt-0.5 ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm">
                        {config.label(event.event_data, language)}
                      </p>
                      
                      {/* Extra info for dice rolls */}
                      {event.event_type === 'dice_rolled' && (
                        <div className="flex items-center gap-2 mt-1">
                          {(event.event_data as any).has_positive_extreme && (
                            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Extremo+
                            </Badge>
                          )}
                          {(event.event_data as any).has_negative_extreme && (
                            <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Extremo-
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Extra info for group test results */}
                      {event.event_type === 'group_test_completed' && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {(event.event_data as any).successes}
                          </Badge>
                          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs">
                            <MinusCircle className="w-3 h-3 mr-1" />
                            {(event.event_data as any).partials}
                          </Badge>
                          <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs">
                            <XCircle className="w-3 h-3 mr-1" />
                            {(event.event_data as any).failures}
                          </Badge>
                          {(event.event_data as any).pullGroupCount > 0 && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                              +{(event.event_data as any).pullGroupCount} Pull
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Scene badge */}
                      {(event.event_data as any).scene_name && (
                        <Badge variant="outline" className="text-xs mr-1">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {(event.event_data as any).scene_name}
                        </Badge>
                      )}

                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), 'HH:mm:ss', { locale: dateLocale })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 0}
              className="h-8"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {language === 'pt-BR' ? 'Anterior' : 'Previous'}
            </Button>
            <span className="text-xs text-muted-foreground font-body">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
              className="h-8"
            >
              {language === 'pt-BR' ? 'Próximo' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
