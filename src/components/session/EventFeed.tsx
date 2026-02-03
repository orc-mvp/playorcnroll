import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Scroll, 
  BookOpen, 
  Dices, 
  AlertTriangle, 
  Sparkles,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import type { SessionEvent } from '@/pages/Session';

interface EventFeedProps {
  events: SessionEvent[];
}

const eventConfig: Record<string, { 
  icon: React.ElementType; 
  color: string; 
  label: (data: Record<string, any>, lang: string) => string 
}> = {
  scene_created: {
    icon: BookOpen,
    color: 'text-blue-500',
    label: (data, lang) => lang === 'pt-BR' 
      ? `Nova cena: ${data.scene_name}` 
      : `New scene: ${data.scene_name}`,
  },
  test_requested: {
    icon: Dices,
    color: 'text-yellow-500',
    label: (data, lang) => lang === 'pt-BR'
      ? `Teste de ${data.attribute} solicitado`
      : `${data.attribute} test requested`,
  },
  test_completed: {
    icon: Dices,
    color: 'text-green-500',
    label: (data, lang) => {
      const result = data.result === 'success' ? (lang === 'pt-BR' ? 'Sucesso' : 'Success')
        : data.result === 'partial' ? (lang === 'pt-BR' ? 'Sucesso Parcial' : 'Partial Success')
        : (lang === 'pt-BR' ? 'Falha' : 'Failure');
      return `${data.character_name}: ${result} (${data.total})`;
    },
  },
  extreme_positive: {
    icon: Sparkles,
    color: 'text-yellow-400',
    label: (data, lang) => lang === 'pt-BR'
      ? `${data.character_name} teve um Extremo Positivo!`
      : `${data.character_name} got a Positive Extreme!`,
  },
  extreme_negative: {
    icon: AlertTriangle,
    color: 'text-red-500',
    label: (data, lang) => lang === 'pt-BR'
      ? `${data.character_name} teve um Extremo Negativo!`
      : `${data.character_name} got a Negative Extreme!`,
  },
  player_joined: {
    icon: UserPlus,
    color: 'text-green-500',
    label: (data, lang) => lang === 'pt-BR'
      ? `${data.player_name} entrou na sessão`
      : `${data.player_name} joined the session`,
  },
  narrator_message: {
    icon: MessageSquare,
    color: 'text-primary',
    label: (data) => data.message,
  },
};

export function EventFeed({ events }: EventFeedProps) {
  const { t, language } = useI18n();
  const dateLocale = language === 'pt-BR' ? ptBR : enUS;

  return (
    <Card className="medieval-card h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="font-medieval flex items-center gap-2">
          <Scroll className="w-5 h-5 text-primary" />
          {t.scene.events}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-body">
              <Scroll className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Nenhum evento ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const config = eventConfig[event.event_type] || {
                  icon: MessageSquare,
                  color: 'text-muted-foreground',
                  label: () => event.event_type,
                };
                const Icon = config.icon;

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className={`mt-0.5 ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm">
                        {config.label(event.event_data, language)}
                      </p>
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
      </CardContent>
    </Card>
  );
}
