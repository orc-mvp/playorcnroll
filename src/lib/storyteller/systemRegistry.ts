/**
 * Storyteller System Registry
 *
 * Ponto único de descoberta de sistemas WoD para a sala unificada.
 * Para ativar Mago ou Metamorfos completos: criar a ficha real, apontar o
 * adapter para ela e trocar `available: false` para `true` no adapter +
 * em GAME_SYSTEMS.
 */

import { vampiroAdapter } from './adapters/vampiroAdapter';
import { lobisomemAdapter } from './adapters/lobisomemAdapter';
import { magoAdapter } from './adapters/magoAdapter';
import { metamorfosAdapter } from './adapters/metamorfosAdapter';
import { lobisomemW5Adapter } from './adapters/lobisomemW5Adapter';
import { magoM5Adapter } from './adapters/magoM5Adapter';
import type { SystemAdapter, StorytellerSystemId, StorytellerEdition } from './types';

const REGISTRY: Record<StorytellerSystemId, SystemAdapter> = {
  vampiro_v3: vampiroAdapter,
  lobisomem_w20: lobisomemAdapter,
  mago_m20: magoAdapter,
  metamorfos_w20: metamorfosAdapter,
  lobisomem_w5: lobisomemW5Adapter,
  mago_m5: magoM5Adapter,
};

/** Lista de IDs de sistemas que rodam na sala unificada Storyteller */
export const STORYTELLER_SYSTEM_IDS: StorytellerSystemId[] = [
  'vampiro_v3',
  'lobisomem_w20',
  'mago_m20',
  'metamorfos_w20',
  'lobisomem_w5',
  'mago_m5',
];

/**
 * Verifica se um game_system roda na sala Storyteller.
 * Aceita também o ID genérico de família 'storyteller' (sessões novas
 * criadas pela família unificada, sem comprometer com um sistema único).
 */
export function isStorytellerSystem(gameSystem: string): boolean {
  if (gameSystem === 'storyteller') return true;
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

/** IDs de sistemas Storyteller atualmente disponíveis para criação/uso */
export function getAvailableStorytellerSystemIds(): StorytellerSystemId[] {
  return getAllAdapters()
    .filter((a) => a.available)
    .map((a) => a.id);
}

/** Adapters disponíveis filtrados por edição (5ed ou clássico). */
export function getAdaptersByEdition(edition: StorytellerEdition): SystemAdapter[] {
  return getAllAdapters().filter((a) => a.available && a.edition === edition);
}

/** Resolve a edição a partir de um ID de sistema. */
export function getEditionOf(systemId: string): StorytellerEdition | null {
  const a = REGISTRY[systemId as StorytellerSystemId];
  return a?.edition ?? null;
}

/**
 * Dado um array `allowed_systems` de uma sessão, deduz a edição da sala.
 * Como a escolha é excludente, basta olhar o primeiro sistema válido.
 * Retorna 'classic' como fallback (compatível com sessões antigas).
 */
export function getSessionEdition(allowedSystems?: string[] | null): StorytellerEdition {
  if (allowedSystems) {
    for (const id of allowedSystems) {
      const e = getEditionOf(id);
      if (e) return e;
    }
  }
  return 'classic';
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
