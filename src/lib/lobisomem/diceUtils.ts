// Werewolf dice utilities - extends vampire dice system
// Werewolf uses the same d10 pool system as Vampire

export type WerewolfTestType = 'attribute_ability' | 'attribute_only' | 'willpower' | 'gnosis' | 'rage';

export interface LobisomemCharacterData {
  player?: string;
  chronicle?: string;
  tribe?: string;
  auspice?: string;
  rank?: string;
  breed?: string;
  pack?: string;
  totem?: string;
  nature?: string;
  demeanor?: string;
  attributes?: {
    physical: { strength: number; dexterity: number; stamina: number };
    social: { charisma: number; manipulation: number; appearance: number };
    mental: { perception: number; intelligence: number; wits: number };
  };
  abilities?: {
    talents: Record<string, number>;
    skills: Record<string, number>;
    knowledges: Record<string, number>;
  };
  specializations?: Record<string, string>;
  gnosis?: number;
  rage?: number;
  willpower?: number;
  gifts?: Record<number, string[]>;
  backgrounds?: Record<string, number>;
  renown?: { glory: number; honor: number; wisdom: number };
  merits_flaws?: { id: string; name: string; cost: number; category: string }[];
}

// Re-export shared functions from vampiro diceUtils
export {
  HEALTH_PENALTIES,
  calculateHealthPenalty,
  getAttributeValue,
  getAbilityValue,
  rollD10,
  rollDice,
  calculateSuccesses,
  performRoll,
  ALL_ATTRIBUTES,
  PHYSICAL_ATTRIBUTES,
  SOCIAL_ATTRIBUTES,
  MENTAL_ATTRIBUTES,
} from '@/lib/vampiro/diceUtils';

import { getAttributeValue, getAbilityValue, calculateHealthPenalty } from '@/lib/vampiro/diceUtils';

// Werewolf-specific ability lists (differ from Vampire)
export const WEREWOLF_TALENTS = ['alertness', 'athletics', 'brawl', 'dodge', 'empathy', 'expression', 'intimidation', 'leadership', 'primalUrge', 'subterfuge'] as const;
export const WEREWOLF_SKILLS = ['animalKen', 'crafts', 'drive', 'etiquette', 'firearms', 'melee', 'performance', 'security', 'stealth', 'survival'] as const;
export const WEREWOLF_KNOWLEDGES = ['academics', 'computer', 'enigmas', 'investigation', 'law', 'linguistics', 'medicine', 'occult', 'politics', 'rituals', 'science'] as const;
export const WEREWOLF_ALL_ABILITIES = [...WEREWOLF_TALENTS, ...WEREWOLF_SKILLS, ...WEREWOLF_KNOWLEDGES];

// Form attribute modifiers
export interface FormModifiers {
  strength?: number;
  dexterity?: number;
  stamina?: number;
  appearance?: number;
  manipulation?: number;
  difficulty: number;
}

export const FORM_MODIFIERS: Record<string, FormModifiers> = {
  hominid: { difficulty: 6 },
  glabro: { strength: 2, stamina: 2, appearance: -1, manipulation: -1, difficulty: 7 },
  crinos: { strength: 4, dexterity: 1, stamina: 3, appearance: -4, manipulation: -3, difficulty: 6 },
  hispo: { strength: 3, dexterity: 2, stamina: 3, manipulation: -3, difficulty: 7 },
  lupus: { strength: 1, dexterity: 2, stamina: 2, manipulation: -3, difficulty: 6 },
};

/**
 * Get the form modifier for a specific attribute
 */
export function getFormAttributeModifier(form: string, attribute: string): number {
  const mods = FORM_MODIFIERS[form];
  if (!mods) return 0;
  return (mods as any)[attribute] ?? 0;
}

/**
 * Calculate dice pool for a werewolf test, including form modifiers
 */
export function calculateWerewolfDicePool(
  data: LobisomemCharacterData,
  testType: WerewolfTestType,
  attribute?: string,
  ability?: string,
  applyHealthPenalty?: boolean,
  healthDamage?: boolean[],
  currentForm?: string
): number {
  let pool = 0;

  switch (testType) {
    case 'attribute_ability':
      if (attribute && ability) {
        let attrVal = getAttributeValue(data as any, attribute);
        if (currentForm) attrVal += getFormAttributeModifier(currentForm, attribute);
        attrVal = Math.max(attrVal, 0);
        pool = attrVal + getAbilityValue(data as any, ability);
      }
      break;
    case 'attribute_only':
      if (attribute) {
        let attrVal = getAttributeValue(data as any, attribute);
        if (currentForm) attrVal += getFormAttributeModifier(currentForm, attribute);
        pool = Math.max(attrVal, 0);
      }
      break;
    case 'willpower':
      pool = data.willpower ?? 1;
      break;
    case 'gnosis':
      pool = data.gnosis ?? 1;
      break;
    case 'rage':
      pool = data.rage ?? 1;
      break;
  }

  if (applyHealthPenalty && healthDamage) {
    const penalty = calculateHealthPenalty(healthDamage);
    pool += penalty;
  }

  return Math.max(pool, 0);
}
