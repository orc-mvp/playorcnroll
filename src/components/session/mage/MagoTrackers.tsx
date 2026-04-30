/**
 * MagoTrackers — sidebar trackers para Mago: A Ascensão (M20).
 * Inspirado no WerewolfTrackers, mas com Quintessência/Paradoxo (0-20),
 * Arête (1-10, fixo na ficha), Vontade (1-10) e Vitalidade (7 níveis WoD).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Zap, Heart, AlertTriangle, Star, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrackerChangeConfirmModal, TrackerType } from '../vampire/TrackerChangeConfirmModal';
import type { MagoCharacterData } from '@/lib/mago/spheres';

const HEALTH_LEVELS = [
  'bruised',
  'hurt',
  'injured',
  'wounded',
  'mauled',
  'crippled',
  'incapacitated',
] as const;

interface MagoTrackersProps {
  participantId: string;
  sessionId: string;
  sceneId: string | null;
  character: {
    id: string;
    name: string;
    vampiro_data: MagoCharacterData | null;
  } | null;
  initialQuintessence?: number;
  initialParadox?: number;
  initialArete?: number;
  initialWillpower?: number;
  initialHealthDamage?: boolean[];
}

interface PendingChange {
  type: TrackerType | 'quintessence' | 'paradox' | 'arete';
  currentValue: number;
  newValue: number;
}

export function MagoTrackers({
  participantId,
  sessionId,
  sceneId,
  character,
  initialQuintessence = 0,
  initialParadox = 0,
  initialArete = 1,
  initialWillpower = 0,
  initialHealthDamage = [false, false, false, false, false, false, false],
}: MagoTrackersProps) {
  const t = useTranslation();
  const data = character?.vampiro_data as MagoCharacterData | null;
  const maxArete = data?.arete || 10;
  const maxWillpower = data?.willpower || 1;

  const [currentQuintessence, setCurrentQuintessence] = useState(initialQuintessence);
  const [currentParadox, setCurrentParadox] = useState(initialParadox);
  const [currentArete, setCurrentArete] = useState(initialArete);
  const [currentWillpower, setCurrentWillpower] = useState(initialWillpower);
  const [healthDamage, setHealthDamage] = useState<boolean[]>(initialHealthDamage);
  const [isSaving, setIsSaving] = useState(false);

  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const hasInitialized = useRef(false);
  const prevQuint = useRef(initialQuintessence);
  const prevWillpower = useRef(initialWillpower);
  const prevParadox = useRef(initialParadox);

  const emitCriticalEvent = useCallback(
    async (type: string) => {
      if (!character) return;
      await supabase.from('session_events').insert({
        session_id: sessionId,
        scene_id: sceneId,
        event_type: 'critical_state',
        event_data: { type, character_id: character.id, character_name: character.name },
      });
    },
    [sessionId, sceneId, character],
  );

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      prevQuint.current = currentQuintessence;
      prevParadox.current = currentParadox;
      prevWillpower.current = currentWillpower;
      return;
    }
    if (prevQuint.current > 0 && currentQuintessence === 0) {
      emitCriticalEvent('quintessence_depleted');
      sonnerToast.error(t.mago?.quintessenceDepleted || 'Quintessência Esgotada!');
    }
    prevQuint.current = currentQuintessence;
  }, [currentQuintessence, emitCriticalEvent, t]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    if (prevWillpower.current > 0 && currentWillpower === 0) {
      emitCriticalEvent('willpower_depleted');
      sonnerToast.error(t.vampiro?.willpowerDepleted || 'Vontade Exaurida!');
    }
    prevWillpower.current = currentWillpower;
  }, [currentWillpower, emitCriticalEvent, t]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    if (prevParadox.current < 20 && currentParadox >= 20) {
      emitCriticalEvent('paradox_overflow');
      sonnerToast.error(t.mago?.paradoxOverflow || 'Paradoxo Crítico!');
    }
    prevParadox.current = currentParadox;
  }, [currentParadox, emitCriticalEvent, t]);

  const saveTrackers = useCallback(
    async (
      quintessence: number,
      paradox: number,
      arete: number,
      willpower: number,
      health: boolean[],
    ) => {
      setIsSaving(true);
      try {
        await supabase
          .from('session_participants')
          .update({
            session_quintessence: quintessence,
            session_paradox: paradox,
            session_arete: arete,
            session_willpower_current: willpower,
            session_health_damage: health,
          })
          .eq('id', participantId);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error saving Mago trackers:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [participantId],
  );

  const emitTrackerChangeEvent = useCallback(
    async (type: string, oldValue: number, newValue: number) => {
      if (!character) return;
      await supabase.from('session_events').insert({
        session_id: sessionId,
        scene_id: sceneId,
        event_type: 'tracker_change',
        event_data: {
          tracker_type: type,
          character_id: character.id,
          character_name: character.name,
          old_value: oldValue,
          new_value: newValue,
          is_narrator_change: false,
        },
      });
    },
    [sessionId, sceneId, character],
  );

  const requestQuintessenceDelta = (delta: number) => {
    const newValue = Math.max(0, Math.min(20, currentQuintessence + delta));
    if (newValue === currentQuintessence) return;
    setPendingChange({ type: 'quintessence', currentValue: currentQuintessence, newValue });
    setIsConfirmOpen(true);
  };

  const requestParadoxDelta = (delta: number) => {
    const newValue = Math.max(0, Math.min(20, currentParadox + delta));
    if (newValue === currentParadox) return;
    setPendingChange({ type: 'paradox', currentValue: currentParadox, newValue });
    setIsConfirmOpen(true);
  };

  // Arête é fixo: vem da ficha. Sincroniza session_arete com o valor da ficha
  // sempre que mudar (edição da ficha) e não permite alteração na sessão.
  useEffect(() => {
    if (maxArete !== currentArete) {
      setCurrentArete(maxArete);
      saveTrackers(currentQuintessence, currentParadox, maxArete, currentWillpower, healthDamage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxArete]);

  const requestWillpowerChange = (index: number) => {
    const newValue = index < currentWillpower ? index : index + 1;
    setPendingChange({ type: 'willpower', currentValue: currentWillpower, newValue });
    setIsConfirmOpen(true);
  };

  const requestHealthChange = (index: number) => {
    const currentDamagedLevels = healthDamage.filter(Boolean).length;
    const isCurrentlyDamaged = healthDamage[index];
    const newDamagedLevels = isCurrentlyDamaged ? index : index + 1;
    setPendingChange({ type: 'health', currentValue: currentDamagedLevels, newValue: newDamagedLevels });
    setIsConfirmOpen(true);
  };

  const confirmChange = async () => {
    if (!pendingChange) return;

    if (pendingChange.type === 'quintessence') {
      await emitTrackerChangeEvent('quintessence', pendingChange.currentValue, pendingChange.newValue);
      setCurrentQuintessence(pendingChange.newValue);
      saveTrackers(pendingChange.newValue, currentParadox, currentArete, currentWillpower, healthDamage);
    } else if (pendingChange.type === 'paradox') {
      await emitTrackerChangeEvent('paradox', pendingChange.currentValue, pendingChange.newValue);
      setCurrentParadox(pendingChange.newValue);
      saveTrackers(currentQuintessence, pendingChange.newValue, currentArete, currentWillpower, healthDamage);
    } else if (pendingChange.type === 'arete') {
      await emitTrackerChangeEvent('arete', pendingChange.currentValue, pendingChange.newValue);
      setCurrentArete(pendingChange.newValue);
      saveTrackers(currentQuintessence, currentParadox, pendingChange.newValue, currentWillpower, healthDamage);
    } else if (pendingChange.type === 'willpower') {
      await emitTrackerChangeEvent('willpower', pendingChange.currentValue, pendingChange.newValue);
      setCurrentWillpower(pendingChange.newValue);
      saveTrackers(currentQuintessence, currentParadox, currentArete, pendingChange.newValue, healthDamage);
    } else if (pendingChange.type === 'health') {
      await emitTrackerChangeEvent('health', pendingChange.currentValue, pendingChange.newValue);
      const newHealth = Array(7).fill(false);
      for (let i = 0; i < pendingChange.newValue; i++) newHealth[i] = true;
      setHealthDamage(newHealth);
      saveTrackers(currentQuintessence, currentParadox, currentArete, currentWillpower, newHealth);
    }

    setIsConfirmOpen(false);
    setPendingChange(null);
  };

  const cancelChange = () => {
    setIsConfirmOpen(false);
    setPendingChange(null);
  };

  if (!character) {
    return (
      <Card className="medieval-card border-purple-500/20">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t.narrator?.noCharacterSelected || 'Nenhum personagem selecionado'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* QUINTESSÊNCIA (0-20, controles +/-) */}
      <Card
        className={`medieval-card ${
          currentQuintessence === 0 ? 'border-amber-500' : 'border-purple-500/20'
        }`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-purple-500">
            <Sparkles className="w-4 h-4" />
            {t.mago?.quintessence || 'Quintessência'}
            {isSaving && <span className="text-xs text-muted-foreground ml-auto animate-pulse">...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-purple-500/30 hover:bg-purple-500/10"
              onClick={() => requestQuintessenceDelta(-1)}
              disabled={currentQuintessence === 0}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-medieval text-2xl text-foreground min-w-[3ch] text-center">
              {currentQuintessence}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-purple-500/30 hover:bg-purple-500/10"
              onClick={() => requestQuintessenceDelta(1)}
              disabled={currentQuintessence >= 20}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">{currentQuintessence}/20</p>
        </CardContent>
      </Card>

      {/* PARADOXO (0-20, controles +/-) */}
      <Card
        className={`medieval-card ${
          currentParadox >= 15 ? 'border-destructive' : 'border-purple-500/20'
        }`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-destructive">
            <Zap className="w-4 h-4" />
            {t.mago?.paradox || 'Paradoxo'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-destructive/30 hover:bg-destructive/10"
              onClick={() => requestParadoxDelta(-1)}
              disabled={currentParadox === 0}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-medieval text-2xl text-foreground min-w-[3ch] text-center">
              {currentParadox}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-destructive/30 hover:bg-destructive/10"
              onClick={() => requestParadoxDelta(1)}
              disabled={currentParadox >= 20}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">{currentParadox}/20</p>
        </CardContent>
      </Card>

      {/* ARÊTE (1-10) */}
      <Card className="medieval-card border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-purple-500">
            <Star className="w-4 h-4" />
            {t.mago?.arete || 'Arête'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2 md:gap-1 justify-center">
            {Array.from({ length: maxArete }, (_, i) => (
              <div
                key={i}
                className={`w-6 h-6 md:w-4 md:h-4 rounded-full border-2 ${
                  i < maxArete
                    ? 'bg-purple-500 border-purple-500'
                    : 'border-muted-foreground/40 bg-transparent'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {maxArete}/10
          </p>
        </CardContent>
      </Card>

      {/* VONTADE */}
      <Card
        className={`medieval-card ${
          currentWillpower === 0 ? 'border-amber-500' : 'border-purple-500/20'
        }`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-foreground" />
            {t.mago?.willpowerLabel || t.vampiro?.willpowerCurrent || 'Força de Vontade'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2 md:gap-1 justify-center">
            {Array.from({ length: maxWillpower }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => requestWillpowerChange(i)}
                className={`w-6 h-6 md:w-4 md:h-4 rounded border-2 transition-colors cursor-pointer hover:border-foreground ${
                  i < currentWillpower
                    ? 'bg-foreground border-foreground'
                    : 'border-muted-foreground/40 bg-transparent'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {currentWillpower}/{maxWillpower}
          </p>
        </CardContent>
      </Card>

      {/* VITALIDADE */}
      <Card className="medieval-card border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" />
            {t.mago?.vitality || t.vampiro?.healthLevels || 'Vitalidade'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {HEALTH_LEVELS.map((level, index) => {
              const isDamaged = healthDamage[index];
              const levelLabel = t.vampiro?.[level] || level;
              const penalties = [0, -1, -1, -2, -2, -5, '—'];
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => requestHealthChange(index)}
                  className={`w-full flex items-center justify-between p-2.5 md:p-1.5 rounded text-sm transition-colors ${
                    isDamaged
                      ? 'bg-destructive/20 border border-destructive/40'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <span className={isDamaged ? 'text-destructive' : 'text-muted-foreground'}>
                    {levelLabel}
                  </span>
                  <span
                    className={`text-xs ${isDamaged ? 'text-destructive' : 'text-muted-foreground'}`}
                  >
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
          trackerType={pendingChange.type as TrackerType}
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
