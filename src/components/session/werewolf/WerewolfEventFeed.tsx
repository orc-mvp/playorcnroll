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
  Dog,
  Skull,
  AlertTriangle,
  Sparkles,
  Heart,
  Flame,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface SessionEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
  scene_id: string | null;
  session_id: string;
}

interface WerewolfEventFeedProps {
  events: SessionEvent[];
  currentUserId?: string;
  isNarrator?: boolean;
}

const ITEMS_PER_PAGE = 10;
const MAX_EVENTS = 100;

// Werewolf-specific tracker icons
const getTrackerIcon = (type: string) => {
  switch (type) {
    case 'gnosis': return Sparkles;
    case 'rage': return Flame;
    case 'willpower': return Zap;
    case 'health': return Heart;
    case 'form': return Dog;
    default: return Dog;
  }
};

const getTrackerLabel = (type: string, t: any) => {
  switch (type) {
    case 'gnosis': return t.lobisomem?.gnosis || 'Gnose';
    case 'rage': return t.lobisomem?.rage || 'Fúria';
    case 'willpower': return t.lobisomem?.willpowerLabel || t.vampiro?.willpowerCurrent || 'Força de Vontade';
    case 'health': return t.lobisomem?.vitality || 'Vitalidade';
    case 'form': return t.lobisomem?.form || 'Forma';
    // fallback to vampire labels for shared types
    case 'blood': return t.vampiro?.bloodPool || 'Sangue';
    default: return type;
  }
};

const getTrackerColor = (type: string) => {
  switch (type) {
    case 'gnosis': return 'text-emerald-500';
    case 'rage': return 'text-destructive';
    case 'willpower': return 'text-foreground';
    case 'health': return 'text-destructive';
    case 'form': return 'text-emerald-500';
    default: return 'text-muted-foreground';
  }
};

const getTestLabel = (eventData: Record<string, unknown>, t: any): string => {
  const testType = eventData.testType as string;
  const testConfig = eventData as Record<string, unknown>;

  if (testType === 'attribute_ability') {
    const attr = testConfig.attribute as string;
    const ability = testConfig.ability as string;
    return `${t.vampiro?.[attr] || attr} + ${t.vampiro?.[ability] || ability}`;
  }
  if (testType === 'attribute_only') {
    return t.vampiro?.[testConfig.attribute as string] || (testConfig.attribute as string);
  }
  if (testType === 'willpower') return t.vampiro?.willpower || 'Willpower';
  if (testType === 'gnosis') return t.lobisomem?.gnosis || 'Gnose';
  if (testType === 'rage') return t.lobisomem?.rage || 'Fúria';
  return testType;
};

const getFormLabel = (form: string, t: any) => {
  const key = `form_${form}` as keyof typeof t.lobisomem;
  return (t.lobisomem as any)?.[key] || form;
};

