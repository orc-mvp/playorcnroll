import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
}

export function VampireEventFeed({ events, currentUserId }: VampireEventFeedProps) {
  const t = useTranslation();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEvent = (event: SessionEvent) => {
    const { event_type, event_data } = event;

    switch (event_type) {
      case 'scene_started':
      case 'scene_changed':
        return (
          <div className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medieval text-destructive">
                {event_data.scene_name as string}
              </p>
              {event_data.scene_description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {event_data.scene_description as string}
                </p>
              )}
            </div>
          </div>
        );

      case 'vampire_test_requested':
        return (
          <div className="flex items-start gap-2">
            <Dices className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm">
                  <span className="text-muted-foreground">
                    {t.vampiroTests.requestTest}:
                  </span>{' '}
                  <span className="font-medium">
                    {getTestLabel(event_data, t)}
                  </span>
                </p>
                <Badge variant="outline" className="text-xs">
                  {t.vampiroTests.difficulty}: {event_data.difficulty as number}
                </Badge>
                {event_data.isPrivate && (
                  <Lock className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              {event_data.context && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  "{event_data.context as string}"
                </p>
              )}
            </div>
          </div>
        );

      case 'vampire_test_result':
        return renderTestResult(event_data, t, currentUserId);

      case 'critical_state': {
        const criticalType = event_data.type as string;
        const charName = event_data.character_name as string;
        const isBlood = criticalType === 'blood_depleted';

        return (
          <div className={`rounded-lg p-3 animate-pulse ${
            isBlood 
              ? 'bg-destructive/20 border border-destructive/40' 
              : 'bg-amber-500/20 border border-amber-500/40'
          }`}>
            <div className="flex items-center gap-2">
              {isBlood ? (
                <Skull className="w-5 h-5 text-destructive" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              <span className={`font-medieval ${isBlood ? 'text-destructive' : 'text-amber-500'}`}>
                {charName} - {isBlood ? 'Sangue Esgotado!' : 'Vontade Exaurida!'}
              </span>
            </div>
          </div>
        );
      }

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

  return (
    <Card className="medieval-card border-destructive/20 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="font-medieval flex items-center gap-2">
          <Scroll className="w-5 h-5 text-destructive" />
          {t.vampiro?.chronicle || 'Crônica'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  {renderEvent(event)}
                  <span className="text-xs text-muted-foreground block mt-2">
                    {formatTime(event.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8 font-body">
              Nenhum evento ainda
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function getTestLabel(
  eventData: Record<string, unknown>,
  t: ReturnType<typeof useTranslation>
): string {
  const testType = eventData.testType as string;
  const testConfig = eventData as Record<string, unknown>;

  if (testType === 'attribute_ability') {
    const attr = testConfig.attribute as string;
    const ability = testConfig.ability as string;
    const attrLabel = t.vampiro[attr as keyof typeof t.vampiro] || attr;
    const abilityLabel = t.vampiro[ability as keyof typeof t.vampiro] || ability;
    return `${attrLabel} + ${abilityLabel}`;
  }
  if (testType === 'willpower') return t.vampiro.willpower;
  if (testType === 'humanity') return t.vampiro.humanity;
  if (testType === 'virtue') {
    const virtue = testConfig.virtue as string;
    return t.vampiro[virtue as keyof typeof t.vampiro] || virtue;
  }
  return testType;
}

function renderTestResult(
  eventData: Record<string, unknown>,
  t: ReturnType<typeof useTranslation>,
  currentUserId?: string
) {
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

  // For private tests, only show to narrator and player
  // (In real implementation, this would be filtered server-side)
  // For now, we show a placeholder for private results

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
          {t.vampiroTests.testedWith}
        </span>
        <span className="text-sm font-medium">
          {getTestLabel(testConfig, t)}
        </span>
        {isPrivate && <Lock className="w-3 h-3 text-muted-foreground" />}
      </div>

      {/* Dice display */}
      <div className="flex flex-wrap gap-1">
        {baseResults?.map((die, i) => (
          <span
            key={`base-${i}`}
            className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
              die >= difficulty
                ? 'bg-green-500/20 text-green-500'
                : die === 1
                  ? 'bg-destructive/20 text-destructive'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {die}
          </span>
        ))}
        {extraResults?.map((die, i) => (
          <span
            key={`extra-${i}`}
            className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold border border-dashed ${
              die >= difficulty
                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500'
                : die === 1
                  ? 'bg-destructive/20 text-destructive border-destructive'
                  : 'bg-muted text-muted-foreground border-muted-foreground'
            }`}
          >
            {die}
          </span>
        ))}
      </div>

      {/* Result badge */}
      <div className="flex items-center gap-2">
        {isBotch ? (
          <Badge variant="destructive" className="text-xs">
            {t.vampiroTests.botch}
          </Badge>
        ) : isExceptional ? (
          <Badge className="bg-yellow-500 text-xs">
            {t.vampiroTests.exceptional}
          </Badge>
        ) : finalSuccesses > 0 ? (
          <Badge variant="default" className="bg-green-600 text-xs">
            {finalSuccesses} {t.vampiroTests.successes}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            {t.vampiroTests.failure}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {t.vampiroTests.poolLabel}: {dicePool} | {t.vampiroTests.difficultyLabel}:{' '}
          {difficulty}
        </span>
      </div>
    </div>
  );
}
