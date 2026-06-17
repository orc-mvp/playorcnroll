/**
 * M5Trackers — trackers do jogador para Mago 5ª Edição.
 *
 * Caps 5ed:
 *  - Arête 1-5 (fixo, vem da ficha)
 *  - Quintessência 0-5
 *  - Paradoxo 0-10
 *  - Vontade 0-5
 *  - Vitalidade 7 níveis (compartilhada com clássico)
 *
 * Persiste em `session_quintessence`, `session_paradox`, `session_arete`,
 * `session_willpower_current`, `session_health_damage` (mesmas colunas do M20).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Heart, Star, AlertTriangle, Minus, Plus } from 'lucide-react';
import { TrackerChangeConfirmModal, TrackerType } from '../vampire/TrackerChangeConfirmModal';
import type { MagoCharacterData } from '@/lib/mago/spheres';

const HEALTH_LEVELS = ['bruised', 'hurt', 'injured', 'wounded', 'mauled', 'crippled', 'incapacitated'] as const;
const HEALTH_LABEL_PT: Record<string, string> = {
  bruised: 'Escoriado', hurt: 'Machucado', injured: 'Ferido', wounded: 'Lesionado',
  mauled: 'Espancado', crippled: 'Aleijado', incapacitated: 'Incapacitado',
};
const QUINT_MAX = 5;
const PARADOX_MAX = 10;
const WILLPOWER_MAX_CAP = 5;

type M5Kind = 'quintessence' | 'paradox' | 'willpower' | 'health';

interface PendingChange {
  type: M5Kind;
  currentValue: number;
  newValue: number;
}

interface Props {
  participantId: string;
  sessionId: string;
  sceneId: string | null;
  character: {
    id: string;
    name: string;
    game_system?: string;
    vampiro_data: MagoCharacterData | null;
  } | null;
  initialQuintessence?: number;
  initialParadox?: number;
  initialArete?: number;
  initialWillpower?: number;
  initialHealthDamage?: boolean[];
}

export function M5Trackers({
  participantId,
  sessionId,
  sceneId,
  character,
  initialQuintessence = 0,
  initialParadox = 0,
  initialArete = 1,
  initialWillpower = 0,
  initialHealthDamage = [false, false, false, false, false, false, false],
}: Props) {
  const data = character?.vampiro_data as MagoCharacterData | null;
  const maxArete = Math.min(5, data?.arete || 1);
  const maxWillpower = Math.min(WILLPOWER_MAX_CAP, data?.willpower || 1);

  const [quint, setQuint] = useState(initialQuintessence);
  const [paradox, setParadox] = useState(initialParadox);
  const [willpower, setWillpower] = useState(initialWillpower);
  const [health, setHealth] = useState<boolean[]>(initialHealthDamage);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const initialized = useRef(false);
  const prevWill = useRef(initialWillpower);
  const prevParadox = useRef(initialParadox);

  // Sincroniza Arête (fixo) com a ficha
  useEffect(() => {
    if (maxArete !== initialArete) {
      supabase.from('session_participants').update({ session_arete: maxArete } as any).eq('id', participantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxArete]);

  const emit = useCallback(
    async (eventType: string, dataPayload: Record<string, unknown>) => {
      if (!character) return;
      await supabase.from('session_events').insert({
        session_id: sessionId,
        scene_id: sceneId,
        event_type: eventType,
        event_data: { character_id: character.id, character_name: character.name, ...dataPayload },
      });
    },
    [sessionId, sceneId, character],
  );

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    if (prevWill.current > 0 && willpower === 0) {
      emit('critical_state', { type: 'willpower_depleted' });
      sonnerToast.error('Vontade Exaurida!');
    }
    prevWill.current = willpower;
  }, [willpower, emit]);

  useEffect(() => {
    if (!initialized.current) return;
    if (prevParadox.current < 8 && paradox >= 8) {
      emit('critical_state', { type: 'paradox_critical' });
      sonnerToast.error('Paradoxo crítico — Quiet iminente!');
    }
    prevParadox.current = paradox;
  }, [paradox, emit]);

  const save = useCallback(
    async (patch: Record<string, unknown>) => {
      setIsSaving(true);
      try {
        await supabase.from('session_participants').update(patch as any).eq('id', participantId);
      } catch (e) {
        if (import.meta.env.DEV) console.error('M5 trackers save', e);
      } finally {
        setIsSaving(false);
      }
    },
    [participantId],
  );

  const requestDelta = (type: 'quintessence' | 'paradox', delta: number) => {
    const current = type === 'quintessence' ? quint : paradox;
    const max = type === 'quintessence' ? QUINT_MAX : PARADOX_MAX;
    const newValue = Math.max(0, Math.min(max, current + delta));
    if (newValue === current) return;
    setPending({ type, currentValue: current, newValue });
  };

  const requestWillpower = (index: number) => {
    const newValue = index < willpower ? index : index + 1;
    setPending({ type: 'willpower', currentValue: willpower, newValue });
  };

  const requestHealth = (index: number) => {
    const damaged = health.filter(Boolean).length;
    const newValue = health[index] ? index : index + 1;
    setPending({ type: 'health', currentValue: damaged, newValue });
  };

  const confirm = async () => {
    if (!pending) return;
    const { type, currentValue, newValue } = pending;
    await emit('tracker_change', {
      tracker_type: type,
      old_value: currentValue,
      new_value: newValue,
      is_narrator_change: false,
    });
    if (type === 'quintessence') { setQuint(newValue); save({ session_quintessence: newValue }); }
    else if (type === 'paradox') { setParadox(newValue); save({ session_paradox: newValue }); }
    else if (type === 'willpower') { setWillpower(newValue); save({ session_willpower_current: newValue }); }
    else if (type === 'health') {
      const next = Array(7).fill(false);
      for (let i = 0; i < newValue; i++) next[i] = true;
      setHealth(next);
      save({ session_health_damage: next });
    }
    setPending(null);
  };

  if (!character) {
    return (
      <Card className="medieval-card border-purple-500/20">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum personagem selecionado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* QUINTESSÊNCIA (+/-) */}
      <Card className={`medieval-card ${quint === 0 ? 'border-amber-500' : 'border-purple-500/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-purple-500">
            <Sparkles className="w-4 h-4" /> Quintessência
            {isSaving && <span className="text-xs text-muted-foreground ml-auto animate-pulse">...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8 border-purple-500/30 hover:bg-purple-500/10"
              onClick={() => requestDelta('quintessence', -1)} disabled={quint === 0}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-medieval text-2xl min-w-[3ch] text-center">{quint}</span>
            <Button variant="outline" size="icon" className="h-8 w-8 border-purple-500/30 hover:bg-purple-500/10"
              onClick={() => requestDelta('quintessence', 1)} disabled={quint >= QUINT_MAX}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">{quint}/{QUINT_MAX}</p>
        </CardContent>
      </Card>

      {/* PARADOXO (+/-) */}
      <Card className={`medieval-card ${paradox >= 8 ? 'border-destructive' : 'border-purple-500/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-destructive">
            <Zap className="w-4 h-4" /> Paradoxo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8 border-destructive/30 hover:bg-destructive/10"
              onClick={() => requestDelta('paradox', -1)} disabled={paradox === 0}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-medieval text-2xl min-w-[3ch] text-center">{paradox}</span>
            <Button variant="outline" size="icon" className="h-8 w-8 border-destructive/30 hover:bg-destructive/10"
              onClick={() => requestDelta('paradox', 1)} disabled={paradox >= PARADOX_MAX}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">{paradox}/{PARADOX_MAX}</p>
        </CardContent>
      </Card>

      {/* ARÊTE (fixo) */}
      <Card className="medieval-card border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-purple-500">
            <Star className="w-4 h-4" /> Arête
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2 md:gap-1 justify-center">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={`w-6 h-6 md:w-4 md:h-4 rounded-full border-2 ${
                i < maxArete ? 'bg-purple-500 border-purple-500' : 'border-muted-foreground/40 bg-transparent'
              }`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{maxArete}/5</p>
        </CardContent>
      </Card>

      {/* VONTADE */}
      <Card className={`medieval-card ${willpower === 0 ? 'border-amber-500' : 'border-purple-500/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-foreground" /> Vontade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2 md:gap-1 justify-center">
            {Array.from({ length: maxWillpower }, (_, i) => (
              <button key={i} type="button" onClick={() => requestWillpower(i)}
                className={`w-6 h-6 md:w-4 md:h-4 rounded border-2 transition-colors cursor-pointer hover:border-foreground ${
                  i < willpower ? 'bg-foreground border-foreground' : 'border-muted-foreground/40 bg-transparent'
                }`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{willpower}/{maxWillpower}</p>
        </CardContent>
      </Card>

      {/* VITALIDADE */}
      <Card className="medieval-card border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" /> Vitalidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {HEALTH_LEVELS.map((level, index) => {
              const isDamaged = health[index];
              const penalties = [0, -1, -1, -2, -2, -5, '—'];
              return (
                <button key={level} type="button" onClick={() => requestHealth(index)}
                  className={`w-full flex items-center justify-between p-2.5 md:p-1.5 rounded text-sm transition-colors ${
                    isDamaged ? 'bg-destructive/20 border border-destructive/40' : 'bg-muted/30 hover:bg-muted/50'
                  }`}>
                  <span className={isDamaged ? 'text-destructive' : 'text-muted-foreground'}>
                    {HEALTH_LABEL_PT[level] || level}
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

      {pending && (
        <TrackerChangeConfirmModal
          open={!!pending}
          trackerType={(pending.type === 'paradox' || pending.type === 'quintessence' ? 'blood' : pending.type) as TrackerType}
          currentValue={pending.currentValue}
          newValue={pending.newValue}
          isNarrator={false}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}

export default M5Trackers;
