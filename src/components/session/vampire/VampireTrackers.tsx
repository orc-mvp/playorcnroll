import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Sparkles, Heart, AlertTriangle, Skull } from 'lucide-react';
import { TrackerChangeConfirmModal, TrackerType } from './TrackerChangeConfirmModal';

interface VampiroCharacterData {
  player?: string;
  chronicle?: string;
  clan?: string;
  generation?: string;
  attributes?: {
    physical: { strength: number; dexterity: number; stamina: number };
    social: { charisma: number; manipulation: number; appearance: number };
    mental: { perception: number; intelligence: number; wits: number };
  };
  disciplines?: Record<string, number>;
  humanity?: number;
  willpower?: number;
}

interface VampireTrackersProps {
  participantId: string;
  sessionId: string;
  sceneId: string | null;
  character: {
    id: string;
    name: string;
    vampiro_data: VampiroCharacterData | null;
  } | null;
  initialBloodPool?: number;
  initialWillpower?: number;
  initialHealthDamage?: boolean[];
}

const HEALTH_LEVELS = [
  'bruised',
  'hurt',
  'injured',
  'wounded',
  'mauled',
  'crippled',
  'incapacitated',
] as const;

interface PendingChange {
  type: TrackerType;
  currentValue: number;
  newValue: number;
}

