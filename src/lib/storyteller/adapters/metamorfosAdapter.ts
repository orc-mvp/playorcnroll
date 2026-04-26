/**
 * Adapter STUB: Metamorfos (W20)
 *
 * Metamorfos são apresentados no livro de Lobisomem: O Apocalipse e
 * compartilham praticamente toda a mecânica e ficha (Fúria, Gnose, Dons,
 * Formas, Vontade, Vitalidade). A diferença principal é a espécie/raça do
 * personagem.
 *
 * Este adapter REUSA 100% dos componentes do Lobisomem. Quando criarmos a
 * ficha específica de Metamorfos, apontamos `CharacterSheet` para ela e
 * mudamos `available` para `true` em GAME_SYSTEMS.
 */

import { Cat } from 'lucide-react';
import { lobisomemAdapter } from './lobisomemAdapter';
import type { SystemAdapter } from '../types';

export const metamorfosAdapter: SystemAdapter = {
  ...lobisomemAdapter,
  id: 'metamorfos_w20',
  shortLabel: 'Metamorfos',
  fullLabel: 'Metamorfos (W20)',
  icon: Cat,
  available: false,
};
