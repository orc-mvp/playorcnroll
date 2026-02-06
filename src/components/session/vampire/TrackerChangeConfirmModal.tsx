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
import { useTranslation } from '@/lib/i18n';
import { Droplets, Sparkles, Heart, AlertTriangle, Users, Crown } from 'lucide-react';

export type TrackerType = 'blood' | 'willpower' | 'health';

interface TrackerChangeConfirmModalProps {
  open: boolean;
  trackerType: TrackerType;
  currentValue: number;
  newValue: number;
  characterName?: string;
  isNarrator: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TrackerChangeConfirmModal({
  open,
  trackerType,
  currentValue,
  newValue,
  characterName,
  isNarrator,
  onConfirm,
  onCancel,
}: TrackerChangeConfirmModalProps) {
  const t = useTranslation();

  const difference = newValue - currentValue;
  const differenceText = difference > 0 ? `+${difference}` : difference.toString();
  const isCritical = newValue === 0;

  const getTrackerIcon = () => {
    switch (trackerType) {
      case 'blood':
        return <Droplets className="w-5 h-5 text-destructive" />;
      case 'willpower':
        return <Sparkles className="w-5 h-5 text-foreground" />;
      case 'health':
        return <Heart className="w-5 h-5 text-destructive" />;
    }
  };

  const getTrackerLabel = () => {
    switch (trackerType) {
      case 'blood':
        return t.vampiro?.trackerBloodChange || 'Sangue';
      case 'willpower':
        return t.vampiro?.trackerWillpowerChange || 'Vontade';
      case 'health':
        return t.vampiro?.trackerHealthChange || 'Vitalidade';
    }
  };

  const getVisibilityMessage = () => {
    if (isNarrator && characterName) {
      return (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>
            {t.vampiro?.trackerVisibleToPlayer?.replace('{name}', characterName) || 
              `O jogador ${characterName} verá esta mudança`}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Crown className="w-4 h-4 text-destructive" />
        <span>{t.vampiro?.trackerVisibleToNarrator || 'O Narrador verá esta mudança'}</span>
      </div>
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 font-medieval">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {t.vampiro?.trackerChangeTitle || 'Confirmar Alteração'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="text-muted-foreground">
              {t.vampiro?.trackerChangeDescription || 
                'Esta alteração será sincronizada em tempo real com todos os participantes da sessão.'}
            </p>

            {/* Change Details */}
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted/50 border">
              {getTrackerIcon()}
              <span className="font-medieval text-lg">
                {getTrackerLabel()}: {currentValue} → {newValue}
              </span>
              <span className={`text-sm font-medium ${difference < 0 ? 'text-destructive' : 'text-primary'}`}>
                ({differenceText})
              </span>
            </div>

            {/* Critical State Warning */}
            {isCritical && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/20 border border-destructive/40 text-destructive">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">
                  {t.vampiro?.trackerCriticalWarning || 'Atenção: Isso resultará em estado crítico!'}
                </span>
              </div>
            )}

            {/* Visibility Info */}
            <div className="p-3 rounded-lg bg-muted/30 border text-sm text-muted-foreground">
              {getVisibilityMessage()}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {t.common?.cancel || 'Cancelar'}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            {t.common?.confirm || 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
