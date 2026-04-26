/**
 * Adapter: Mago — A Ascensão (M20)
 *
 * Wrapper sobre os componentes em `src/components/character/mago/` e
 * `src/components/session/mage/`.
 */

import { Sparkles, Star, Zap, Heart } from 'lucide-react';
import MagoCharacterSheet from '@/components/character/mago/MagoCharacterSheet';
import { MagoTrackers } from '@/components/session/mage/MagoTrackers';
import { MagoPlayerSidePanel } from '@/components/session/mage/MagoPlayerSidePanel';
import WerewolfTestRequestModal from '@/components/session/werewolf/WerewolfTestRequestModal';
import { VampirePendingTest } from '@/components/session/vampire/VampirePendingTest';
import type { SystemAdapter } from '../types';

export const magoAdapter: SystemAdapter = {
  id: 'mago_m20',
  shortLabel: 'Mago',
  fullLabel: 'Mago: A Ascensão (M20)',
  icon: Star,
  color: 'text-purple-500',
  borderColor: 'border-purple-500/20',
  bgColor: 'bg-purple-500/10',
  available: true,

  participantSelectFields: [
    'session_quintessence',
    'session_paradox',
    'session_arete',
    'session_willpower_current',
    'session_health_damage',
  ],

  trackers: [
    {
      key: 'quintessence',
      label: 'Quintessência',
      icon: Sparkles,
      color: 'text-purple-500',
      getMax: () => 20,
      getCurrent: (p) => (p as any).session_quintessence ?? 0,
    },
    {
      key: 'paradox',
      label: 'Paradoxo',
      icon: Zap,
      color: 'text-destructive',
      getMax: () => 20,
      getCurrent: (p) => (p as any).session_paradox ?? 0,
    },
    {
      key: 'arete',
      label: 'Arête',
      icon: Star,
      color: 'text-purple-500',
      getMax: (data) => data?.arete || 10,
      getCurrent: (p) => (p as any).session_arete ?? 1,
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
      kind: 'health',
      isHealth: true,
    },
  ],

  initializeTrackers: (p) => {
    const data = p.character?.vampiro_data;
    if (!data) return null;
    if (((p as any).session_arete ?? 0) > 0 || (p.session_willpower_current ?? 0) !== 0) {
      return null;
    }
    return {
      session_quintessence: data.quintessence ?? 0,
      session_paradox: data.paradox ?? 0,
      session_arete: data.arete || 1,
      session_willpower_current: data.willpower || 1,
      session_health_damage: [false, false, false, false, false, false, false],
    } as any;
  },

  CharacterSheet: MagoCharacterSheet as any,
  PlayerTrackersComponent: MagoTrackers as any,
  // Mago reusa o WerewolfTestRequestModal (estrutura cross-system semelhante)
  TestRequestModalComponent: WerewolfTestRequestModal as any,
  // Mago reusa o VampirePendingTest passando gameSystem='mago_m20'
  PendingTestComponent: VampirePendingTest as any,
  PlayerSidePanel: MagoPlayerSidePanel,

  testCategories: [
    {
      id: 'attribute_ability',
      label: 'Atributo + Habilidade',
      crossSystem: true,
      testType: 'attribute_ability',
      requiresAttribute: true,
      requiresAbility: true,
    },
    {
      id: 'attribute_only',
      label: 'Atributo Puro',
      crossSystem: true,
      testType: 'attribute_only',
      requiresAttribute: true,
    },
    {
      id: 'willpower',
      label: 'Vontade',
      crossSystem: true,
      testType: 'willpower',
    },
    {
      id: 'arete',
      label: 'Arête',
      crossSystem: false,
      testType: 'arete',
    },
    {
      id: 'quintessence',
      label: 'Quintessência',
      crossSystem: false,
      testType: 'quintessence',
    },
    {
      id: 'raw_dice',
      label: 'Pool Avulso',
      crossSystem: true,
      testType: 'raw_dice',
      requiresDiceCount: true,
    },
  ],

  narratorRollConfig: {
    defaultDifficulty: 6,
    allowExploding10s: false,
    extraPools: [
      { id: 'arete', label: 'Arête', defaultDifficulty: 6 },
      { id: 'quintessence', label: 'Quintessência', defaultDifficulty: 6 },
    ],
  },
};
