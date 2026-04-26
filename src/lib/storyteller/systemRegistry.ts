/**
 * Storyteller System Registry
 *
 * Ponto único de descoberta de sistemas WoD para a sala unificada.
 * Para adicionar Mago/Mortos-Vivos completo: criar adapter, importar aqui, e
 * trocar `available: false` para `true` no próprio adapter + em GAME_SYSTEMS.
 */

import { vampiroAdapter } from './adapters/vampiroAdapter';
import { lobisomemAdapter } from './adapters/lobisomemAdapter';
import { magoAdapter } from './adapters/magoAdapter';
import { mortosVivosAdapter } from './adapters/mortosVivosAdapter';
import type { SystemAdapter, StorytellerSystemId } from './types';

const REGISTRY: Record<StorytellerSystemId, SystemAdapter> = {
  vampiro_v3: vampiroAdapter,
  lobisomem_w20: lobisomemAdapter,
  mago_m20: magoAdapter,
  mortos_vivos_w20: mortosVivosAdapter,
};

/** Lista de IDs de sistemas que rodam na sala unificada Storyteller */
export const STORYTELLER_SYSTEM_IDS: StorytellerSystemId[] = [
  'vampiro_v3',
  'lobisomem_w20',
  'mago_m20',
  'mortos_vivos_w20',
];

/** Verifica se um game_system roda na sala Storyteller */
export function isStorytellerSystem(gameSystem: string): boolean {
  return (STORYTELLER_SYSTEM_IDS as string[]).includes(gameSystem);
}

/**
 * Retorna o adapter de um sistema. Faz fallback seguro para Vampiro
 * caso receba um ID desconhecido (evita crash em sessões corrompidas).
 */
export function getSystemAdapter(gameSystem: string): SystemAdapter {
  return REGISTRY[gameSystem as StorytellerSystemId] ?? vampiroAdapter;
}

/** Retorna todos os adapters registrados */
export function getAllAdapters(): SystemAdapter[] {
  return Object.values(REGISTRY);
}

/**
 * Une os campos de SELECT de todos os adapters disponíveis para a query inicial
 * de participantes (carregamos uma vez todos os campos possíveis para suportar
 * uma sessão mista).
 */
export function getCombinedParticipantFields(): string[] {
  const fields = new Set<string>();
  for (const adapter of getAllAdapters()) {
    if (!adapter.available) continue;
    for (const f of adapter.participantSelectFields) fields.add(f);
  }
  return Array.from(fields);
}

export type { SystemAdapter, StorytellerSystemId } from './types';
