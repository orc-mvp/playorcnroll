/**
 * Adapter: Lobisomem W20
 *
 * Wrapper fino sobre os componentes existentes em `src/components/session/werewolf/`.
 */

import { Dog, Flame, Sparkles, Heart, Zap } from 'lucide-react';
import LobisomemCharacterSheet from '@/components/character/lobisomem/LobisomemCharacterSheet';
import { WerewolfTrackers } from '@/components/session/werewolf/WerewolfTrackers';
import WerewolfTestRequestModal from '@/components/session/werewolf/WerewolfTestRequestModal';
import { VampirePendingTest } from '@/components/session/vampire/VampirePendingTest';
import { LobisomemPlayerSidePanel } from '@/components/session/shared/LobisomemPlayerSidePanel';
import type { SystemAdapter } from '../types';

export const lobisomemAdapter: SystemAdapter = {
  id: 'lobisomem_w20',
  shortLabel: 'Lobisomem',
  fullLabel: 'Lobisomem: O Apocalipse (W20)',
  icon: Dog,
  color: 'text-emerald-500',
  borderColor: 'border-emerald-500/20',
  bgColor: 'bg-emerald-500/10',
  available: true,

  participantSelectFields: [
    'session_gnosis',
    'session_rage',
    'session_willpower_current',
    'session_health_damage',
    'session_form',
  ],

  trackers: [
    {
      key: 'rage',
      label: 'Fúria',
      icon: Flame,
      color: 'text-emerald-500',
      getMax: (data) => data?.rage || 1,
      getCurrent: (p) => p.session_rage ?? 0,
    },
    {
      key: 'gnosis',
      label: 'Gnose',
      icon: Zap,
      color: 'text-emerald-500',
      getMax: (data) => data?.gnosis || 1,
      getCurrent: (p) => p.session_gnosis ?? 0,
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
      color: 'text-emerald-500',
      getMax: () => 7,
      getCurrent: (p) =>
        7 - ((p.session_health_damage as boolean[] | null)?.filter(Boolean).length ?? 0),
      isHealth: true,
    },
  ],

  initializeTrackers: (p) => {
    const data = p.character?.vampiro_data;
    if (!data) return null;
    if ((p.session_gnosis ?? 0) !== 0 || (p.session_willpower_current ?? 0) !== 0) {
      return null;
    }
    return {
      session_gnosis: data.gnosis || 1,
      session_rage: data.rage || 1,
      session_willpower_current: data.willpower || 1,
      session_health_damage: [false, false, false, false, false, false, false],
      session_form: 'hominid',
    };
  },

  CharacterSheet: LobisomemCharacterSheet as any,
  PlayerTrackersComponent: WerewolfTrackers as any,
  TestRequestModalComponent: WerewolfTestRequestModal as any,
  // Lobisomem reusa o VampirePendingTest passando gameSystem='lobisomem_w20'
  PendingTestComponent: VampirePendingTest as any,
  PlayerSidePanel: LobisomemPlayerSidePanel,
};
