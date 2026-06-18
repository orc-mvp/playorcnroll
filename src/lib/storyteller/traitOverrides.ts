/**
 * Overrides de labels por sistema/edição.
 *
 * Mantém o catálogo único (`traits.ts`) intacto e injeta renomeações
 * pontuais quando um sistema/edição usa nomes diferentes para um traço
 * compartilhado. Hoje cobre apenas WoD 5ed (Aparência→Compostura,
 * Percepção→Determinação), mas é o ponto de extensão para outras
 * divergências por sistema sem fork de componentes.
 */
import type { BilingualLabel } from './traits';

export type Edition = '20th' | '5ed';

export interface TraitOverrides {
  attributes?: Record<string, BilingualLabel>;
  abilities?: Record<string, BilingualLabel>;
}

const EDITION_5ED_ATTRIBUTES: Record<string, BilingualLabel> = {
  appearance: { 'pt-BR': 'Compostura', 'en-US': 'Composure' },
  perception: { 'pt-BR': 'Determinação', 'en-US': 'Resolve' },
};

/** Identifica a edição (20ª anniversary vs 5ª edição) a partir do game_system. */
export function getEdition(gameSystem?: string): Edition {
  if (!gameSystem) return '20th';
  if (gameSystem.endsWith('_w5') || gameSystem.endsWith('_m5')) return '5ed';
  return '20th';
}

/** Devolve o conjunto de overrides aplicáveis a um sistema. */
export function getTraitOverrides(gameSystem?: string): TraitOverrides {
  const edition = getEdition(gameSystem);
  const overrides: TraitOverrides = {};
  if (edition === '5ed') {
    overrides.attributes = EDITION_5ED_ATTRIBUTES;
  }
  return overrides;
}
