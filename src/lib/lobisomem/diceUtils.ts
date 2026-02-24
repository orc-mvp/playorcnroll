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
  ALL_ABILITIES,
  TALENTS,
  SKILLS,
  KNOWLEDGES,
  PHYSICAL_ATTRIBUTES,
  SOCIAL_ATTRIBUTES,
  MENTAL_ATTRIBUTES,
} from '@/lib/vampiro/diceUtils';

import { getAttributeValue, getAbilityValue } from '@/lib/vampiro/diceUtils';

/**
 * Calculate dice pool for a werewolf test
 */
export function calculateWerewolfDicePool(
  data: LobisomemCharacterData,
  testType: WerewolfTestType,
  attribute?: string,
  ability?: string,
  applyHealthPenalty?: boolean,
  healthDamage?: boolean[]
): number {
  let pool = 0;

  switch (testType) {
    case 'attribute_ability':
      if (attribute && ability) {
        pool = getAttributeValue(data as any, attribute) + getAbilityValue(data as any, ability);
      }
      break;
    case 'attribute_only':
      if (attribute) {
        pool = getAttributeValue(data as any, attribute);
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
    const { calculateHealthPenalty } = require('@/lib/vampiro/diceUtils');
    const penalty = calculateHealthPenalty(healthDamage);
    pool += penalty;
  }

  return Math.max(pool, 0);
}
