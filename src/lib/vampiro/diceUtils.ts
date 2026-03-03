// Vampire dice utilities for test calculations

export interface VampiroCharacterData {
  player?: string;
  chronicle?: string;
  clan?: string;
  generation?: string;
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
  virtues?: {
    virtueType1: string;
    virtueValue1: number;
    virtueType2: string;
    virtueValue2: number;
    courage: number;
  };
  moralityType?: string;
  pathName?: string;
  humanity?: number;
  willpower?: number;
  disciplines?: Record<string, number>;
  backgrounds?: Record<string, number>;
}

// Health level penalties
export const HEALTH_PENALTIES: Record<string, number> = {
  bruised: 0,
  hurt: -1,
  injured: -1,
  wounded: -2,
  mauled: -2,
  crippled: -5,
  incapacitated: -999, // Can't act
};

export type TestType = 'attribute_ability' | 'attribute_only' | 'willpower' | 'humanity' | 'virtue' | 'raw_dice';

export type AttributeKey = 
  | 'strength' | 'dexterity' | 'stamina'
  | 'charisma' | 'manipulation' | 'appearance'
  | 'perception' | 'intelligence' | 'wits';

export type VirtueKey = 'conscience' | 'conviction' | 'selfControl' | 'instinct' | 'courage';

export interface DiceRollResult {
  baseResults: number[];
  extraResults: number[];
  allResults: number[];
  successes: number;
  onesCount: number;
  tensCount: number;
  finalSuccesses: number;
  isBotch: boolean;
  isExceptional: boolean;
}

/**
 * Get an attribute value from character data
 */
export function getAttributeValue(
  data: VampiroCharacterData,
  attribute: string
): number {
  if (!data.attributes) return 1;
  
  const physical = data.attributes.physical;
  const social = data.attributes.social;
  const mental = data.attributes.mental;
  
  const attrMap: Record<string, number> = {
    strength: physical?.strength ?? 1,
    dexterity: physical?.dexterity ?? 1,
    stamina: physical?.stamina ?? 1,
    charisma: social?.charisma ?? 1,
    manipulation: social?.manipulation ?? 1,
    appearance: social?.appearance ?? 1,
    perception: mental?.perception ?? 1,
    intelligence: mental?.intelligence ?? 1,
    wits: mental?.wits ?? 1,
  };
  
  return attrMap[attribute] ?? 1;
}

/**
 * Get an ability value from character data
 */
export function getAbilityValue(
  data: VampiroCharacterData,
  ability: string
): number {
  if (!data.abilities) return 0;
  
  const { talents, skills, knowledges } = data.abilities;
  
  return talents?.[ability] ?? skills?.[ability] ?? knowledges?.[ability] ?? 0;
}

/**
 * Get a virtue value from character data
 */
export function getVirtueValue(
  data: VampiroCharacterData,
  virtue: string
): number {
  if (!data.virtues) return 1;
  
  const { virtueType1, virtueValue1, virtueType2, virtueValue2, courage } = data.virtues;
  
  if (virtue === 'courage') return courage ?? 1;
  if (virtue === virtueType1) return virtueValue1 ?? 1;
  if (virtue === virtueType2) return virtueValue2 ?? 1;
  
  return 1;
}

/**
 * Calculate health penalty based on current damage
 * @param healthDamage Array of 7 booleans representing damaged health levels
 */
export function calculateHealthPenalty(healthDamage: boolean[]): number {
  const levels = ['bruised', 'hurt', 'injured', 'wounded', 'mauled', 'crippled', 'incapacitated'];
  
  // Find the lowest damaged health level (highest index with damage)
  for (let i = healthDamage.length - 1; i >= 0; i--) {
    if (healthDamage[i]) {
      return HEALTH_PENALTIES[levels[i]] ?? 0;
    }
  }
  
  return 0;
}

/**
 * Calculate dice pool for a test
 */
export function calculateDicePool(
  data: VampiroCharacterData,
  testType: TestType,
  attribute?: string,
  ability?: string,
  virtue?: string,
  applyHealthPenalty?: boolean,
  healthDamage?: boolean[]
): number {
  let pool = 0;
  
  switch (testType) {
    case 'attribute_ability':
      if (attribute && ability) {
        pool = getAttributeValue(data, attribute) + getAbilityValue(data, ability);
      }
      break;
    case 'attribute_only':
      if (attribute) {
        pool = getAttributeValue(data, attribute);
      }
      break;
    case 'willpower':
      pool = data.willpower ?? 1;
      break;
    case 'humanity':
      pool = data.humanity ?? 1;
      break;
    case 'virtue':
      if (virtue) {
        pool = getVirtueValue(data, virtue);
      }
      break;
  }
  
  if (applyHealthPenalty && healthDamage) {
    const penalty = calculateHealthPenalty(healthDamage);
    pool += penalty; // penalty is negative
  }
  
  return Math.max(pool, 0);
}