export function WerewolfEventFeed({ events, currentUserId, isNarrator = false }: WerewolfEventFeedProps) {
  const { t, language } = useI18n();
  const dateLocale = language === 'pt-BR' ? ptBR : enUS;
  const [currentPage, setCurrentPage] = useState(0);
  const prevEventsLength = useRef(events.length);

  useEffect(() => {
    if (events.length > prevEventsLength.current) setCurrentPage(0);
    prevEventsLength.current = events.length;
  }, [events.length]);

  const filteredEvents = useMemo(() => events.slice(0, MAX_EVENTS), [events]);
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

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
        <div className="flex items-center gap-2 flex-wrap">
          {isBotch ? <XCircle className="w-4 h-4 text-destructive shrink-0" />
            : isExceptional ? <Star className="w-4 h-4 text-yellow-500 shrink-0" />
            : finalSuccesses > 0 ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            : <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />}
          <span className="font-medieval text-sm">{characterName}</span>
          <span className="text-xs text-muted-foreground">{t.vampiroTests?.testedWith || 'testou'}</span>
          <span className="text-sm font-medium">{getTestLabel(testConfig || {}, t)}</span>
          {isPrivate && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
        <div className="flex flex-wrap gap-1">
          {baseResults?.map((die, i) => (
            <span key={`b-${i}`} className={cn("inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold",
              die >= difficulty ? 'bg-green-500/20 text-green-500' : die === 1 ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
            )}>{die}</span>
          ))}
          {extraResults?.map((die, i) => (
            <span key={`e-${i}`} className={cn("inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold border border-dashed",
              die >= difficulty ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' : die === 1 ? 'bg-destructive/20 text-destructive border-destructive' : 'bg-muted text-muted-foreground border-muted-foreground'
            )}>{die}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isBotch ? <Badge variant="destructive" className="text-xs">{t.vampiroTests?.botch || 'Falha Crítica'}</Badge>
            : isExceptional ? <Badge className="bg-yellow-500 text-xs">{t.vampiroTests?.exceptional || 'Sucesso Excepcional'}</Badge>
            : finalSuccesses > 0 ? <Badge variant="default" className="bg-green-600 text-xs">{finalSuccesses} {t.vampiroTests?.successes || 'Sucessos'}</Badge>
            : <Badge variant="secondary" className="text-xs">{t.vampiroTests?.failure || 'Falha'}</Badge>}
          <span className="text-xs text-muted-foreground">
            {t.vampiroTests?.poolLabel || 'Pool'}: {dicePool} | {t.vampiroTests?.difficultyLabel || 'Dif'}: {difficulty}
          </span>
        </div>
      </div>
    );
  };

  const renderTrackerChange = (eventData: Record<string, unknown>) => {
    const trackerType = eventData.tracker_type as string;
    const charName = eventData.character_name as string;
    const oldValue = eventData.old_value;
    const newValue = eventData.new_value;
    const isNarratorChange = eventData.is_narrator_change as boolean;
    const isPermanent = eventData.is_permanent as boolean;

    const TrackerIcon = getTrackerIcon(trackerType);
    const colorClass = getTrackerColor(trackerType);
    const label = getTrackerLabel(trackerType, t);

    // Form changes are strings
    if (trackerType === 'form') {
      return (
        <div className="flex items-start gap-2">
          <Dog className={cn("w-4 h-4 mt-0.5 shrink-0", colorClass)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <span className="font-medieval">{charName}</span>
              <span className="text-muted-foreground">•</span>
              <span className={colorClass}>{label}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">{getFormLabel(oldValue as string, t)}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-sm font-medium text-emerald-500">{getFormLabel(newValue as string, t)}</span>
            </div>
            {isNarratorChange && (
              <span className="text-xs text-muted-foreground italic mt-1 block">{t.eventFeed.changedByNarrator}</span>
            )}
          </div>
        </div>
      );
    }

    // Numeric tracker changes
    const oldNum = oldValue as number;
    const newNum = newValue as number;
    const isHealthTracker = trackerType === 'health';
    const displayOld = isHealthTracker ? 7 - oldNum : oldNum;
    const displayNew = isHealthTracker ? 7 - newNum : newNum;
    const diff = displayNew - displayOld;
    const diffText = diff > 0 ? `+${diff}` : diff.toString();

    return (
      <div className="flex items-start gap-2">
        <TrackerIcon className={cn("w-4 h-4 mt-0.5 shrink-0", colorClass)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="font-medieval">{charName}</span>
            <span className="text-muted-foreground">•</span>
            <span className={colorClass}>{label}</span>
            {isPermanent && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0">{t.eventFeed.permanent}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{displayOld}</span>
            <span className="text-muted-foreground">→</span>
            <span className={cn("text-sm font-medium", diff < 0 ? 'text-destructive' : 'text-green-500')}>{displayNew}</span>
            <Badge variant={diff < 0 ? "destructive" : "default"} className={cn("text-xs", diff >= 0 && 'bg-green-600')}>{diffText}</Badge>
          </div>
          {isNarratorChange && (
            <span className="text-xs text-muted-foreground italic mt-1 block">{t.eventFeed.changedByNarrator}</span>
          )}
        </div>
      </div>
    );
  };

  const renderCriticalState = (eventData: Record<string, unknown>) => {
    const criticalType = eventData.type as string;
    const charName = eventData.character_name as string;
    const isGnosis = criticalType === 'gnosis_depleted';
    const isWillpower = criticalType === 'willpower_depleted';

    const label = isGnosis
      ? (t.lobisomem?.gnosisDepleted || 'Gnose Esgotada!')
      : isWillpower
        ? (t.vampiro?.willpowerDepleted || 'Vontade Exaurida!')
        : criticalType;

    return (
      <div className={cn("rounded-lg p-3 animate-pulse",
        isGnosis ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-destructive/20 border border-destructive/40'
      )}>
        <div className="flex items-center gap-2">
          {isGnosis ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <Skull className="w-5 h-5 text-destructive" />}
          <span className={cn("font-medieval", isGnosis ? 'text-amber-500' : 'text-destructive')}>{charName} - {label}</span>
        </div>
      </div>
    );
  };

  const renderSceneEvent = (eventData: Record<string, unknown>) => (
    <div className="flex items-start gap-2">
      <BookOpen className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medieval text-emerald-500">{eventData.scene_name as string}</p>
        {eventData.scene_description && <p className="text-xs text-muted-foreground mt-1">{eventData.scene_description as string}</p>}
      </div>
    </div>
  );

  const renderTestRequested = (eventData: Record<string, unknown>) => (
    <div className="flex items-start gap-2">
      <Dices className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm">
            <span className="text-muted-foreground">{t.vampiroTests?.requestTest || 'Teste'}:</span>{' '}
            <span className="font-medium">{getTestLabel(eventData, t)}</span>
          </p>
          <Badge variant="outline" className="text-xs">{t.vampiroTests?.difficulty || 'Dif'}: {eventData.difficulty as number}</Badge>
          {eventData.isPrivate && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
        {eventData.context && <p className="text-xs text-muted-foreground italic mt-1">"{eventData.context as string}"</p>}
      </div>
    </div>
  );

  const renderNarratorRoll = (eventData: Record<string, unknown>) => {
    const results = eventData.results as number[];
    const difficulty = eventData.difficulty as number;
    const finalSuccesses = eventData.final_successes as number;
    const isBotch = eventData.is_botch as boolean;
    const isExceptional = eventData.is_exceptional as boolean;
    const context = eventData.context as string | undefined;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Dices className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-medieval text-sm">{t.vampiroTests?.narratorRolled || 'Narrador rolou'}</span>
          <Badge variant="outline" className="text-xs">{eventData.dice_count as number}d10 | {t.vampiroTests?.difficultyLabel || 'Dif'}: {difficulty}</Badge>
        </div>
        {context && <p className="text-xs text-muted-foreground italic">"{context}"</p>}
        <div className="flex flex-wrap gap-1">
          {results?.map((die, i) => (
            <span key={i} className={cn("inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold",
              die >= difficulty ? 'bg-green-500/20 text-green-500' : die === 1 ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
            )}>{die}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isBotch ? <Badge variant="destructive" className="text-xs">{t.vampiroTests?.botch || 'Falha Crítica'}</Badge>
            : isExceptional ? <Badge className="bg-yellow-500 text-xs">{t.vampiroTests?.exceptional || 'Sucesso Excepcional'}</Badge>
            : finalSuccesses > 0 ? <Badge variant="default" className="bg-green-600 text-xs">{finalSuccesses} {t.vampiroTests?.successes || 'Sucessos'}</Badge>
            : <Badge variant="secondary" className="text-xs">{t.vampiroTests?.failure || 'Falha'}</Badge>}
        </div>
      </div>
    );
  };

  const renderEventContent = (event: SessionEvent) => {
    switch (event.event_type) {
      case 'scene_started':
      case 'scene_changed':
        return renderSceneEvent(event.event_data);
      case 'vampire_test_requested':
        return renderTestRequested(event.event_data);
      case 'vampire_test_result':
        return renderTestResult(event.event_data);
      case 'tracker_change':
        return renderTrackerChange(event.event_data);
      case 'critical_state':
        return renderCriticalState(event.event_data);
      case 'narrator_roll':
        return renderNarratorRoll(event.event_data);
      case 'player_joined':
        return (
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm">{(event.event_data.player_name as string) || (event.event_data.character_name as string)} {t.eventFeed.joinedSession}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-start gap-2">
            <Dog className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">{JSON.stringify(event.event_data)}</p>
          </div>
        );
    }
  };

  const getEventBgClass = (eventType: string, eventData: Record<string, unknown>) => {
    if (eventType === 'scene_started' || eventType === 'scene_changed') return 'bg-emerald-500/10 border-emerald-500/30';
    if (eventType === 'critical_state') return '';
    if (eventType === 'vampire_test_result') {
      if (eventData.is_botch) return 'bg-destructive/10 border-destructive/30';
      if (eventData.is_exceptional) return 'bg-yellow-500/10 border-yellow-500/30';
    }
    return 'bg-muted/30';
  };

  return (
    <Card className="medieval-card border-emerald-500/20 h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="font-medieval flex items-center gap-2">
            <Scroll className="w-5 h-5 text-emerald-500" />
            {t.lobisomem?.werewolfSession || t.vampiro?.chronicle || 'Crônica'}
          </CardTitle>
          {filteredEvents.length > 0 && (
            <span className="text-xs text-muted-foreground font-body">{filteredEvents.length} {t.eventFeed.events}</span>
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
                <div key={event.id} className={cn("p-3 rounded-lg border border-border/50", getEventBgClass(event.event_type, event.event_data))}>
                  {renderEventContent(event)}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(event.event_data as any).scene_name && event.event_type !== 'scene_started' && event.event_type !== 'scene_changed' && (
                      <Badge variant="outline" className="text-xs">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {(event.event_data as any).scene_name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{format(new Date(event.created_at), 'HH:mm:ss', { locale: dateLocale })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="h-8">
              <ChevronLeft className="w-4 h-4 mr-1" />{t.eventFeed.previous}
            </Button>
            <span className="text-xs text-muted-foreground font-body">{currentPage + 1} / {totalPages}</span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="h-8">
              {t.eventFeed.next}<ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
