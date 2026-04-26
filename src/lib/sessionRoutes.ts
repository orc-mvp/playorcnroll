import { isStorytellerSystem } from './storyteller/systemRegistry';

/**
 * Get the correct session route based on game system.
 * - Sistemas WoD (Vampiro, Lobisomem, Mago, Mortos-Vivos) → sala unificada Storyteller
 * - Demais sistemas (Heróis Marcados) → sala genérica
 */
export function getSessionRoute(sessionId: string, gameSystem: string): string {
  if (isStorytellerSystem(gameSystem)) {
    return `/session/storyteller/${sessionId}`;
  }
  return `/session/${sessionId}`;
}

/**
 * Get the lobby route for a session
 */
export function getLobbyRoute(sessionId: string): string {
  return `/session/${sessionId}/lobby`;
}
