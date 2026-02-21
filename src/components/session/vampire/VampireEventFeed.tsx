import { useState, useMemo, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Scroll,
  Dices,
  BookOpen,
  CheckCircle2,
  XCircle,
  Star,
  AlertCircle,
  Lock,
  Moon,
  Skull,
  AlertTriangle,
  Droplets,
  Sparkles,
  Heart,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SessionEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
  scene_id: string | null;
  session_id: string;
}

interface VampireEventFeedProps {
  events: SessionEvent[];
  currentUserId?: string;
  isNarrator?: boolean;
}

const ITEMS_PER_PAGE = 10;
const MAX_EVENTS = 100;

// Helper function to get tracker icon
const getTrackerIcon = (type: string) => {
  switch (type) {
    case 'blood': return Droplets;
    case 'willpower': return Sparkles;
    case 'health': return Heart;
    case 'humanity': return Moon;
    default: return Moon;
  }
};

// Helper function to get tracker label
const getTrackerLabel = (type: string, t: any) => {
  switch (type) {
    case 'blood': return t.vampiro?.bloodPool || 'Sangue';
    case 'willpower': return t.vampiro?.willpowerCurrent || 'Vontade';
    case 'health': return t.vampiro?.healthLevels || 'Vitalidade';
    case 'humanity': return t.vampiro?.humanity || 'Humanidade';
    default: return type;
  }
};

// Helper function to get tracker color
const getTrackerColor = (type: string) => {
  switch (type) {
    case 'blood': return 'text-destructive';
    case 'health': return 'text-destructive';
    case 'willpower': return 'text-foreground';
    case 'humanity': return 'text-foreground';
    default: return 'text-muted-foreground';
  }
};

// Helper to get test label
const getTestLabel = (eventData: Record<string, unknown>, t: any): string => {
  const testType = eventData.testType as string;
  const testConfig = eventData as Record<string, unknown>;

  if (testType === 'attribute_ability') {
    const attr = testConfig.attribute as string;
    const ability = testConfig.ability as string;
    const attrLabel = t.vampiro?.[attr] || attr;
    const abilityLabel = t.vampiro?.[ability] || ability;
    return `${attrLabel} + ${abilityLabel}`;
  }
  if (testType === 'willpower') return t.vampiro?.willpower || 'Willpower';
  if (testType === 'humanity') return t.vampiro?.humanity || 'Humanity';
  if (testType === 'virtue') {
    const virtue = testConfig.virtue as string;
    return t.vampiro?.[virtue] || virtue;
  }
  return testType;
};

// Event configuration with colors and icons
const getVampireEventConfig = (t: any) => ({
  scene_started: {
    icon: BookOpen,
    color: 'text-destructive',
    bgClass: 'bg-destructive/10 border-destructive/30',
    label: (data: Record<string, unknown>) => data.scene_name as string,
  },
  scene_changed: {
    icon: BookOpen,
    color: 'text-destructive',
    bgClass: 'bg-destructive/10 border-destructive/30',
    label: (data: Record<string, unknown>) => data.scene_name as string,
  },
  vampire_test_requested: {
    icon: Dices,
    color: 'text-amber-500',
    bgClass: 'bg-muted/30',
    label: (data: Record<string, unknown>) => 
      `${t.vampiroTests?.requestTest || 'Teste'}: ${getTestLabel(data, t)}`,
  },
  vampire_test_result: {
    icon: Dices,
    color: 'text-green-500',
    bgClass: 'bg-muted/30',
    label: (data: Record<string, unknown>) => {
      const charName = data.character_name as string;
      const testConfig = data.test_config as Record<string, unknown>;
      return `${charName}: ${getTestLabel(testConfig || {}, t)}`;
    },
  },
  tracker_change: {
    icon: Moon,
    color: 'text-destructive',
    bgClass: 'bg-muted/30',
    label: (data: Record<string, unknown>) => {
      const charName = data.character_name as string;
      const trackerType = data.tracker_type as string;
      return `${charName} • ${getTrackerLabel(trackerType, t)}`;
    },
  },
  critical_state: {
    icon: Skull,
    color: 'text-destructive',
    bgClass: 'bg-destructive/20 border-destructive/40',
    label: (data: Record<string, unknown>) => {
      const charName = data.character_name as string;
      const type = data.type as string;
      const isBlood = type === 'blood_depleted';
      return `${charName} - ${isBlood ? t.vampiro.bloodDepleted : t.vampiro.willpowerDepleted}`;
    },
  },
  narrator_roll: {
    icon: Dices,
    color: 'text-destructive',
    bgClass: 'bg-muted/30',
    label: (data: Record<string, unknown>) =>
      `${t.vampiroTests?.narratorRolled || 'Narrador rolou'}: ${data.dice_count}d10`,
  },
  player_joined: {
    icon: UserPlus,
    color: 'text-green-500',
    bgClass: 'bg-muted/30',
    label: (data: Record<string, unknown>) => 
      `${data.player_name || data.character_name} ${t.eventFeed.joinedSession}`,
  },
});

