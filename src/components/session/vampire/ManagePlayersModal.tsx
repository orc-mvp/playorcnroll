import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lock, Unlock, Minus, Plus, Sparkles, User } from 'lucide-react';

interface Participant {
  id: string;
  user_id: string;
  character_id: string | null;
  sheet_locked?: boolean;
  experience_points?: number;
  character?: {
    id: string;
    name: string;
  } | null;
  profile?: {
    display_name: string | null;
  } | null;
}

interface ManagePlayersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  sessionId: string;
}

export function ManagePlayersModal({
  open,
  onOpenChange,
  participants,
  sessionId,
}: ManagePlayersModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggleLock = async (participantId: string, currentLocked: boolean) => {
    setUpdating(participantId);
    try {
      const { error } = await supabase
        .from('session_participants')
        .update({ sheet_locked: !currentLocked } as any)
        .eq('id', participantId);

      if (error) throw error;

      toast({
        title: !currentLocked ? t.managePlayers.sheetLocked : t.managePlayers.sheetUnlocked,
      });
    } catch (error) {
      console.error('Error toggling sheet lock:', error);
      toast({ title: t.common.errorSaving, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const handleXpChange = async (participantId: string, currentXp: number, delta: number) => {
    const newXp = Math.max(0, currentXp + delta);
    setUpdating(participantId);
    try {
      const { error } = await supabase
        .from('session_participants')
        .update({ experience_points: newXp } as any)
        .eq('id', participantId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating XP:', error);
      toast({ title: t.common.errorSaving, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-medieval">{t.managePlayers.title}</DialogTitle>
          <DialogDescription>
            {participants.length} {t.vampireSession.players}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {participants.map((participant) => {
              const isLocked = participant.sheet_locked ?? true;
              const xp = participant.experience_points ?? 0;
              const displayName = participant.profile?.display_name || participant.user_id.slice(0, 8).toUpperCase();
              const charName = participant.character?.name || t.managePlayers.noCharacter;

              return (
                <div
                  key={participant.id}
                  className="p-3 rounded-lg border border-border bg-muted/30 space-y-3"
                >
                  {/* Player info */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medieval text-sm truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{charName}</p>
                    </div>
                  </div>

                  {/* Sheet lock toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isLocked ? (
                        <Lock className="w-4 h-4 text-destructive" />
                      ) : (
                        <Unlock className="w-4 h-4 text-green-500" />
                      )}
                      <Label className="text-xs">
                        {isLocked ? t.managePlayers.sheetLocked : t.managePlayers.sheetUnlocked}
                      </Label>
                    </div>
                    <Switch
                      checked={!isLocked}
                      onCheckedChange={() => handleToggleLock(participant.id, isLocked)}
                      disabled={updating === participant.id}
                    />
                  </div>

                  {/* XP control */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <Label className="text-xs">{t.managePlayers.experience}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleXpChange(participant.id, xp, -1)}
                        disabled={updating === participant.id || xp <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-mono text-sm w-8 text-center">{xp}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleXpChange(participant.id, xp, 1)}
                        disabled={updating === participant.id}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
