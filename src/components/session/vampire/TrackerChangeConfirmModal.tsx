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
import { Droplets, Sparkles, Heart, AlertTriangle, Users, Crown, Moon, Zap, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type TrackerType = 'blood' | 'willpower' | 'health' | 'humanity' | 'gnosis' | 'rage';

interface TrackerChangeConfirmModalProps {
  open: boolean;
  trackerType: TrackerType;
  currentValue: number;
  newValue: number;
  characterName?: string;
  isNarrator: boolean;
  isPermanent?: boolean;
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
  isPermanent = false,
  onConfirm,
  onCancel,
}: TrackerChangeConfirmModalProps) {
  const t = useTranslation();

  // For health tracker, invert display values (0 damage = 7 health levels remaining)
  const isHealthTracker = trackerType === 'health';
  const displayCurrentValue = isHealthTracker ? 7 - currentValue : currentValue;
  const displayNewValue = isHealthTracker ? 7 - newValue : newValue;
  
  // Calculate difference based on displayed values
  const displayDifference = displayNewValue - displayCurrentValue;
  const differenceText = displayDifference > 0 ? `+${displayDifference}` : displayDifference.toString();
  
  // Critical state: for health, critical is when health remaining is 0 (i.e., 7 damage levels)
  const isCritical = isHealthTracker ? displayNewValue === 0 : newValue === 0;

  const getTrackerIcon = () => {
    switch (trackerType) {
      case 'blood':
        return <Droplets className="w-5 h-5 text-destructive" />;
      case 'willpower':
        return <Sparkles className="w-5 h-5 text-foreground" />;
      case 'health':
        return <Heart className="w-5 h-5 text-destructive" />;
      case 'humanity':
        return <Moon className="w-5 h-5 text-foreground" />;
      case 'gnosis':
        return <Sparkles className="w-5 h-5 text-emerald-500" />;
      case 'rage':
        return <Flame className="w-5 h-5 text-destructive" />;
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
      case 'humanity':
        return t.vampiro?.trackerHumanityChange || 'Humanidade';
      case 'gnosis':
        return t.lobisomem?.gnosis || 'Gnose';
      case 'rage':
        return t.lobisomem?.rage || 'Fúria';
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
            <AlertTriangle className={`w-5 h-5 ${isPermanent ? 'text-destructive' : 'text-amber-500'}`} />
            {isPermanent 
              ? (t.vampiro?.trackerPermanentTitle || 'Confirmar Alteração PERMANENTE')
              : (t.vampiro?.trackerChangeTitle || 'Confirmar Alteração')}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {/* Permanent Warning Banner */}
            {isPermanent && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/20 border border-destructive/40 text-destructive">
                <Zap className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">
                    {t.vampiro?.trackerPermanentWarning || 'ALTERAÇÃO PERMANENTE'}
                  </p>
                  <p className="text-xs mt-1 text-destructive/80">
                    {t.vampiro?.trackerPermanentDescription || 
                      'Esta mudança afetará a ficha do personagem permanentemente, não apenas esta sessão.'}
                  </p>
                </div>
              </div>
            )}

            <p className="text-muted-foreground">
              {t.vampiro?.trackerChangeDescription || 
                'Esta alteração será sincronizada em tempo real com todos os participantes da sessão.'}
            </p>

            {/* Change Details */}
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted/50 border">
              {getTrackerIcon()}
              <span className="font-medieval text-lg">
                {getTrackerLabel()}: {displayCurrentValue} → {displayNewValue}
              </span>
              <span className={`text-sm font-medium ${displayDifference < 0 ? 'text-destructive' : 'text-primary'}`}>
                ({differenceText})
              </span>
              {isPermanent && (
                <Badge variant="destructive" className="text-xs">
                  {t.vampiro?.permanent || 'PERMANENTE'}
                </Badge>
              )}
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
              {isPermanent ? (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{t.vampiro?.trackerVisibleToAll || 'Todos os participantes verão esta mudança'}</span>
                </div>
              ) : (
                getVisibilityMessage()
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {t.common?.cancel || 'Cancelar'}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className={isPermanent ? 'bg-destructive hover:bg-destructive/90' : 'bg-destructive hover:bg-destructive/90'}
          >
            {isPermanent 
              ? (t.vampiro?.confirmPermanent || '⚠️ Confirmar Alteração')
              : (t.common?.confirm || 'Confirmar')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}