export function VampireTrackers({
  participantId,
  sessionId,
  sceneId,
  character,
  initialBloodPool = 0,
  initialWillpower = 0,
  initialHealthDamage = [false, false, false, false, false, false, false],
}: VampireTrackersProps) {
  const t = useTranslation();

  const vampiroData = character?.vampiro_data;
  const maxWillpower = vampiroData?.willpower || 1;

  const [bloodPool, setBloodPool] = useState(initialBloodPool);
  const [currentWillpower, setCurrentWillpower] = useState(initialWillpower);
  const [healthDamage, setHealthDamage] = useState<boolean[]>(initialHealthDamage);
  const [isSaving, setIsSaving] = useState(false);

  // Confirmation modal state
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Track previous values for critical state detection
  const prevBloodPool = useRef(initialBloodPool);
  const prevWillpower = useRef(initialWillpower);
  const hasInitialized = useRef(false);

  // Emit critical state event to session feed
  const emitCriticalEvent = useCallback(
    async (type: 'blood_depleted' | 'willpower_depleted') => {
      if (!character) return;

      await supabase.from('session_events').insert({
        session_id: sessionId,
        scene_id: sceneId,
        event_type: 'critical_state',
        event_data: {
          type,
          character_id: character.id,
          character_name: character.name,
        },
      });
    },
    [sessionId, sceneId, character]
  );

  // Detect blood pool critical state
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      prevBloodPool.current = bloodPool;
      prevWillpower.current = currentWillpower;
      return;
    }

    if (prevBloodPool.current > 0 && bloodPool === 0) {
      emitCriticalEvent('blood_depleted');
      sonnerToast.error(t.vampiro?.bloodDepleted || 'Sangue Esgotado!', {
        description: t.vampiro?.hungerFrenzy || 'Frenesi de Fome!',
        duration: 5000,
      });
    }
    prevBloodPool.current = bloodPool;
  }, [bloodPool, emitCriticalEvent, t]);

  // Detect willpower critical state
  useEffect(() => {
    if (!hasInitialized.current) return;

    if (prevWillpower.current > 0 && currentWillpower === 0) {
      emitCriticalEvent('willpower_depleted');
      sonnerToast.error(t.vampiro?.willpowerDepleted || 'Vontade Exaurida!', {
        description: t.vampiro?.vulnerableToCommands || 'Vulnerável a comandos!',
        duration: 5000,
      });
    }
    prevWillpower.current = currentWillpower;
  }, [currentWillpower, emitCriticalEvent, t]);

  // Save to database
  const saveTrackers = useCallback(
    async (blood: number, willpower: number, health: boolean[]) => {
      setIsSaving(true);
      try {
        await supabase
          .from('session_participants')
          .update({
            session_blood_pool: blood,
            session_willpower_current: willpower,
            session_health_damage: health,
          })
          .eq('id', participantId);
      } catch (error) {
        console.error('Error saving trackers:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [participantId]
  );

  // Handle blood pool change request
  const requestBloodChange = (index: number) => {
    const newValue = index < bloodPool ? index : index + 1;
    setPendingChange({
      type: 'blood',
      currentValue: bloodPool,
      newValue,
    });
    setIsConfirmOpen(true);
  };

  // Handle willpower change request
  const requestWillpowerChange = (index: number) => {
    const newValue = index < currentWillpower ? index : index + 1;
    setPendingChange({
      type: 'willpower',
      currentValue: currentWillpower,
      newValue,
    });
    setIsConfirmOpen(true);
  };

  // Handle health change request
  const requestHealthChange = (index: number) => {
    const currentDamagedLevels = healthDamage.filter(Boolean).length;
    const isCurrentlyDamaged = healthDamage[index];
    
    // Calculate new damaged levels
    const newDamagedLevels = isCurrentlyDamaged ? index : index + 1;
    
    setPendingChange({
      type: 'health',
      currentValue: currentDamagedLevels,
      newValue: newDamagedLevels,
    });
    setIsConfirmOpen(true);
  };

  // Confirm the pending change
  const confirmChange = () => {
    if (!pendingChange) return;

    switch (pendingChange.type) {
      case 'blood':
        setBloodPool(pendingChange.newValue);
        saveTrackers(pendingChange.newValue, currentWillpower, healthDamage);
        break;
      case 'willpower':
        setCurrentWillpower(pendingChange.newValue);
        saveTrackers(bloodPool, pendingChange.newValue, healthDamage);
        break;
      case 'health':
        const newHealth = Array(7).fill(false);
        for (let i = 0; i < pendingChange.newValue; i++) {
          newHealth[i] = true;
        }
        setHealthDamage(newHealth);
        saveTrackers(bloodPool, currentWillpower, newHealth);
        break;
    }

    setIsConfirmOpen(false);
    setPendingChange(null);
  };

  // Cancel the pending change
  const cancelChange = () => {
    setIsConfirmOpen(false);
    setPendingChange(null);
  };

  if (!character) {
    return (
      <Card className="medieval-card border-destructive/20">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum personagem selecionado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. DISCIPLINES (read-only, at the top) */}
      {vampiroData?.disciplines && Object.keys(vampiroData.disciplines).length > 0 && (
        <Card className="medieval-card border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-medieval text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-destructive" />
              {t.vampiro.disciplines}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(vampiroData.disciplines).map(([key, value]) =>
                value > 0 ? (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="font-body capitalize">
                      {t.vampiro[key as keyof typeof t.vampiro] || key}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < value
                              ? 'bg-destructive'
                              : 'bg-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. BLOOD POOL */}
      <Card className={`medieval-card ${bloodPool === 0 ? 'border-destructive' : 'border-destructive/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-destructive">
            <Droplets className="w-4 h-4" />
            {t.vampiro.bloodPool}
            {isSaving && (
              <span className="text-xs text-muted-foreground ml-auto animate-pulse">
                ...
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Critical State Banner */}
          {bloodPool === 0 && (
            <div className="bg-destructive/20 border border-destructive rounded-lg p-2 animate-pulse flex items-center gap-2">
              <Skull className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medieval text-destructive">
                {t.vampiro?.hungerFrenzy || 'Frenesi de Fome!'}
              </span>
            </div>
          )}

          <div className="space-y-1">
            {Array.from({ length: 5 }, (_, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {Array.from({ length: 10 }, (_, colIndex) => {
                  const index = rowIndex * 10 + colIndex;
                  const isFilled = index < bloodPool;
                  return (
                    <button
                      key={colIndex}
                      type="button"
                      onClick={() => requestBloodChange(index)}
                      className={`w-3 h-3 rounded-sm border transition-colors cursor-pointer hover:border-destructive ${
                        isFilled
                          ? 'bg-destructive border-destructive'
                          : 'border-destructive/40 bg-destructive/10'
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {bloodPool}/50
          </p>
        </CardContent>
      </Card>

      {/* 3. WILLPOWER */}
      <Card className={`medieval-card ${currentWillpower === 0 ? 'border-amber-500' : 'border-destructive/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-destructive" />
            {t.vampiro.willpowerCurrent}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Critical State Banner */}
          {currentWillpower === 0 && (
            <div className="bg-amber-500/20 border border-amber-500 rounded-lg p-2 animate-pulse flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medieval text-amber-500">
                {t.vampiro?.willpowerExhausted || 'Vontade Exaurida!'}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-1 justify-center">
            {Array.from({ length: maxWillpower }, (_, i) => {
              const isFilled = i < currentWillpower;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => requestWillpowerChange(i)}
                  className={`w-4 h-4 rounded border-2 transition-colors cursor-pointer hover:border-foreground ${
                    isFilled
                      ? 'bg-foreground border-foreground'
                      : 'border-muted-foreground/40 bg-transparent'
                  }`}
                />
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {currentWillpower}/{maxWillpower}
          </p>
        </CardContent>
      </Card>

      {/* 4. HEALTH TRACKER (Vitality) */}
      <Card className="medieval-card border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" />
            {t.vampiro.healthLevels}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {HEALTH_LEVELS.map((level, index) => {
              const isDamaged = healthDamage[index];
              const levelLabel = t.vampiro[level] || level;
              // Penalties: bruised=0, hurt=-1, injured=-1, wounded=-2, mauled=-2, crippled=-5
              const penalties = [0, -1, -1, -2, -2, -5, '—'];
              
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => requestHealthChange(index)}
                  className={`w-full flex items-center justify-between p-1.5 rounded text-sm transition-colors ${
                    isDamaged
                      ? 'bg-destructive/20 border border-destructive/40'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <span className={isDamaged ? 'text-destructive' : 'text-muted-foreground'}>
                    {levelLabel}
                  </span>
                  <span className={`text-xs ${isDamaged ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {penalties[index]}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {pendingChange && (
        <TrackerChangeConfirmModal
          open={isConfirmOpen}
          trackerType={pendingChange.type}
          currentValue={pendingChange.currentValue}
          newValue={pendingChange.newValue}
          isNarrator={false}
          onConfirm={confirmChange}
          onCancel={cancelChange}
        />
      )}
    </div>
  );
}
