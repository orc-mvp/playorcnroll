/**
 * Helpers para apresentar o "Augúrio" considerando Lobisomem vs Metamorfos.
 *
 * Para Metamorfos, o jogo usa terminologia "Lua/Sol do …" no lugar dos nomes
 * tribais Garou (Ahroun, Theurge, etc). O valor persistido continua sendo o
 * mesmo identificador (Ahroun, Theurge, Galliard, Ragabash, Philodox) ou a
 * string literal "Outro".
 */

import type { LobisomemCharacterData } from './diceUtils';

export const SHIFTER_AUSPICE_LABELS: Record<string, string> = {
  Ahroun: 'Lua/Sol do Guerreiro',
  Theurge: 'Lua/Sol do Xamã',
  Galliard: 'Lua/Sol do Bardo',
  Ragabash: 'Lua/Sol do Silencioso',
  Philodox: 'Lua/Sol do Juiz',
  Outro: 'Outro',
};

export const SHIFTER_AUSPICE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'Ahroun', label: 'Lua/Sol do Guerreiro' },
  { value: 'Theurge', label: 'Lua/Sol do Xamã' },
  { value: 'Galliard', label: 'Lua/Sol do Bardo' },
  { value: 'Ragabash', label: 'Lua/Sol do Silencioso' },
  { value: 'Philodox', label: 'Lua/Sol do Juiz' },
  { value: 'Outro', label: 'Outro' },
];

/** Heurística: o personagem é Metamorfo (não Lobisomem Garou)? */
export function isShifterData(data: Partial<LobisomemCharacterData> | null | undefined): boolean {
  if (!data) return false;
  if (data.metamorph_species) return true;
  if (Array.isArray(data.metamorph_forms) && data.metamorph_forms.length > 0) return true;
  return false;
}

/** Retorna o label de Augúrio adequado (PT) para Metamorfos; senão null. */
export function getShifterAuspiceLabel(auspice: string | undefined | null): string | null {
  if (!auspice) return null;
  return SHIFTER_AUSPICE_LABELS[auspice] ?? auspice;
}
