/**
 * Adapter: Lobisomem — A Fera Sombria (W5, 5ª Edição)
 *
 * Difere do W20 (clássico) em:
 *  - Fúria 0–5, Vontade 0–5 (escalas reduzidas).
 *  - Sem Gnose como pool consumível; adiciona Harmonia 0–10.
 *  - Motor de dados em "pool dividido": cada rolagem mistura dados normais
 *    com dados de Fúria (cor diferente). Pares de 10 = +2 sucessos.
 *    Messy Critical se 10 envolvido é de Fúria. Brutal Outcome em falha
 *    com 1 de Fúria.
 *  - Dificuldade = NÚMERO DE SUCESSOS (não TN por dado).
 *  - Não usa 10s explosivos (substituído por pares de 10).
 *
 * Trackers persistem em colunas dedicadas `session_w5_*` (não compartilham
 * com `session_rage`/`session_willpower_current` do W20).
 */

import { Moon, Flame, Zap, Heart, Scale } from 'lucide-react';
import { lobisomemAdapter } from './lobisomemAdapter';
import { W5PendingTest } from '@/components/session/storyteller/W5PendingTest';
import { W5Trackers } from '@/components/session/storyteller/W5Trackers';
import type { SystemAdapter } from '../types';

export const lobisomemW5Adapter: SystemAdapter = {
  ...lobisomemAdapter,
  id: 'lobisomem_w5',
  shortLabel: 'Lobisomem 5ed',
  fullLabel: 'Lobisomem: A Fera Sombria (W5)',
  icon: Moon,
  color: 'text-red-600',
  borderColor: 'border-red-600/20',
  bgColor: 'bg-red-600/10',
  edition: '5ed',
  available: true,
  PendingTestComponent: W5PendingTest as any,
  PlayerTrackersComponent: W5Trackers as any,

  participantSelectFields: [
    'session_w5_rage',
    'session_w5_willpower_current',
    'session_w5_harmony',
    'session_health_damage',
    'session_form',
  ],

  trackers: [
    {
      key: 'rage',
      label: 'Fúria',
      icon: Flame,
      color: 'text-red-600',
      getMax: () => 5,
      getCurrent: (p) => (p as any).session_w5_rage ?? 0,
    },
    {
      key: 'willpower',
      label: 'Vontade',
      icon: Zap,
      color: 'text-foreground',
      getMax: () => 5,
      getCurrent: (p) => (p as any).session_w5_willpower_current ?? 0,
    },
    {
      key: 'harmony',
      label: 'Harmonia',
      icon: Scale,
      color: 'text-emerald-500',
      getMax: () => 10,
      getCurrent: (p) => (p as any).session_w5_harmony ?? 7,
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
    // Inicializa apenas se ainda for default — Harmony default no DB é 7.
    const anyP = p as any;
    if ((anyP.session_w5_rage ?? 0) !== 0 || (anyP.session_w5_willpower_current ?? 0) !== 0) {
      return null;
    }
    return {
      session_w5_rage: 1,
      session_w5_willpower_current: 3,
      session_w5_harmony: anyP.session_w5_harmony ?? 7,
      session_health_damage: [false, false, false, false, false, false, false],
      session_form: 'hominid',
    } as any;
  },

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
      label: 'Reerguer (Vontade)',
      crossSystem: true,
      testType: 'willpower',
    },
    {
      id: 'rage',
      label: 'Teste de Frenesi (Fúria)',
      crossSystem: false,
      testType: 'rage',
    },
    {
      id: 'harmony',
      label: 'Teste de Harmonia',
      crossSystem: false,
      testType: 'harmony',
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
    defaultDifficulty: 2,
    allowExploding10s: false,
    extraPools: [],
    mode: 'w5-split',
  },
};
