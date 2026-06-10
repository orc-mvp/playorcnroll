/**
 * Adapter: Lobisomem — A Fera Sombria (W5, 5ª Edição)
 *
 * Difere do W20 (clássico) em:
 *  - Fúria 0–5, Vontade 0–5 (escalas reduzidas).
 *  - Sem Gnose como pool consumível.
 *  - Motor de dados em "pool dividido": cada rolagem mistura dados normais
 *    com dados de Fúria (cor diferente). Pares de 10 = +2 sucessos.
 *    Messy Critical se 10 envolvido é de Fúria. Brutal Outcome em falha
 *    com 1 de Fúria.
 *  - Dificuldade = NÚMERO DE SUCESSOS (não TN por dado).
 *  - Não usa 10s explosivos (substituído por pares de 10).
 *
 * Estratégia (MVP): herda do `lobisomemAdapter` toda a parte de
 * personagem/ficha/edição (visualmente igual; valores capados em 5 são
 * convenção do jogador na ficha). Sobrescreve id/edição/cor/trackers e
 * configuração da rolagem do narrador para acionar a UI W5 dividida.
 */

import { Moon } from 'lucide-react';
import { lobisomemAdapter } from './lobisomemAdapter';
import { W5PendingTest } from '@/components/session/storyteller/W5PendingTest';
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

  // Trackers: Fúria e Vontade capadas em 5 via getMax. Health/Forma reusam W20.
  trackers: lobisomemAdapter.trackers.map((t) => {
    if (t.key === 'gnosis') return null;
    if (t.key === 'rage') {
      return {
        ...t,
        label: 'Fúria',
        color: 'text-red-600',
        getMax: () => 5,
      };
    }
    if (t.key === 'willpower') {
      return { ...t, getMax: () => 5 };
    }
    return t;
  }).filter(Boolean) as SystemAdapter['trackers'],

  // Categorias de teste do W5: sem Gnose, adiciona Frenesi.
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
      id: 'raw_dice',
      label: 'Pool Avulso',
      crossSystem: true,
      testType: 'raw_dice',
      requiresDiceCount: true,
    },
  ],

  narratorRollConfig: {
    // 5ed usa "sucessos necessários" — default 2 (testes simples).
    defaultDifficulty: 2,
    // Sem 10s explosivos no W5 (substituídos por pares de 10 = +2).
    allowExploding10s: false,
    extraPools: [],
    mode: 'w5-split',
  },
};
