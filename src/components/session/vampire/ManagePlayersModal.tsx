import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Lock, Unlock, Minus, Plus, Sparkles, User, Trash2, AlertTriangle } from 'lucide-react';

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
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

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

  const handleRemovePlayer = async (participantId: string) => {
    setUpdating(participantId);
    try {
      const { error } = await supabase
        .from('session_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      toast({ title: t.managePlayers.playerRemoved });
    } catch (error) {
      console.error('Error removing player:', error);
      toast({ title: t.managePlayers.errorRemoving, variant: 'destructive' });
    } finally {
      setUpdating(null);
      setRemoveConfirm(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-medieval">{t.managePlayers.title}</DialogTitle>
            <DialogDescription>
              {participants.length} {t.vampireSession.players}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-4">
              {participants.map((participant) => {
                const isLocked = participant.sheet_locked ?? true;
                const xp = participant.experience_points ?? 0;
                const displayName = participant.profile?.display_name || participant.user_id.slice(0, 8).toUpperCase();
                const charName = participant.character?.name || t.managePlayers.noCharacter;
                const hasNoCharacter = !participant.character_id || !participant.character;

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
                      {hasNoCharacter && (
                        <Badge variant="destructive" className="text-[10px] shrink-0">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {t.managePlayers.noCharacterWarning}
                        </Badge>
                      )}
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

                    {/* Remove player */}
                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setRemoveConfirm(participant.id)}
                        disabled={updating === participant.id}
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        {t.managePlayers.removePlayer}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.managePlayers.removePlayer}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.managePlayers.removeConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeConfirm && handleRemovePlayer(removeConfirm)}
            >
              {t.managePlayers.removePlayer}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
