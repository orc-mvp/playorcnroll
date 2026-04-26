/**
 * Utilitários de cálculo de pool para Metamorfos (W20).
 *
 * O Metamorfo reusa toda a mecânica do Lobisomem (Fúria/Gnose/Vontade/Vitalidade)
 * mas substitui a tabela fixa de formas (Hominídeo/Glabro/Crinos/Hispo/Lupus) por
 * uma lista customizada criada pelo jogador na ficha (até 4 formas, além do
 * Hominídeo implícito).
 *
 * Semântica dos modificadores:
 *  - `undefined`/ausente → atributo permanece igual
 *  - número (+/-)        → soma ao atributo base; resultado nunca abaixo de 0
 *  - `0` (literal)       → "zera" o atributo enquanto a forma está ativa
 */

import type { LobisomemCharacterData, MetamorphForm } from '@/lib/lobisomem/diceUtils';
import { getAttributeValue, getAbilityValue } from '@/lib/vampiro/diceUtils';

/** ID estável da forma humana padrão (não aparece em metamorph_forms). */
export const HOMINID_FORM_ID = 'hominid';

/** Nome legível do Hominídeo (i18n será aplicado na UI). */
export const HOMINID_FORM_NAME_PT = 'Hominídeo';

/** Resolve uma forma pelo seu id. Hominídeo retorna `null` (sem modificadores). */
export function getMetamorphForm(
  data: LobisomemCharacterData | null | undefined,
  formId: string | undefined,
): MetamorphForm | null {
  if (!formId || formId === HOMINID_FORM_ID) return null;
  return data?.metamorph_forms?.find((f) => f.id === formId) ?? null;
}

/**
 * Aplica o modificador de uma forma metamórfica a um valor de atributo.
 *  - se a forma não existe ou o atributo não foi modificado: retorna `base`
 *  - se o modificador é `0` literal: retorna `0` (atributo zerado para essa forma)
 *  - caso contrário: retorna `Math.max(base + delta, 0)`
 */
export function applyMetamorphAttribute(
  form: MetamorphForm | null,
  attribute: string,
  base: number,
): number {
  if (!form?.modifiers) return base;
  const delta = (form.modifiers as Record<string, number | undefined>)[attribute];
  if (delta === undefined) return base;
  if (delta === 0) return 0;
  return Math.max(base + delta, 0);
}

/**
 * Calcula a pool de dados para um teste de Metamorfo aplicando os modificadores
 * da forma ativa (se houver). Reusa as mesmas regras de pool de Lobisomem.
 */
export function calculateMetamorphPool(
  data: LobisomemCharacterData,
  testType: string,
  attribute: string | undefined,
  ability: string | undefined,
  currentFormId: string | undefined,
): number {
  const form = getMetamorphForm(data, currentFormId);

  switch (testType) {
    case 'attribute_ability': {
      if (!attribute || !ability) return 0;
      const baseAttr = getAttributeValue(data as any, attribute);
      const finalAttr = applyMetamorphAttribute(form, attribute, baseAttr);
      return finalAttr + getAbilityValue(data as any, ability);
    }
    case 'attribute_only': {
      if (!attribute) return 0;
      const baseAttr = getAttributeValue(data as any, attribute);
      return applyMetamorphAttribute(form, attribute, baseAttr);
    }
    case 'willpower':
      return data.willpower ?? 1;
    case 'gnosis':
      return data.gnosis ?? 1;
    case 'rage':
      return data.rage ?? 1;
    default:
      return 0;
  }
}

/** Modificador de dificuldade (delta) da forma ativa. Hominídeo = 0. */
export function getMetamorphDifficultyModifier(
  data: LobisomemCharacterData | null | undefined,
  currentFormId: string | undefined,
): number {
  const form = getMetamorphForm(data, currentFormId);
  return form?.difficulty ?? 0;
}
