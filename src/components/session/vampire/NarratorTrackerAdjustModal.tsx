import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import { Droplets, Sparkles, Heart, Moon, Minus, Plus, Zap } from 'lucide-react';
import { TrackerType } from './TrackerChangeConfirmModal';

interface NarratorTrackerAdjustModalProps {
  open: boolean;
  trackerType: TrackerType;
  characterName: string;
  currentValue: number;
  maxValue?: number;
  isPermanent?: boolean;
  onConfirm: (newValue: number) => void;
  onCancel: () => void;
}

export function NarratorTrackerAdjustModal({
  open,
  trackerType,
  characterName,
  currentValue,
  maxValue,
  isPermanent = false,
  onConfirm,
  onCancel,
}: NarratorTrackerAdjustModalProps) {
  const t = useTranslation();
  const [proposedValue, setProposedValue] = useState(currentValue);

  // Reset proposed value when modal opens with new data
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onCancel();
    } else {
      setProposedValue(currentValue);
    }
  };

  // For health tracker, we display inverted values
  const isHealthTracker = trackerType === 'health';
  const displayValue = isHealthTracker ? 7 - proposedValue : proposedValue;
  const displayMax = isHealthTracker ? 7 : (maxValue || 50);

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
    }
  };

  const getTrackerLabel = () => {
    switch (trackerType) {
      case 'blood':
        return t.vampiro?.bloodPool || 'Sangue';
      case 'willpower':
        return t.vampiro?.willpowerCurrent || 'Vontade';
      case 'health':
        return t.vampiro?.healthLevels || 'Vitalidade';
      case 'humanity':
        return t.vampiro?.humanity || 'Humanidade';
    }
  };

  const getMinValue = () => {
    // For all trackers, min is 0
    return 0;
  };

  const getMaxValue = () => {
    switch (trackerType) {
      case 'blood':
        return maxValue || 50;
      case 'willpower':
        return maxValue || 10;
      case 'health':
        return 7; // 7 damage levels max
      case 'humanity':
        return 10;
      default:
        return 10;
    }
  };

  const handleDecrease = () => {
    if (isHealthTracker) {
      // For health, decreasing display value means decreasing damage (healing)
      if (proposedValue > getMinValue()) {
        setProposedValue(proposedValue - 1);
      }
    } else {
      if (proposedValue > getMinValue()) {
        setProposedValue(proposedValue - 1);
      }
    }
  };

  const handleIncrease = () => {
    if (isHealthTracker) {
      // For health, increasing display value means increasing damage
      if (proposedValue < getMaxValue()) {
        setProposedValue(proposedValue + 1);
      }
    } else {
      if (proposedValue < getMaxValue()) {
        setProposedValue(proposedValue + 1);
      }
    }
  };

  const hasChanged = proposedValue !== currentValue;

  // Labels for + and - buttons
  const getDecreaseLabel = () => {
    if (isHealthTracker) {
      return t.vampiro?.heal || 'Curar';
    }
    return t.vampiro?.lose || 'Perder';
  };

  const getIncreaseLabel = () => {
    if (isHealthTracker) {
      return t.vampiro?.damage || 'Dano';
    }
    return t.vampiro?.recover || 'Recuperar';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-medieval flex items-center gap-2">
            {getTrackerIcon()}
            {t.vampiro?.adjustTracker || 'Ajustar'} {getTrackerLabel()} - {characterName}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-4">
          {/* Permanent Warning */}
          {isPermanent && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/20 border border-destructive/40 text-destructive">
              <Zap className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">
                  {t.vampiro?.trackerPermanentWarning || 'ALTERAÇÃO PERMANENTE'}
                </p>
                <p className="text-xs mt-1 text-destructive/80">
                  {t.vampiro?.trackerPermanentDescription || 
                    'Esta mudança afetará a ficha do personagem permanentemente.'}
                </p>
              </div>
            </div>
          )}

          {/* +/- Controls */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full border-2"
                onClick={handleDecrease}
                disabled={isHealthTracker ? proposedValue <= 0 : proposedValue <= 0}
              >
                <Minus className="w-6 h-6" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {getDecreaseLabel()}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-4xl font-medieval font-bold">
                {displayValue}
              </span>
              <span className="text-sm text-muted-foreground">
                / {displayMax}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full border-2"
                onClick={handleIncrease}
                disabled={isHealthTracker ? proposedValue >= 7 : proposedValue >= getMaxValue()}
              >
                <Plus className="w-6 h-6" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {getIncreaseLabel()}
              </span>
            </div>
          </div>

          {/* Change indicator */}
          {hasChanged && (
            <div className="text-center">
              <Badge 
                variant={isHealthTracker 
                  ? (proposedValue > currentValue ? 'destructive' : 'default')
                  : (proposedValue < currentValue ? 'destructive' : 'default')
                }
                className={isHealthTracker 
                  ? (proposedValue <= currentValue ? 'bg-green-600' : '')
                  : (proposedValue >= currentValue ? 'bg-green-600' : '')
                }
              >
                {isHealthTracker 
                  ? (proposedValue > currentValue 
                      ? `${proposedValue - currentValue} ${t.vampiro?.damageTaken || 'dano'}` 
                      : `${currentValue - proposedValue} ${t.vampiro?.healed || 'curado'}`)
                  : (proposedValue > currentValue 
                      ? `+${proposedValue - currentValue}` 
                      : `${proposedValue - currentValue}`)
                }
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t.common?.cancel || 'Cancelar'}
          </Button>
          <Button
            onClick={() => onConfirm(proposedValue)}
            disabled={!hasChanged}
            className={isPermanent ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {t.common?.confirm || 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
