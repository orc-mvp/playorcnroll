import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Sparkles, Heart, AlertTriangle, Dog, Zap } from 'lucide-react';
import { TrackerChangeConfirmModal, TrackerType } from '../vampire/TrackerChangeConfirmModal';
import { FormChangeModal } from './FormChangeModal';
import { Button } from '@/components/ui/button';
import type { LobisomemCharacterData } from '@/lib/lobisomem/diceUtils';
import { HOMINID_FORM_ID } from '@/lib/metamorfos/formUtils';

// Extend TrackerType for werewolf-specific trackers
type WerewolfTrackerType = TrackerType | 'gnosis' | 'rage' | 'form';

const HEALTH_LEVELS = ['bruised', 'hurt', 'injured', 'wounded', 'mauled', 'crippled', 'incapacitated'] as const;

interface WerewolfTrackersProps {
  participantId: string;
  sessionId: string;
  sceneId: string | null;
  character: {
    id: string;
    name: string;
    /** game_system do personagem — usado para distinguir Lobisomem (formas fixas)
     *  de Metamorfos (formas customizadas configuradas na ficha). */
    game_system?: string;
    vampiro_data: LobisomemCharacterData | null;
  } | null;
  initialGnosis?: number;
  initialRage?: number;
  initialWillpower?: number;
  initialHealthDamage?: boolean[];
  initialForm?: string;
}

interface PendingChange {
  type: TrackerType;
  currentValue: number;
  newValue: number;
  isPermanent?: boolean;
}

