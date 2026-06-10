---
name: Lobisomem W5 (5ª Edição) — MVP
description: Lobisomem 5ed adicionado como sistema separado (lobisomem_w5) com motor de dados em pool dividido (normais + Fúria), Messy Critical/Brutal Outcome, e sala Storyteller 5ed excludente
type: feature
---

# Lobisomem: A Fera Sombria (W5)

## Decisão arquitetural
- W5 é um **sistema separado** (`lobisomem_w5`), não substitui W20. Coexistem no hub.
- Sistemas Storyteller ganharam campo `edition: 'classic' | '5ed'` no adapter. **Escolha excludente** no `CreateSession`: uma sala só aceita sistemas da mesma edição.
- Motor de dados em pool dividido (`narratorRollConfig.mode: 'w5-split'`) — incompatível com Clássico.

## Regras 5ed (implementadas em `src/lib/lobisomemW5/diceUtils.ts`)
- Pool de d10. Cada 6+ = 1 sucesso.
- Pool DIVIDIDO em normais + Fúria. `rageDice = min(currentRage, totalDice)`.
- Pares de 10 = +2 sucessos. **Messy Critical** se ≥1 dos 10s pareados é de Fúria.
- **Brutal Outcome**: falha com ≥1 `1` em dado de Fúria.
- 1s normais NÃO subtraem (sem botch clássico).
- Dificuldade = NÚMERO DE SUCESSOS necessários (não TN por dado).
- Sem 10s explosivos (substituídos por pares de 10).

## Arquivos chave
- `src/lib/lobisomemW5/diceUtils.ts` — motor `rollW5()` e `splitPool()`
- `src/lib/storyteller/adapters/lobisomemW5Adapter.ts` — herda do W20; tema `text-red-600`; trackers Fúria/Vontade capados em 5; sem Gnose; `narratorRollConfig.mode = 'w5-split'`; `PendingTestComponent = W5PendingTest`
- `src/components/session/storyteller/W5NarratorRollModal.tsx` — UI dedicada do narrador
- `src/components/session/storyteller/W5PendingTest.tsx` — UI do JOGADOR com split pool, Messy/Brutal; pega `currentRage` do tracker via prop. Aceita `testType` rage/willpower/attribute_*/raw_dice. Em 'willpower' não mistura Fúria; em 'rage' o pool inteiro é de Fúria.
- `src/components/session/vampire/MobilePendingTestDrawer.tsx` — agora roteia para W5PendingTest quando `gameSystem === 'lobisomem_w5'`
- `src/components/session/storyteller/StorytellerNarratorRollModal.tsx` — delega para W5 modal
- `src/components/StorytellerEditionSelector.tsx` — seletor Clássico vs 5ª Edição (excludente)

## Sala Storyteller
- `StorytellerSession` passa `currentRage = myParticipant.session_rage` no `pendingTestSharedProps` quando o personagem é W5.
- `getSessionEdition(allowed_systems)` em `systemRegistry.ts`.

## Limitações MVP restantes
- Ficha e wizard reusam W20 (jogadores capam Rage/Vontade em 5 manualmente).
- Trackers de sessão reusam `session_rage` / `session_willpower_current` (capados em 5 via `getMax`). Colunas `session_w5_*` reservadas para próxima iteração + Harmony.

