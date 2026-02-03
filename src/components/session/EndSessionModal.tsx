import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Crown, AlertTriangle, Clock, Check, X } from 'lucide-react';
import type { SessionData, Participant } from '@/pages/Session';

interface TemporaryMark {
  id: string;
  name: string;
  scope: string;
  effect: string;
  character_id: string;
  character_name: string;
  use_count: number;
}

interface EndSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionData;
  participants: Participant[];
  onEndSession: () => void;
}

export function EndSessionModal({
  open,
  onOpenChange,
  session,
  participants,
  onEndSession,
}: EndSessionModalProps) {
  const { t, language } = useI18n();
  const { toast } = useToast();
  const [temporaryMarks, setTemporaryMarks] = useState<TemporaryMark[]>([]);
  const [markDecisions, setMarkDecisions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Calculate stored heroic moves across all characters
  const heroicMovesData = participants
    .filter((p) => p.character && p.character.heroic_moves_stored > 0)
    .map((p) => ({
      characterName: p.character!.name,
      storedMoves: p.character!.heroic_moves_stored,
    }));

  const totalUnusedMoves = heroicMovesData.reduce((sum, d) => sum + d.storedMoves, 0);

  // Fetch temporary marks from session events
  useEffect(() => {
    if (!open) return;

    const fetchTemporaryMarks = async () => {
      // Query session events for temporary_major_mark events
      const { data: events } = await supabase
        .from('session_events')
        .select('*')
        .eq('session_id', session.id)
        .eq('event_type', 'temporary_major_mark');

      if (events && events.length > 0) {
        const marks: TemporaryMark[] = events.map((event) => {
          const data = event.event_data as Record<string, unknown>;
          const character = participants.find(
            (p) => p.character?.id === data.character_id
          )?.character;

          return {
            id: event.id,
            name: (data.mark_name as string) || '',
            scope: (data.mark_scope as string) || '',
            effect: (data.mark_effect as string) || '',
            character_id: (data.character_id as string) || '',
            character_name: character?.name || 'Unknown',
            use_count: (data.use_count as number) || 0,
          };
        });

        setTemporaryMarks(marks);
        // Default all to expire
        const defaultDecisions: Record<string, boolean> = {};
        marks.forEach((m) => {
          defaultDecisions[m.id] = false;
        });
        setMarkDecisions(defaultDecisions);
      }
    };

    fetchTemporaryMarks();
  }, [open, session.id, participants]);

  const handleConfirmEnd = async () => {
    setLoading(true);

    try {
      // Process marks that should become permanent
      const marksToPermanent = temporaryMarks.filter((m) => markDecisions[m.id]);

      for (const mark of marksToPermanent) {
        // Get current character's major marks
        const { data: character } = await supabase
          .from('characters')
          .select('major_marks')
          .eq('id', mark.character_id)
          .single();

        if (character) {
          const currentMarks = (character.major_marks as unknown[]) || [];
          const newMark = {
            name: mark.name,
            scope: mark.scope,
            effect: mark.effect,
            is_permanent: true,
            created_at: new Date().toISOString(),
          };

          await supabase
            .from('characters')
            .update({
              major_marks: [...currentMarks, newMark] as unknown as import('@/integrations/supabase/types').Json,
            })
            .eq('id', mark.character_id);
        }
      }

      // Reset heroic moves for all characters
      const characterIds = participants
        .filter((p) => p.character_id)
        .map((p) => p.character_id!);

      if (characterIds.length > 0) {
        await supabase
          .from('characters')
          .update({ heroic_moves_stored: 0 })
          .in('id', characterIds);
      }

      // Add session end event
      await supabase.from('session_events').insert({
        session_id: session.id,
        event_type: 'session_ended',
        event_data: {
          marks_made_permanent: marksToPermanent.length,
          heroic_moves_expired: totalUnusedMoves,
        },
      });

      toast({
        title: language === 'pt-BR' ? 'Sessão encerrada!' : 'Session ended!',
        description:
          language === 'pt-BR'
            ? `${marksToPermanent.length} marca(s) tornada(s) permanente(s)`
            : `${marksToPermanent.length} mark(s) made permanent`,
      });

      onEndSession();
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: language === 'pt-BR' ? 'Erro ao encerrar' : 'Error ending session',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            {t.endSession.title}
          </DialogTitle>
          <DialogDescription className="font-body">
            {language === 'pt-BR'
              ? 'Revise o progresso da sessão antes de encerrar'
              : 'Review session progress before ending'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6">
            {/* Temporary Major Marks Section */}
            <div className="space-y-3">
              <h3 className="font-medieval text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {t.endSession.temporaryMarks}
              </h3>

              {temporaryMarks.length > 0 ? (
                <div className="space-y-2">
                  {temporaryMarks.map((mark) => (
                    <Card key={mark.id} className="medieval-card">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medieval text-sm truncate">
                              {mark.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {mark.character_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {t.endSession.usedTimes.replace(
                                  '{count}',
                                  String(mark.use_count)
                                )}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end gap-1">
                              <Label
                                htmlFor={`mark-${mark.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                {markDecisions[mark.id]
                                  ? t.endSession.makePermanent
                                  : t.endSession.expire}
                              </Label>
                              <Switch
                                id={`mark-${mark.id}`}
                                checked={markDecisions[mark.id]}
                                onCheckedChange={(checked) =>
                                  setMarkDecisions((prev) => ({
                                    ...prev,
                                    [mark.id]: checked,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t.endSession.none}
                </p>
              )}
            </div>

            <Separator />

            {/* Unused Heroic Moves Warning */}
            <div className="space-y-3">
              <h3 className="font-medieval text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                {t.endSession.unusedMoves}
              </h3>

              {heroicMovesData.length > 0 ? (
                <div className="space-y-2">
                  {heroicMovesData.map((data, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                    >
                      <span className="font-body text-sm">{data.characterName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                          {data.storedMoves} {t.endSession.stored}
                        </Badge>
                        <Clock className="w-4 h-4 text-yellow-500" />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {t.endSession.willExpire}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  {language === 'pt-BR'
                    ? 'Todos os movimentos heroicos foram usados!'
                    : 'All heroic moves have been used!'}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmEnd}
            disabled={loading}
          >
            {loading
              ? t.common.loading
              : language === 'pt-BR'
              ? 'Confirmar Encerramento'
              : 'Confirm End'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
