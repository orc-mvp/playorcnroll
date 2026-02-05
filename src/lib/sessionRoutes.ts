/**
 * Get the correct session route based on game system
 */
export function getSessionRoute(sessionId: string, gameSystem: string): string {
  if (gameSystem === 'vampiro_v3') {
    return `/session/vampire/${sessionId}`;
  }
  return `/session/${sessionId}`;
}

/**
 * Get the lobby route for a session
 */
export function getLobbyRoute(sessionId: string): string {
  return `/session/${sessionId}/lobby`;
}
