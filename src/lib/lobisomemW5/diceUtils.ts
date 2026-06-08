/**
 * Motor de dados — Lobisomem: A Fera Sombria (W5).
 *
 * Regras 5ed implementadas:
 *  - Pool de d10. Cada dado 6+ = 1 sucesso.
 *  - O pool é DIVIDIDO em dados normais + dados de FÚRIA (cor diferente).
 *    A quantidade de dados de Fúria = min(Fúria atual, pool total).
 *  - Pares de 10 entre quaisquer dois dados (normais OU de fúria) somam +2
 *    sucessos adicionais (crítico). Cada par = +2; sobras de 10 sem par
 *    contam só 1 sucesso normal.
 *  - Se ao menos um dos 10s de um par crítico for de FÚRIA → MESSY CRITICAL
 *    (sucesso brutal, narrador adiciona consequência selvagem).
 *  - Se a rolagem FALHOU (sucessos < dificuldade) E houve pelo menos um 1
 *    num dado de FÚRIA → BRUTAL OUTCOME (falha catastrófica, A Fera assume).
 *  - 1s normais NÃO subtraem nada (5ed não tem botch ao estilo clássico).
 *  - Dificuldade = NÚMERO DE SUCESSOS necessários (não TN por dado).
 */

export interface W5RollInput {
  /** Pool total de dados a rolar. */
  totalDice: number;
  /** Fúria atual do personagem (0-5). Determina quantos dados são de Fúria. */
  currentRage: number;
  /** Número de sucessos necessários para passar no teste. */
  difficulty: number;
}

export interface W5RollResult {
  /** Resultados dos dados normais (cada um 1-10). */
  normalDice: number[];
  /** Resultados dos dados de Fúria (cada um 1-10). */
  rageDice: number[];
  /** Dificuldade (sucessos necessários) usada no cálculo. */
  difficulty: number;
  /** Sucessos básicos (count de 6+ em todos os dados). */
  baseSuccesses: number;
  /** Sucessos extras vindos de pares de 10 (cada par = +2). */
  critBonus: number;
  /** Total final = baseSuccesses + critBonus. */
  totalSuccesses: number;
  /** Margem = totalSuccesses - difficulty. */
  margin: number;
  /** True se totalSuccesses >= difficulty. */
  passed: boolean;
  /** Houve crítico (>=1 par de 10s). */
  hasCritical: boolean;
  /** Crítico com pelo menos 1 dez de Fúria envolvido. */
  isMessyCritical: boolean;
  /** Falha com pelo menos 1 unidade em dado de Fúria. */
  isBrutalOutcome: boolean;
  /** Quantidade de 10s normais. */
  normalTens: number;
  /** Quantidade de 10s de Fúria. */
  rageTens: number;
  /** Quantidade de 1s em dados de Fúria. */
  rageOnes: number;
}

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Calcula o split de Fúria: dados de Fúria substituem dados normais.
 * Se Fúria > pool, usa pool inteiro como Fúria.
 */
export function splitPool(
  totalDice: number,
  currentRage: number,
): { normal: number; rage: number } {
  const safeTotal = Math.max(0, Math.floor(totalDice));
  const safeRage = Math.max(0, Math.min(5, Math.floor(currentRage)));
  const rage = Math.min(safeRage, safeTotal);
  return { normal: safeTotal - rage, rage };
}

/**
 * Executa uma rolagem W5 completa.
 */
export function rollW5(input: W5RollInput): W5RollResult {
  const { normal, rage } = splitPool(input.totalDice, input.currentRage);
  const difficulty = Math.max(1, Math.floor(input.difficulty));

  const normalDice: number[] = [];
  for (let i = 0; i < normal; i++) normalDice.push(rollD10());

  const rageDice: number[] = [];
  for (let i = 0; i < rage; i++) rageDice.push(rollD10());

  const all = [...normalDice, ...rageDice];
  const baseSuccesses = all.filter((d) => d >= 6).length;

  const normalTens = normalDice.filter((d) => d === 10).length;
  const rageTens = rageDice.filter((d) => d === 10).length;
  const totalTens = normalTens + rageTens;

  // Pares de 10s adicionam +2 sucessos cada. Cada par = 2 dados.
  const pairs = Math.floor(totalTens / 2);
  const critBonus = pairs * 2;
  const totalSuccesses = baseSuccesses + critBonus;

  // Messy critical: pelo menos 1 par e pelo menos 1 dos 10s envolvidos é de Fúria.
  // Se há rageTens >= 1 e há pelo menos 1 par formado, é messy.
  const hasCritical = pairs > 0;
  const isMessyCritical = hasCritical && rageTens > 0;

  const rageOnes = rageDice.filter((d) => d === 1).length;
  const passed = totalSuccesses >= difficulty;
  const isBrutalOutcome = !passed && rageOnes > 0;

  return {
    normalDice,
    rageDice,
    difficulty,
    baseSuccesses,
    critBonus,
    totalSuccesses,
    margin: totalSuccesses - difficulty,
    passed,
    hasCritical,
    isMessyCritical,
    isBrutalOutcome,
    normalTens,
    rageTens,
    rageOnes,
  };
}
