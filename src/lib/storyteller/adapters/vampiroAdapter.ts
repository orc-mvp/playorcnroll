/**
 * Adapter: Vampiro V3
 *
 * Wrapper fino sobre os componentes existentes em `src/components/session/vampire/`.
 * NÃO duplica lógica — apenas declara metadados (cor, ícone, trackers) e
 * referencia os componentes que já funcionam.
 */

import { Moon, Droplets, Sparkles, Heart } from 'lucide-react';
import VampiroCharacterSheet from '@/components/character/vampiro/VampiroCharacterSheet';
import { VampireTrackers } from '@/components/session/vampire/VampireTrackers';
import VampireTestRequestModal from '@/components/session/vampire/VampireTestRequestModal';
import { VampirePendingTest } from '@/components/session/vampire/VampirePendingTest';
import { VampirePlayerSidePanel } from '@/components/session/shared/VampirePlayerSidePanel';
import type { SystemAdapter } from '../types';

export const vampiroAdapter: SystemAdapter = {
  id: 'vampiro_v3',
  shortLabel: 'Vampiro',
  fullLabel: 'Vampiro: A Máscara (V3)',
  icon: Moon,
  color: 'text-destructive',
  borderColor: 'border-destructive/20',
  bgColor: 'bg-destructive/10',
  available: true,

  participantSelectFields: [
    'session_blood_pool',
    'session_willpower_current',
    'session_health_damage',
  ],

  trackers: [
    {
      key: 'blood',
      label: 'Sangue',
      icon: Droplets,
      color: 'text-destructive',
      getMax: (data) => {
        const generation = parseInt(data?.generation || '13', 10);
        if (generation <= 7) return 20;
        if (generation === 8) return 15;
        if (generation <= 10) return 13;
        if (generation <= 12) return 11;
        return 10;
      },
      getCurrent: (p) => p.session_blood_pool ?? 0,
    },
    {
      key: 'willpower',
      label: 'Força de Vontade',
      icon: Sparkles,
      color: 'text-primary',
      getMax: (data) => data?.willpower || 1,
      getCurrent: (p) => p.session_willpower_current ?? 0,
    },
    {
      key: 'health',
      label: 'Vitalidade',
      icon: Heart,
      color: 'text-destructive',
      getMax: () => 7,
      getCurrent: (p) =>
        7 - ((p.session_health_damage as boolean[] | null)?.filter(Boolean).length ?? 0),
      isHealth: true,
    },
  ],

  initializeTrackers: (p) => {
    const data = p.character?.vampiro_data;
    if (!data) return null;
    if ((p.session_blood_pool ?? 0) !== 0 || (p.session_willpower_current ?? 0) !== 0) {
      return null;
    }
    const generation = parseInt(data.generation || '13', 10);
    let bloodPool = 10;
    if (generation <= 7) bloodPool = 20;
    else if (generation === 8) bloodPool = 15;
    else if (generation <= 10) bloodPool = 13;
    else if (generation <= 12) bloodPool = 11;
    return {
      session_blood_pool: bloodPool,
      session_willpower_current: data.willpower || 1,
      session_health_damage: [false, false, false, false, false, false, false],
    };
  },

  CharacterSheet: VampiroCharacterSheet as any,
  PlayerTrackersComponent: VampireTrackers as any,
  TestRequestModalComponent: VampireTestRequestModal as any,
  PendingTestComponent: VampirePendingTest as any,
  PlayerSidePanel: VampirePlayerSidePanel,
};
