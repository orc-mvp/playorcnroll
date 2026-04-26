/**
 * Adapter STUB: Mortos-Vivos / Wraith (W20)
 *
 * NÃO disponível ainda. Reserva ID e shape.
 */

import { Skull, Heart, Sparkles, Eye, Flame } from 'lucide-react';
import { ComingSoonComponent } from '@/components/session/shared/ComingSoonComponent';
import type { SystemAdapter } from '../types';

export const mortosVivosAdapter: SystemAdapter = {
  id: 'mortos_vivos_w20',
  shortLabel: 'Mortos-Vivos',
  fullLabel: 'Mortos-Vivos / Wraith (W20)',
  icon: Skull,
  color: 'text-slate-400',
  borderColor: 'border-slate-400/20',
  bgColor: 'bg-slate-400/10',
  available: false,

  participantSelectFields: [
    'session_willpower_current',
    'session_health_damage',
    // futuro: 'session_pathos', 'session_corpus', 'session_angst'
  ],

  trackers: [
    {
      key: 'pathos',
      label: 'Pathos',
      icon: Eye,
      color: 'text-slate-400',
      getMax: () => 10,
      getCurrent: () => 0,
    },
    {
      key: 'corpus',
      label: 'Corpus',
      icon: Heart,
      color: 'text-slate-300',
      getMax: () => 10,
      getCurrent: () => 0,
    },
    {
      key: 'angst',
      label: 'Angústia',
      icon: Flame,
      color: 'text-slate-500',
      getMax: () => 10,
      getCurrent: () => 0,
    },
    {
      key: 'willpower',
      label: 'Força de Vontade',
      icon: Sparkles,
      color: 'text-primary',
      getMax: (data) => data?.willpower || 1,
      getCurrent: (p) => p.session_willpower_current ?? 0,
    },
  ],

  initializeTrackers: () => null,

  CharacterSheet: ComingSoonComponent as any,
  PlayerTrackersComponent: ComingSoonComponent as any,
  TestRequestModalComponent: ComingSoonComponent as any,
  PendingTestComponent: ComingSoonComponent as any,
  PlayerSidePanel: ComingSoonComponent as any,
};
