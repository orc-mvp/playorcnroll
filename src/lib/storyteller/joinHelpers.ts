/**
 * Helpers para entrada de personagens em sessões Storyteller.
 *
 * Centraliza:
 *  1. Quais personagens do usuário podem entrar numa sessão (filtro por sistema/família)
 *  2. Quais valores iniciais gravar em `session_participants` ao criar/atualizar
 *     a participação (Sangue para Vampiro; Gnose/Fúria/Forma para Lobisomem; etc.)
 *
 * Reusa os adapters do registry para evitar lógica duplicada.
 */

import { getSystemAdapter, isStorytellerSystem } from './systemRegistry';
import type { StorytellerParticipant } from './types';

/**
 * Filtra a lista de personagens do usuário deixando apenas os compatíveis com
 * a sessão.
 *
 * Regras:
 *  - Sessões Storyteller (Vampiro/Lobisomem/Mago/Metamorfos) aceitam personagens
 *    cujo `game_system` esteja na família Storyteller, com adapter `available`,
 *    E que estejam na lista `allowedSystems` (configurada pelo narrador na
 *    criação da sala). Se `allowedSystems` for vazio/undefined, faz fallback
 *    para "todos os sistemas Storyteller disponíveis" (compatibilidade com
 *    sessões antigas, antes da feature existir).
 *  - Sessões fora da família (Heróis Marcados) exigem match exato de
 *    `game_system` e ignoram `allowedSystems`.
 */
export function filterCompatibleCharacters<T extends { game_system: string }>(
  characters: T[],
  sessionGameSystem: string,
  allowedSystems?: string[] | null,
): T[] {
  if (isStorytellerSystem(sessionGameSystem)) {
    const allowList = allowedSystems && allowedSystems.length > 0 ? allowedSystems : null;
    return characters.filter((c) => {
      if (!isStorytellerSystem(c.game_system)) return false;
      if (!getSystemAdapter(c.game_system).available) return false;
      if (allowList && !allowList.includes(c.game_system)) return false;
      return true;
    });
  }
  return characters.filter((c) => c.game_system === sessionGameSystem);
}

/**
 * Calcula o patch inicial de trackers para a tabela `session_participants`,
 * baseado no sistema do **personagem** que está entrando.
 *
 * Retorna um objeto pronto para ser passado ao `.insert()` ou `.update()`.
 * Se o personagem não tiver `vampiro_data`, retorna apenas `session_health_damage`
 * zerado (todos os sistemas WoD usam 7 níveis).
 */
export function buildInitialTrackerPatch(
  characterGameSystem: string,
  vampiroData: any,
): Record<string, unknown> {
  // base comum a todos os sistemas WoD
  const base: Record<string, unknown> = {
    session_health_damage: [false, false, false, false, false, false, false],
  };

  if (!vampiroData) return base;

  const adapter = getSystemAdapter(characterGameSystem);
  const fakeParticipant = {
    character: { vampiro_data: vampiroData },
  } as unknown as StorytellerParticipant;
  const patch = adapter.initializeTrackers(fakeParticipant);
  return { ...base, ...(patch || {}) };
}
