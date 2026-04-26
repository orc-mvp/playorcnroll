/**
 * Adapter STUB: Mago — A Ascensão (M20)
 *
 * NÃO disponível ainda. Apenas reserva o ID e shape para que o registry
 * seja navegável. Os componentes apontam para placeholders "em breve".
 *
 * Para ativar:
 *  1. Criar componentes em src/components/character/mago/ e src/components/session/mage/
 *  2. Adicionar campos session_quintessence, session_paradox em session_participants (migration)
 *  3. Trocar `available: false` por `true` aqui e em GAME_SYSTEMS
 */

import { Sparkles, Star, Zap, Heart } from 'lucide-react';
import { ComingSoonComponent } from '@/components/session/shared/ComingSoonComponent';
import type { SystemAdapter } from '../types';

export const magoAdapter: SystemAdapter = {
  id: 'mago_m20',
  shortLabel: 'Mago',
  fullLabel: 'Mago: A Ascensão (M20)',
  icon: Star,
  color: 'text-purple-500',
  borderColor: 'border-purple-500/20',
  bgColor: 'bg-purple-500/10',
  available: false,

  participantSelectFields: [
    'session_willpower_current',
    'session_health_damage',
    // futuro: 'session_quintessence', 'session_paradox'
  ],

  trackers: [
    {
      key: 'quintessence',
      label: 'Quintessência',
      icon: Sparkles,
      color: 'text-purple-500',
      getMax: () => 0,
      getCurrent: () => 0,
    },
    {
      key: 'paradox',
      label: 'Paradoxo',
      icon: Zap,
      color: 'text-purple-700',
      getMax: () => 20,
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
    {
      key: 'health',
      label: 'Vitalidade',
      icon: Heart,
      color: 'text-purple-500',
      getMax: () => 7,
      getCurrent: (p) =>
        7 - ((p.session_health_damage as boolean[] | null)?.filter(Boolean).length ?? 0),
      isHealth: true,
    },
  ],

  initializeTrackers: () => null,

  CharacterSheet: ComingSoonComponent as any,
  PlayerTrackersComponent: ComingSoonComponent as any,
  TestRequestModalComponent: ComingSoonComponent as any,
  PendingTestComponent: ComingSoonComponent as any,
  PlayerSidePanel: ComingSoonComponent as any,

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
      label: 'Arete',
      crossSystem: false,
      testType: 'arete',
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
      { id: 'arete', label: 'Arete', defaultDifficulty: 6 },
      { id: 'quintessence', label: 'Quintessência', defaultDifficulty: 6 },
    ],
  },
};
