/**
 * Adapter: Mago — A Ascensão 5ª Edição (M5)
 *
 * Espelho do magoAdapter com edição '5ed' e motor de pool dividido com
 * dados de Paradoxo (Quiet Critical / Backlash). Caps 5ed: Arête/Quint/
 * Vontade em 0-5, Paradoxo em 0-10. Reaproveita as colunas existentes
 * `session_quintessence/paradox/arete/willpower_current`.
 */

import { Star, Sparkles, Zap, Heart } from 'lucide-react';
import MagoCharacterSheet from '@/components/character/mago/MagoCharacterSheet';
import { M5Trackers } from '@/components/session/storyteller/M5Trackers';
import { M5PendingTest } from '@/components/session/storyteller/M5PendingTest';
import { MagoPlayerSidePanel } from '@/components/session/mage/MagoPlayerSidePanel';
import MagoTestRequestModal from '@/components/session/mage/MagoTestRequestModal';
import type { SystemAdapter } from '../types';

export const magoM5Adapter: SystemAdapter = {
  id: 'mago_m5',
  shortLabel: 'Mago 5ed',
  fullLabel: 'Mago: A Ascensão (M5)',
  icon: Star,
  color: 'text-purple-500',
  borderColor: 'border-purple-500/20',
  bgColor: 'bg-purple-500/10',
  edition: '5ed',
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
      key: 'quintessence', label: 'Quintessência', icon: Sparkles, color: 'text-purple-500',
      getMax: () => 5,
      getCurrent: (p) => (p as any).session_quintessence ?? 0,
    },
    {
      key: 'paradox', label: 'Paradoxo', icon: Zap, color: 'text-destructive',
      getMax: () => 10,
      getCurrent: (p) => (p as any).session_paradox ?? 0,
    },
    {
      key: 'arete', label: 'Arête', icon: Star, color: 'text-purple-500',
      getMax: (data) => Math.min(5, data?.arete || 1),
      getCurrent: (p) => (p as any).session_arete ?? 1,
    },
    {
      key: 'willpower', label: 'Vontade', icon: Sparkles, color: 'text-foreground',
      getMax: (data) => Math.min(5, data?.willpower || 1),
      getCurrent: (p) => p.session_willpower_current ?? 0,
    },
    {
      key: 'health', label: 'Vitalidade', icon: Heart, color: 'text-destructive',
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
    if (((p as any).session_arete ?? 0) > 0 || (p.session_willpower_current ?? 0) !== 0) return null;
    return {
      session_quintessence: Math.min(5, data.quintessence ?? 0),
      session_paradox: Math.min(10, data.paradox ?? 0),
      session_arete: Math.min(5, data.arete || 1),
      session_willpower_current: Math.min(5, data.willpower || 3),
      session_health_damage: [false, false, false, false, false, false, false],
    } as any;
  },

  CharacterSheet: MagoCharacterSheet as any,
  PlayerTrackersComponent: M5Trackers as any,
  TestRequestModalComponent: MagoTestRequestModal as any,
  PendingTestComponent: M5PendingTest as any,
  PlayerSidePanel: MagoPlayerSidePanel,

  testCategories: [
    { id: 'attribute_ability', label: 'Atributo + Habilidade', crossSystem: true,
      testType: 'attribute_ability', requiresAttribute: true, requiresAbility: true },
    { id: 'attribute_only', label: 'Atributo Puro', crossSystem: true,
      testType: 'attribute_only', requiresAttribute: true },
    { id: 'willpower', label: 'Vontade', crossSystem: true, testType: 'willpower' },
    { id: 'arete', label: 'Arête', crossSystem: false, testType: 'arete' },
    { id: 'quintessence', label: 'Quintessência', crossSystem: false, testType: 'quintessence' },
    { id: 'raw_dice', label: 'Pool Avulso', crossSystem: true,
      testType: 'raw_dice', requiresDiceCount: true },
  ],

  narratorRollConfig: {
    defaultDifficulty: 2,
    allowExploding10s: false,
    extraPools: [],
    mode: 'm5-split',
  },
};
