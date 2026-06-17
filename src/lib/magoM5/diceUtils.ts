/**
 * Motor de dados — Mago: A Ascensão 5ª Edição (M5).
 *
 * Espelho do W5 trocando Fúria→Paradoxo e Messy/Brutal→Quiet/Backlash:
 *  - Pool de d10. Cada dado 6+ = 1 sucesso.
 *  - Pool dividido em dados normais + dados de PARADOXO.
 *    `paradoxDice = min(Paradoxo atual, pool total)`.
 *  - Pares de 10 (entre quaisquer dados) = +2 sucessos cada (crítico).
 *  - QUIET CRITICAL: par crítico em que pelo menos um 10 é de Paradoxo
 *    → o feitiço funciona mas Paradoxo se manifesta como Quiet (madness).
 *  - BACKLASH: falha com pelo menos um 1 em dado de Paradoxo → consequência
 *    catastrófica (Realidade reage, +1 Paradoxo automático).
 *  - 1s normais NÃO subtraem. Sem explosivos.
 *  - Dificuldade = NÚMERO DE SUCESSOS necessários.
 */

export interface M5RollInput {
  totalDice: number;
  /** Paradoxo atual (0-10). Determina quantos dados são de Paradoxo. */
  currentParadox: number;
  difficulty: number;
}

export interface M5RollResult {
  normalDice: number[];
  paradoxDice: number[];
  difficulty: number;
  baseSuccesses: number;
  critBonus: number;
  totalSuccesses: number;
  margin: number;
  passed: boolean;
  hasCritical: boolean;
  /** Crítico envolvendo dado de Paradoxo. */
  isQuietCritical: boolean;
  /** Falha com pelo menos 1 em dado de Paradoxo. */
  isBacklash: boolean;
  normalTens: number;
  paradoxTens: number;
  paradoxOnes: number;
}

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export function splitPool(
  totalDice: number,
  currentParadox: number,
): { normal: number; paradox: number } {
  const safeTotal = Math.max(0, Math.floor(totalDice));
  const safeParadox = Math.max(0, Math.min(10, Math.floor(currentParadox)));
  const paradox = Math.min(safeParadox, safeTotal);
  return { normal: safeTotal - paradox, paradox };
}

export function rollM5(input: M5RollInput): M5RollResult {
  const { normal, paradox } = splitPool(input.totalDice, input.currentParadox);
  const difficulty = Math.max(1, Math.floor(input.difficulty));

  const normalDice: number[] = [];
  for (let i = 0; i < normal; i++) normalDice.push(rollD10());
  const paradoxDice: number[] = [];
  for (let i = 0; i < paradox; i++) paradoxDice.push(rollD10());

  const all = [...normalDice, ...paradoxDice];
  const baseSuccesses = all.filter((d) => d >= 6).length;

  const normalTens = normalDice.filter((d) => d === 10).length;
  const paradoxTens = paradoxDice.filter((d) => d === 10).length;
  const totalTens = normalTens + paradoxTens;

  const pairs = Math.floor(totalTens / 2);
  const critBonus = pairs * 2;
  const totalSuccesses = baseSuccesses + critBonus;

  const hasCritical = pairs > 0;
  const isQuietCritical = hasCritical && paradoxTens > 0;

  const paradoxOnes = paradoxDice.filter((d) => d === 1).length;
  const passed = totalSuccesses >= difficulty;
  const isBacklash = !passed && paradoxOnes > 0;

  return {
    normalDice,
    paradoxDice,
    difficulty,
    baseSuccesses,
    critBonus,
    totalSuccesses,
    margin: totalSuccesses - difficulty,
    passed,
    hasCritical,
    isQuietCritical,
    isBacklash,
    normalTens,
    paradoxTens,
    paradoxOnes,
  };
}
