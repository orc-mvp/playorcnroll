// Extreme detection based on attribute type and dice values
// According to Heróis Marcados rulebook

export type AttributeType = 'strong' | 'neutral' | 'weak';
export type ExtremeResult = 'positive' | 'negative' | null;

interface ExtremeCheck {
  positive: boolean;
  negative: boolean;
}

// Positive extreme: pairs and specific combinations based on attribute type
// Negative extreme: specific pairs based on attribute type
export function checkExtremes(dice1: number, dice2: number, attributeType: AttributeType): ExtremeCheck {
  const sorted = [dice1, dice2].sort((a, b) => a - b);
  const isPair = dice1 === dice2;
  
  let positive = false;
  let negative = false;

  switch (attributeType) {
    case 'strong':
      // Strong: Any pair (except 1-1) = Positive Extreme
      // No negative extreme
      positive = isPair && dice1 !== 1;
      negative = false;
      break;

    case 'neutral':
      // Neutral: Pairs of 4, 5, 6 = Positive Extreme
      // Pairs of 1, 2 = Negative Extreme
      positive = isPair && dice1 >= 4;
      negative = isPair && dice1 <= 2;
      break;

    case 'weak':
      // Weak: Pairs of 5, 6 = Positive Extreme
      // Pairs of 1, 2, 3 = Negative Extreme
      positive = isPair && dice1 >= 5;
      negative = isPair && dice1 <= 3;
      break;
  }

  return { positive, negative };
}

// Calculate test result: success (10+), partial (7-9), failure (6-)
export type TestResult = 'success' | 'partial' | 'failure';

export function calculateResult(total: number): TestResult {
  if (total >= 10) return 'success';
  if (total >= 7) return 'partial';
  return 'failure';
}

// Get attribute modifier based on type
export function getAttributeModifier(attributeType: AttributeType): number {
  switch (attributeType) {
    case 'strong': return 2;
    case 'neutral': return 1;
    case 'weak': return 0;
  }
}

// Difficulty modifiers
export const difficultyModifiers: Record<string, number> = {
  'very_easy': -2,
  'easy': -1,
  'normal': 0,
  'hard': 1,
  'very_hard': 2,
  'nearly_impossible': 3,
};
