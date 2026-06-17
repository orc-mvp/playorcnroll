/**
 * Gift = string (legado) | { name, description } (novo formato).
 * Helpers para leitura/normalização de Dons (Lobisomem/Metamorfos).
 */

export type GiftEntry = string | { name: string; description?: string };

export const getGiftName = (g: GiftEntry): string =>
  typeof g === 'string' ? g : g?.name ?? '';

export const getGiftDescription = (g: GiftEntry): string =>
  typeof g === 'string' ? '' : g?.description ?? '';

export const normalizeGift = (g: GiftEntry): { name: string; description: string } => ({
  name: getGiftName(g),
  description: getGiftDescription(g),
});