export function WerewolfTrackers({
  participantId,
  sessionId,
  sceneId,
  character,
  initialGnosis = 0,
  initialRage = 0,
  initialWillpower = 0,
  initialHealthDamage = [false, false, false, false, false, false, false],
  initialForm = 'hominid',
}: WerewolfTrackersProps) {
  const t = useTranslation();

  const lobData = character?.vampiro_data as LobisomemCharacterData | null;
  const maxGnosis = lobData?.gnosis || 1;
  const maxRage = lobData?.rage || 1;
  const maxWillpower = lobData?.willpower || 1;

  const [currentGnosis, setCurrentGnosis] = useState(initialGnosis);
  const [currentRage, setCurrentRage] = useState(initialRage);
  const [currentWillpower, setCurrentWillpower] = useState(initialWillpower);
  const [healthDamage, setHealthDamage] = useState<boolean[]>(initialHealthDamage);
  const [currentForm, setCurrentForm] = useState(initialForm);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Confirmation modal state
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const hasInitialized = useRef(false);
  const prevGnosis = useRef(initialGnosis);
  const prevRage = useRef(initialRage);
  const prevWillpower = useRef(initialWillpower);

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
    [sessionId, sceneId, character]
  );

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      prevGnosis.current = currentGnosis;
      prevRage.current = currentRage;
      prevWillpower.current = currentWillpower;
      return;
    }
    if (prevGnosis.current > 0 && currentGnosis === 0) {
      emitCriticalEvent('gnosis_depleted');
      sonnerToast.error(t.lobisomem?.gnosisDepleted || 'Gnose Esgotada!');
    }
    prevGnosis.current = currentGnosis;
  }, [currentGnosis, emitCriticalEvent, t]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    if (prevWillpower.current > 0 && currentWillpower === 0) {
      emitCriticalEvent('willpower_depleted');
      sonnerToast.error(t.vampiro?.willpowerDepleted || 'Vontade Exaurida!');
    }
    prevWillpower.current = currentWillpower;
  }, [currentWillpower, emitCriticalEvent, t]);

  const saveTrackers = useCallback(
    async (gnosis: number, rage: number, willpower: number, health: boolean[], form: string) => {
      setIsSaving(true);
      try {
        await supabase
          .from('session_participants')
          .update({
            session_gnosis: gnosis,
            session_rage: rage,
            session_willpower_current: willpower,
            session_health_damage: health,
            session_form: form,
          })
          .eq('id', participantId);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error saving trackers:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [participantId]
  );

  const emitTrackerChangeEvent = useCallback(
    async (type: string, oldValue: number | string, newValue: number | string, isPermanent = false) => {
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
          is_permanent: isPermanent,
        },
      });
    },
    [sessionId, sceneId, character]
  );

  const requestGnosisChange = (index: number) => {
    const newValue = index < currentGnosis ? index : index + 1;
    setPendingChange({ type: 'gnosis' as TrackerType, currentValue: currentGnosis, newValue });
    setIsConfirmOpen(true);
  };

  const requestRageChange = (index: number) => {
    const newValue = index < currentRage ? index : index + 1;
    setPendingChange({ type: 'rage' as TrackerType, currentValue: currentRage, newValue });
    setIsConfirmOpen(true);
  };

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

  const handleFormChange = async (form: string) => {
    const oldForm = currentForm;
    setCurrentForm(form);
    await emitTrackerChangeEvent('form', oldForm, form);
    saveTrackers(currentGnosis, currentRage, currentWillpower, healthDamage, form);
  };

  const confirmChange = async () => {
    if (!pendingChange) return;

    if (pendingChange.type === 'gnosis') {
      await emitTrackerChangeEvent('gnosis', pendingChange.currentValue, pendingChange.newValue);
      setCurrentGnosis(pendingChange.newValue);
      saveTrackers(pendingChange.newValue, currentRage, currentWillpower, healthDamage, currentForm);
    } else if (pendingChange.type === 'rage') {
      await emitTrackerChangeEvent('rage', pendingChange.currentValue, pendingChange.newValue);
      setCurrentRage(pendingChange.newValue);
      saveTrackers(currentGnosis, pendingChange.newValue, currentWillpower, healthDamage, currentForm);
    } else if (pendingChange.type === 'willpower') {
      await emitTrackerChangeEvent('willpower', pendingChange.currentValue, pendingChange.newValue);
      setCurrentWillpower(pendingChange.newValue);
      saveTrackers(currentGnosis, currentRage, pendingChange.newValue, healthDamage, currentForm);
    } else if (pendingChange.type === 'health') {
      await emitTrackerChangeEvent('health', pendingChange.currentValue, pendingChange.newValue);
      const newHealth = Array(7).fill(false);
      for (let i = 0; i < pendingChange.newValue; i++) newHealth[i] = true;
      setHealthDamage(newHealth);
      saveTrackers(currentGnosis, currentRage, currentWillpower, newHealth, currentForm);
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
      <Card className="medieval-card border-emerald-500/20">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t.narrator?.noCharacterSelected || 'Nenhum personagem selecionado'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isMetamorph = character?.game_system === 'metamorfos_w20';
  const customForms = isMetamorph ? (lobData?.metamorph_forms || []) : undefined;
  // Static Tailwind classes (purger-safe) por sistema
  const themeClasses = isMetamorph
    ? {
        cardBorder: 'border-amber-500/20',
        titleText: 'text-amber-500',
        badgeBorder: 'border-amber-500/30',
        badgeText: 'text-amber-500',
        btnBorder: 'border-amber-500/30',
        btnHover: 'hover:bg-amber-500/10',
      }
    : {
        cardBorder: 'border-emerald-500/20',
        titleText: 'text-emerald-500',
        badgeBorder: 'border-emerald-500/30',
        badgeText: 'text-emerald-500',
        btnBorder: 'border-emerald-500/30',
        btnHover: 'hover:bg-emerald-500/10',
      };

  const getFormLabel = (form: string) => {
    if (isMetamorph) {
      if (form === HOMINID_FORM_ID) {
        return (t.metamorfos as any)?.hominidName || 'Hominídeo';
      }
      const cf = customForms?.find((f) => f.id === form);
      return cf?.name || form;
    }
    const key = `form_${form}` as keyof typeof t.lobisomem;
    return (t.lobisomem as any)?.[key] || form;
  };

  return (
    <div className="space-y-4">
      {/* GNOSIS */}
      <Card className={`medieval-card ${currentGnosis === 0 ? 'border-amber-500' : 'border-emerald-500/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-emerald-500">
            <Sparkles className="w-4 h-4" />
            {t.lobisomem?.gnosis || 'Gnose'}
            {isSaving && <span className="text-xs text-muted-foreground ml-auto animate-pulse">...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2 md:gap-1 justify-center">
            {Array.from({ length: maxGnosis }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => requestGnosisChange(i)}
                className={`w-6 h-6 md:w-4 md:h-4 rounded-full border-2 transition-colors cursor-pointer hover:border-emerald-500 ${
                  i < currentGnosis ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/40 bg-transparent'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{currentGnosis}/{maxGnosis}</p>
        </CardContent>
      </Card>

      {/* RAGE */}
      <Card className={`medieval-card ${currentRage === maxRage ? 'border-destructive' : 'border-emerald-500/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-destructive">
            <Flame className="w-4 h-4" />
            {t.lobisomem?.rage || 'Fúria'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2 md:gap-1 justify-center">
            {Array.from({ length: maxRage }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => requestRageChange(i)}
                className={`w-6 h-6 md:w-4 md:h-4 rounded-full border-2 transition-colors cursor-pointer hover:border-destructive ${
                  i < currentRage ? 'bg-destructive border-destructive' : 'border-muted-foreground/40 bg-transparent'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{currentRage}/{maxRage}</p>
        </CardContent>
      </Card>

      {/* WILLPOWER */}
      <Card className={`medieval-card ${currentWillpower === 0 ? 'border-amber-500' : 'border-emerald-500/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-foreground" />
            {t.lobisomem?.willpowerLabel || t.vampiro?.willpowerCurrent || 'Força de Vontade'}
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
                  i < currentWillpower ? 'bg-foreground border-foreground' : 'border-muted-foreground/40 bg-transparent'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{currentWillpower}/{maxWillpower}</p>
        </CardContent>
      </Card>

      {/* HEALTH */}
      <Card className="medieval-card border-emerald-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" />
            {t.lobisomem?.vitality || t.vampiro?.healthLevels || 'Vitalidade'}
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
                    isDamaged ? 'bg-destructive/20 border border-destructive/40' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <span className={isDamaged ? 'text-destructive' : 'text-muted-foreground'}>{levelLabel}</span>
                  <span className={`text-xs ${isDamaged ? 'text-destructive' : 'text-muted-foreground'}`}>{penalties[index]}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CURRENT FORM */}
      <Card className={`medieval-card border-${themeAccent}/20`}>
        <CardHeader className="pb-2">
          <CardTitle className={`font-medieval text-sm flex items-center gap-2 text-${themeAccent}`}>
            <Dog className="w-4 h-4" />
            {t.lobisomem?.currentForm || 'Forma Atual'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`border-${themeAccent}/30 text-${themeAccent} font-medieval`}>
              {getFormLabel(currentForm)}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFormModalOpen(true)}
              className={`border-${themeAccent}/30 hover:bg-${themeAccent}/10 text-xs`}
            >
              <Dog className="w-3 h-3 mr-1" />
              {t.lobisomem?.changeForm || 'Mudar Forma'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Change Modal */}
      <FormChangeModal
        open={isFormModalOpen}
        currentForm={currentForm}
        customForms={customForms}
        onConfirm={(form) => {
          setIsFormModalOpen(false);
          handleFormChange(form);
        }}
        onCancel={() => setIsFormModalOpen(false)}
      />


      {/* Confirmation Modal */}
      {pendingChange && (
        <TrackerChangeConfirmModal
          open={isConfirmOpen}
          trackerType={pendingChange.type}
          currentValue={pendingChange.currentValue}
          newValue={pendingChange.newValue}
          isNarrator={false}
          isPermanent={pendingChange.isPermanent}
          onConfirm={confirmChange}
          onCancel={cancelChange}
        />
      )}
    </div>
  );
}
