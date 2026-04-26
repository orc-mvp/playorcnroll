/**
 * Adapter: Metamorfos (W20)
 *
 * Metamorfos (Bastet, Corax, Mokolé, etc.) compartilham toda a mecânica e
 * ficha do Lobisomem (Fúria, Gnose, Vontade, Vitalidade, Dons). A diferença é
 * a espécie e o conjunto CUSTOMIZÁVEL de formas de guerra (até 4 formas + a
 * Hominídea implícita), em vez das 5 formas fixas do Lobisomem.
 *
 * Estratégia: este adapter herda do `lobisomemAdapter` (mesmo trackers, ficha
 * e componentes) e apenas troca id/labels/ícone/cor temática (âmbar). A ficha
 * `LobisomemCharacterSheet` lê os mesmos campos. A diferença das formas
 * customizadas é tratada dentro do `WerewolfTrackers` + `FormChangeModal`
 * (que já aceita `customForms`) e do cálculo de pool em `VampirePendingTest`.
 */

import { PawPrint } from 'lucide-react';
import { lobisomemAdapter } from './lobisomemAdapter';
import type { SystemAdapter } from '../types';

export const metamorfosAdapter: SystemAdapter = {
  ...lobisomemAdapter,
  id: 'metamorfos_w20',
  shortLabel: 'Metamorfos',
  fullLabel: 'Metamorfos (W20)',
  icon: PawPrint,
  color: 'text-amber-500',
  borderColor: 'border-amber-500/20',
  bgColor: 'bg-amber-500/10',
  available: true,
};
