/**
 * W5Trackers — trackers do jogador para Lobisomem: A Fera Sombria (W5).
 *
 * Diferenças em relação ao W20:
 *  - Sem Gnose.
 *  - Fúria e Vontade capadas em 5 (escalas 5ed).
 *  - Adiciona Harmonia (0-10) — equilíbrio do lobo/humano (substitui Renome de sessão).
 *  - Persiste em colunas dedicadas `session_w5_rage`, `session_w5_willpower_current`,
 *    `session_w5_harmony`. Reaproveita `session_health_damage` e `session_form`.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Heart, Zap, Dog, Scale, AlertTriangle } from 'lucide-react';
import { TrackerChangeConfirmModal, TrackerType } from '../vampire/TrackerChangeConfirmModal';
import { FormChangeModal } from '../werewolf/FormChangeModal';
import type { LobisomemCharacterData } from '@/lib/lobisomem/diceUtils';

const HEALTH_LEVELS = ['bruised', 'hurt', 'injured', 'wounded', 'mauled', 'crippled', 'incapacitated'] as const;
const RAGE_MAX = 5;
const WILLPOWER_MAX = 5;
const HARANO_MAX = 5;
const HAUGLOSK_MAX = 5;

type W5TrackerKind = 'rage' | 'willpower' | 'harano' | 'hauglosk' | 'health';

interface PendingChange {
  type: W5TrackerKind;
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
    vampiro_data: LobisomemCharacterData | null;
  } | null;
  initialRage?: number;
  initialWillpower?: number;
  initialHarano?: number;
  initialHauglosk?: number;
  initialHealthDamage?: boolean[];
  initialForm?: string;
}

export function W5Trackers({
  participantId,
  sessionId,
  sceneId,
  character,
  initialRage = 0,
  initialWillpower = 0,
  initialHarano = 0,
  initialHauglosk = 0,
  initialHealthDamage = [false, false, false, false, false, false, false],
  initialForm = 'hominid',
}: Props) {
  const [rage, setRage] = useState(initialRage);
  const [willpower, setWillpower] = useState(initialWillpower);
  const [harano, setHarano] = useState(initialHarano);
  const [hauglosk, setHauglosk] = useState(initialHauglosk);
  const [health, setHealth] = useState<boolean[]>(initialHealthDamage);
  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const initialized = useRef(false);
  const prevWill = useRef(initialWillpower);
  const prevHarano = useRef(initialHarano);
  const prevHauglosk = useRef(initialHauglosk);

  const emit = useCallback(
    async (eventType: string, data: Record<string, unknown>) => {
      if (!character) return;
      await supabase.from('session_events').insert({
        session_id: sessionId,
        scene_id: sceneId,
        event_type: eventType,
        event_data: { character_id: character.id, character_name: character.name, ...data },
      });
    },
    [sessionId, sceneId, character],
  );

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    if (prevWill.current > 0 && willpower === 0) {
      emit('critical_state', { type: 'willpower_depleted' });
      sonnerToast.error('Vontade Exaurida!');
    }
    prevWill.current = willpower;
  }, [willpower, emit]);

  useEffect(() => {
    if (!initialized.current) return;
    if (prevHarano.current < HARANO_MAX && harano >= HARANO_MAX) {
      emit('critical_state', { type: 'harano_max' });
      sonnerToast.error('Harano no limite — a apatia domina!');
    }
    prevHarano.current = harano;
  }, [harano, emit]);

  useEffect(() => {
    if (!initialized.current) return;
    if (prevHauglosk.current < HAUGLOSK_MAX && hauglosk >= HAUGLOSK_MAX) {
      emit('critical_state', { type: 'hauglosk_max' });
      sonnerToast.error('Hauglosk no limite — a fúria explode!');
    }
    prevHauglosk.current = hauglosk;
  }, [hauglosk, emit]);

  const save = useCallback(
    async (patch: {
      session_w5_rage?: number;
      session_w5_willpower_current?: number;
      session_w5_harano?: number;
      session_w5_hauglosk?: number;
      session_health_damage?: boolean[];
      session_form?: string;
    }) => {
      setIsSaving(true);
      try {
        await supabase.from('session_participants').update(patch as any).eq('id', participantId);
      } catch (e) {
        if (import.meta.env.DEV) console.error('W5 trackers save', e);
      } finally {
        setIsSaving(false);
      }
    },
    [participantId],
  );

  const requestChange = (type: W5TrackerKind, index: number, current: number) => {
    const newValue = index < current ? index : index + 1;
    setPending({ type, currentValue: current, newValue });
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
    if (type === 'rage') {
      setRage(newValue);
      save({ session_w5_rage: newValue });
    } else if (type === 'willpower') {
      setWillpower(newValue);
      save({ session_w5_willpower_current: newValue });
    } else if (type === 'harano') {
      setHarano(newValue);
      save({ session_w5_harano: newValue });
    } else if (type === 'hauglosk') {
      setHauglosk(newValue);
      save({ session_w5_hauglosk: newValue });
    } else if (type === 'health') {
      const next = Array(7).fill(false);
      for (let i = 0; i < newValue; i++) next[i] = true;
      setHealth(next);
      save({ session_health_damage: next });
    }
    setPending(null);
  };

  const onFormChange = async (next: string) => {
    const old = form;
    setForm(next);
    await emit('tracker_change', { tracker_type: 'form', old_value: old, new_value: next });
    save({ session_form: next });
  };

  if (!character) {
    return (
      <Card className="medieval-card border-red-600/20">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum personagem selecionado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* RAGE */}
      <Card className={`medieval-card ${rage >= RAGE_MAX ? 'border-destructive' : 'border-red-600/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-red-600">
            <Flame className="w-4 h-4" />
            Fúria
            {isSaving && <span className="text-xs text-muted-foreground ml-auto animate-pulse">...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2 md:gap-1 justify-center">
            {Array.from({ length: RAGE_MAX }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => requestChange('rage', i, rage)}
                className={`w-6 h-6 md:w-4 md:h-4 rounded-full border-2 transition-colors cursor-pointer hover:border-red-600 ${
                  i < rage ? 'bg-red-600 border-red-600' : 'border-muted-foreground/40 bg-transparent'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{rage}/{RAGE_MAX}</p>
        </CardContent>
      </Card>

      {/* WILLPOWER */}
      <Card className={`medieval-card ${willpower === 0 ? 'border-amber-500' : 'border-red-600/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-foreground" />
            Vontade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2 md:gap-1 justify-center">
            {Array.from({ length: WILLPOWER_MAX }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => requestChange('willpower', i, willpower)}
                className={`w-6 h-6 md:w-4 md:h-4 rounded border-2 transition-colors cursor-pointer hover:border-foreground ${
                  i < willpower ? 'bg-foreground border-foreground' : 'border-muted-foreground/40 bg-transparent'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{willpower}/{WILLPOWER_MAX}</p>
        </CardContent>
      </Card>

      {/* HARANO */}
      <Card className={`medieval-card ${harano >= HARANO_MAX ? 'border-destructive' : 'border-red-600/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-red-500">
            <Scale className="w-4 h-4" />
            Harano
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-1.5 md:gap-1 justify-center">
            {Array.from({ length: HARANO_MAX }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => requestChange('harano', i, harano)}
                className={`w-5 h-5 md:w-4 md:h-4 rounded-full border-2 transition-colors cursor-pointer hover:border-red-500 ${
                  i < harano ? 'bg-red-500 border-red-500' : 'border-muted-foreground/40 bg-transparent'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{harano}/{HARANO_MAX}</p>
        </CardContent>
      </Card>

      {/* HAUGLOSK */}
      <Card className={`medieval-card ${hauglosk >= HAUGLOSK_MAX ? 'border-destructive' : 'border-red-600/20'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-blue-400">
            <Scale className="w-4 h-4" />
            Hauglosk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-1.5 md:gap-1 justify-center">
            {Array.from({ length: HAUGLOSK_MAX }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => requestChange('hauglosk', i, hauglosk)}
                className={`w-5 h-5 md:w-4 md:h-4 rounded-full border-2 transition-colors cursor-pointer hover:border-blue-400 ${
                  i < hauglosk ? 'bg-blue-400 border-blue-400' : 'border-muted-foreground/40 bg-transparent'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{hauglosk}/{HAUGLOSK_MAX}</p>
        </CardContent>
      </Card>

      {/* HEALTH */}
      <Card className="medieval-card border-red-600/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-destructive" />
            Vitalidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {HEALTH_LEVELS.map((level, index) => {
              const isDamaged = health[index];
              const penalties = [0, -1, -1, -2, -2, -5, '—'];
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => requestHealth(index)}
                  className={`w-full flex items-center justify-between p-2.5 md:p-1.5 rounded text-sm transition-colors ${
                    isDamaged ? 'bg-destructive/20 border border-destructive/40' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <span className={isDamaged ? 'text-destructive' : 'text-muted-foreground'}>{level}</span>
                  <span className={`text-xs ${isDamaged ? 'text-destructive' : 'text-muted-foreground'}`}>{penalties[index]}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* FORM */}
      <Card className="medieval-card border-red-600/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-medieval text-sm flex items-center gap-2 text-red-600">
            <Dog className="w-4 h-4" />
            Forma Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="border-red-600/30 text-red-600 font-medieval">
              {form}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFormOpen(true)}
              className="border-red-600/30 hover:bg-red-600/10 text-xs"
            >
              <Dog className="w-3 h-3 mr-1" />
              Mudar Forma
            </Button>
          </div>
        </CardContent>
      </Card>

      <FormChangeModal
        open={isFormOpen}
        currentForm={form}
        onConfirm={(f) => {
          setIsFormOpen(false);
          onFormChange(f);
        }}
        onCancel={() => setIsFormOpen(false)}
      />

      {pending && (
        <TrackerChangeConfirmModal
          open={!!pending}
          trackerType={(pending.type === 'harmony' ? 'willpower' : pending.type) as TrackerType}
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

export default W5Trackers;