export function VampireEventFeed({ events, currentUserId, isNarrator = false }: VampireEventFeedProps) {
  const { t, language } = useI18n();
  const dateLocale = language === 'pt-BR' ? ptBR : enUS;
  const [currentPage, setCurrentPage] = useState(0);
  const prevEventsLength = useRef(events.length);

  // Reset to page 0 when new events arrive
  useEffect(() => {
    if (events.length > prevEventsLength.current) {
      setCurrentPage(0);
    }
    prevEventsLength.current = events.length;
  }, [events.length]);

  // Get event config with translations
  const eventConfig = useMemo(() => getVampireEventConfig(t), [t]);

  // Limit to MAX_EVENTS
  const filteredEvents = useMemo(() => events.slice(0, MAX_EVENTS), [events]);

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

  // Render test result with dice display
  const renderTestResult = (eventData: Record<string, unknown>) => {
    const characterName = eventData.character_name as string;
    const testConfig = eventData.test_config as Record<string, unknown>;
    const isPrivate = eventData.is_private as boolean;
    const isBotch = eventData.is_botch as boolean;
    const isExceptional = eventData.is_exceptional as boolean;
    const finalSuccesses = eventData.final_successes as number;
    const baseResults = eventData.base_results as number[];
    const extraResults = (eventData.extra_results as number[]) || [];
    const difficulty = testConfig?.difficulty as number;
    const dicePool = eventData.dice_pool as number;

    return (
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          {isBotch ? (
            <XCircle className="w-4 h-4 text-destructive shrink-0" />
          ) : isExceptional ? (
            <Star className="w-4 h-4 text-yellow-500 shrink-0" />
          ) : finalSuccesses > 0 ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-medieval text-sm">{characterName}</span>
          <span className="text-xs text-muted-foreground">
            {t.vampiroTests?.testedWith || 'testou'}
          </span>
          <span className="text-sm font-medium">
            {getTestLabel(testConfig || {}, t)}
          </span>
          {isPrivate && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>

        {/* Dice display */}
        <div className="flex flex-wrap gap-1">
          {baseResults?.map((die, i) => (
            <span
              key={`base-${i}`}
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold",
                die >= difficulty
                  ? 'bg-green-500/20 text-green-500'
                  : die === 1
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {die}
            </span>
          ))}
          {extraResults?.map((die, i) => (
            <span
              key={`extra-${i}`}
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold border border-dashed",
                die >= difficulty
                  ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500'
                  : die === 1
                    ? 'bg-destructive/20 text-destructive border-destructive'
                    : 'bg-muted text-muted-foreground border-muted-foreground'
              )}
            >
              {die}
            </span>
          ))}
        </div>

        {/* Result badge */}
        <div className="flex items-center gap-2">
          {isBotch ? (
            <Badge variant="destructive" className="text-xs">
              {t.vampiroTests?.botch || 'Falha Crítica'}
            </Badge>
          ) : isExceptional ? (
            <Badge className="bg-yellow-500 text-xs">
              {t.vampiroTests?.exceptional || 'Sucesso Excepcional'}
            </Badge>
          ) : finalSuccesses > 0 ? (
            <Badge variant="default" className="bg-green-600 text-xs">
              {finalSuccesses} {t.vampiroTests?.successes || 'Sucessos'}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {t.vampiroTests?.failure || 'Falha'}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {t.vampiroTests?.poolLabel || 'Pool'}: {dicePool} | {t.vampiroTests?.difficultyLabel || 'Dif'}: {difficulty}
          </span>
        </div>
      </div>
    );
  };

  // Render tracker change
  const renderTrackerChange = (eventData: Record<string, unknown>) => {
    const trackerType = eventData.tracker_type as string;
    const charName = eventData.character_name as string;
    const oldValue = eventData.old_value as number;
    const newValue = eventData.new_value as number;
    const isNarratorChange = eventData.is_narrator_change as boolean;
    const isPermanent = eventData.is_permanent as boolean;

    const TrackerIcon = getTrackerIcon(trackerType);
    const colorClass = getTrackerColor(trackerType);
    const label = getTrackerLabel(trackerType, t);
    
    // For health tracker, invert display values (0 damage = 7 health levels remaining)
    const isHealthTracker = trackerType === 'health';
    const displayOldValue = isHealthTracker ? 7 - oldValue : oldValue;
    const displayNewValue = isHealthTracker ? 7 - newValue : newValue;
    const displayDifference = displayNewValue - displayOldValue;
    const differenceText = displayDifference > 0 ? `+${displayDifference}` : displayDifference.toString();

    return (
      <div className="flex items-start gap-2">
        <TrackerIcon className={cn("w-4 h-4 mt-0.5 shrink-0", colorClass)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="font-medieval">{charName}</span>
            <span className="text-muted-foreground">•</span>
            <span className={colorClass}>{label}</span>
            {isPermanent && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                {t.eventFeed.permanent}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{displayOldValue}</span>
            <span className="text-muted-foreground">→</span>
            <span className={cn("text-sm font-medium", displayDifference < 0 ? 'text-destructive' : 'text-green-500')}>
              {displayNewValue}
            </span>
            <Badge 
              variant={displayDifference < 0 ? "destructive" : "default"} 
              className={cn("text-xs", displayDifference >= 0 && 'bg-green-600')}
            >
              {differenceText}
            </Badge>
          </div>
          {isNarratorChange && (
            <span className="text-xs text-muted-foreground italic mt-1 block">
              {t.eventFeed.changedByNarrator}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render critical state
  const renderCriticalState = (eventData: Record<string, unknown>) => {
    const criticalType = eventData.type as string;
    const charName = eventData.character_name as string;
    const isBlood = criticalType === 'blood_depleted';

    return (
      <div className={cn(
        "rounded-lg p-3 animate-pulse",
        isBlood 
          ? 'bg-destructive/20 border border-destructive/40' 
          : 'bg-amber-500/20 border border-amber-500/40'
      )}>
        <div className="flex items-center gap-2">
          {isBlood ? (
            <Skull className="w-5 h-5 text-destructive" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          )}
          <span className={cn("font-medieval", isBlood ? 'text-destructive' : 'text-amber-500')}>
            {charName} - {isBlood 
              ? t.vampiro.bloodDepleted
              : t.vampiro.willpowerDepleted}
          </span>
        </div>
      </div>
    );
  };

  // Render scene event
  const renderSceneEvent = (eventData: Record<string, unknown>) => {
    return (
      <div className="flex items-start gap-2">
        <BookOpen className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medieval text-destructive">
            {eventData.scene_name as string}
          </p>
          {eventData.scene_description && (
            <p className="text-xs text-muted-foreground mt-1">
              {eventData.scene_description as string}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Render test requested
  const renderTestRequested = (eventData: Record<string, unknown>) => {
    return (
      <div className="flex items-start gap-2">
        <Dices className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm">
              <span className="text-muted-foreground">
                {t.vampiroTests?.requestTest || 'Teste'}:
              </span>{' '}
              <span className="font-medium">
                {getTestLabel(eventData, t)}
              </span>
            </p>
            <Badge variant="outline" className="text-xs">
              {t.vampiroTests?.difficulty || 'Dif'}: {eventData.difficulty as number}
            </Badge>
            {eventData.isPrivate && (
              <Lock className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          {eventData.context && (
            <p className="text-xs text-muted-foreground italic mt-1">
              "{eventData.context as string}"
            </p>
          )}
        </div>
      </div>
    );
  };

  // Render narrator roll
  const renderNarratorRoll = (eventData: Record<string, unknown>) => {
    const diceCount = eventData.dice_count as number;
    const difficulty = eventData.difficulty as number;
    const results = eventData.results as number[];
    const finalSuccesses = eventData.final_successes as number;
    const isBotch = eventData.is_botch as boolean;
    const isExceptional = eventData.is_exceptional as boolean;
    const context = eventData.context as string | undefined;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Dices className="w-4 h-4 text-destructive shrink-0" />
          <span className="font-medieval text-sm">
            {t.vampiroTests?.narratorRolled || 'Narrador rolou'}
          </span>
          <Badge variant="outline" className="text-xs">
            {diceCount}d10 | {t.vampiroTests?.difficultyLabel || 'Dif'}: {difficulty}
          </Badge>
        </div>

        {context && (
          <p className="text-xs text-muted-foreground italic">"{context}"</p>
        )}

        <div className="flex flex-wrap gap-1">
          {results?.map((die, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold",
                die >= difficulty
                  ? 'bg-green-500/20 text-green-500'
                  : die === 1
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {die}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isBotch ? (
            <Badge variant="destructive" className="text-xs">
              {t.vampiroTests?.botch || 'Falha Crítica'}
            </Badge>
          ) : isExceptional ? (
            <Badge className="bg-yellow-500 text-xs">
              {t.vampiroTests?.exceptional || 'Sucesso Excepcional'}
            </Badge>
          ) : finalSuccesses > 0 ? (
            <Badge variant="default" className="bg-green-600 text-xs">
              {finalSuccesses} {t.vampiroTests?.successes || 'Sucessos'}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {t.vampiroTests?.failure || 'Falha'}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Render event content based on type
  const renderEventContent = (event: SessionEvent) => {
    const { event_type, event_data } = event;

    switch (event_type) {
      case 'scene_started':
      case 'scene_changed':
        return renderSceneEvent(event_data);
      case 'vampire_test_requested':
        return renderTestRequested(event_data);
      case 'vampire_test_result':
        return renderTestResult(event_data);
      case 'tracker_change':
        return renderTrackerChange(event_data);
      case 'critical_state':
        return renderCriticalState(event_data);
      case 'narrator_roll':
        return renderNarratorRoll(event_data);
      case 'player_joined':
        return (
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm">
              {(event_data.player_name as string) || (event_data.character_name as string)} {t.eventFeed.joinedSession}
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-start gap-2">
            <Moon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              {JSON.stringify(event_data)}
            </p>
          </div>
        );
    }
  };

  // Get background class for event
  const getEventBgClass = (eventType: string, eventData: Record<string, unknown>) => {
    if (eventType === 'scene_started' || eventType === 'scene_changed') {
      return 'bg-destructive/10 border-destructive/30';
    }
    if (eventType === 'critical_state') {
      return ''; // Critical state has its own styling
    }
    if (eventType === 'vampire_test_result') {
      const isBotch = eventData.is_botch as boolean;
      const isExceptional = eventData.is_exceptional as boolean;
      if (isBotch) return 'bg-destructive/10 border-destructive/30';
      if (isExceptional) return 'bg-yellow-500/10 border-yellow-500/30';
    }
    return 'bg-muted/30';
  };

  return (
    <Card className="medieval-card border-destructive/20 h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Scroll className="w-5 h-5 text-destructive" />
            {t.vampiro?.chronicle || 'Crônica'}
          </CardTitle>
          {filteredEvents.length > 0 && (
            <span className="text-xs text-muted-foreground font-body">
              {filteredEvents.length} {t.eventFeed.events}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-1 px-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-body">
              <Scroll className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t.eventFeed.noEvents}</p>
            </div>
          ) : (
            <div className="space-y-3 pb-2">
              {paginatedEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "p-3 rounded-lg border border-border/50",
                    getEventBgClass(event.event_type, event.event_data)
                  )}
                >
                  {renderEventContent(event)}
                  
                  {/* Scene badge and timestamp */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(event.event_data as any).scene_name && event.event_type !== 'scene_started' && event.event_type !== 'scene_changed' && (
                      <Badge variant="outline" className="text-xs">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {(event.event_data as any).scene_name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(event.created_at), 'HH:mm:ss', { locale: dateLocale })}
                    </span>
                  </div>
                </div>
              ))}
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
              {t.eventFeed.previous}
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
              {t.eventFeed.next}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