/**
 * Roll a single d10
 */
export function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Roll dice with optional specialization (exploding 10s)
 */
export function rollDice(
  pool: number,
  isSpecialized: boolean = false
): { baseResults: number[]; extraResults: number[] } {
  const baseResults: number[] = [];
  const extraResults: number[] = [];
  
  // Roll base pool
  for (let i = 0; i < pool; i++) {
    baseResults.push(rollD10());
  }
  
  // If specialized, each 10 generates an extra die (non-explosive)
  if (isSpecialized) {
    const tens = baseResults.filter(d => d === 10).length;
    for (let i = 0; i < tens; i++) {
      extraResults.push(rollD10());
    }
  }
  
  return { baseResults, extraResults };
}

/**
 * Calculate successes from dice results
 */
export function calculateSuccesses(
  allDice: number[],
  difficulty: number
): DiceRollResult {
  const successes = allDice.filter(d => d >= difficulty).length;
  const onesCount = allDice.filter(d => d === 1).length;
  const tensCount = allDice.filter(d => d === 10).length;
  const finalSuccesses = successes - onesCount;
  
  // Botch: no successes rolled AND at least one 1
  const isBotch = successes === 0 && onesCount > 0;
  
  // Exceptional: 5+ final successes
  const isExceptional = finalSuccesses >= 5;
  
  return {
    baseResults: [],
    extraResults: [],
    allResults: allDice,
    successes,
    onesCount,
    tensCount,
    finalSuccesses,
    isBotch,
    isExceptional,
  };
}

/**
 * Perform a complete dice roll
 */
export function performRoll(
  pool: number,
  difficulty: number,
  isSpecialized: boolean = false
): DiceRollResult {
  const { baseResults, extraResults } = rollDice(pool, isSpecialized);
  const allResults = [...baseResults, ...extraResults];
  const result = calculateSuccesses(allResults, difficulty);
  
  return {
    ...result,
    baseResults,
    extraResults,
    allResults,
  };
}

// Translation helper types
export type TranslationsType = {
  vampiro: Record<string, string>;
  vampiroTests: Record<string, string>;
};

/**
 * Get localized attribute label
 */
export function getAttributeLabel(
  t: TranslationsType,
  attributeKey: string
): string {
  return t.vampiro[attributeKey] || attributeKey;
}

/**
 * Get localized ability label
 */
export function getAbilityLabel(
  t: TranslationsType,
  abilityKey: string
): string {
  return t.vampiro[abilityKey] || abilityKey;
}

/**
 * Get localized virtue label
 */
export function getVirtueLabel(
  t: TranslationsType,
  virtueKey: string
): string {
  return t.vampiro[virtueKey] || virtueKey;
}

// Attribute lists for dropdowns
export const PHYSICAL_ATTRIBUTES = ['strength', 'dexterity', 'stamina'] as const;
export const SOCIAL_ATTRIBUTES = ['charisma', 'manipulation', 'appearance'] as const;
export const MENTAL_ATTRIBUTES = ['perception', 'intelligence', 'wits'] as const;
export const ALL_ATTRIBUTES = [...PHYSICAL_ATTRIBUTES, ...SOCIAL_ATTRIBUTES, ...MENTAL_ATTRIBUTES];

// Ability lists for dropdowns
export const TALENTS = ['alertness', 'athletics', 'brawl', 'dodge', 'empathy', 'expression', 'intimidation', 'leadership', 'streetwise', 'subterfuge'] as const;
export const SKILLS = ['animalKen', 'crafts', 'drive', 'etiquette', 'firearms', 'melee', 'performance', 'security', 'stealth', 'survival'] as const;
export const KNOWLEDGES = ['academics', 'computer', 'finance', 'investigation', 'law', 'linguistics', 'medicine', 'occult', 'politics', 'science'] as const;
export const ALL_ABILITIES = [...TALENTS, ...SKILLS, ...KNOWLEDGES];

// Virtue lists for dropdowns
export const VIRTUES = ['conscience', 'conviction', 'selfControl', 'instinct', 'courage'] as const;
