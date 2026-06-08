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
- `src/lib/storyteller/adapters/lobisomemW5Adapter.ts` — herda do W20; tema `text-red-600`; trackers Fúria/Vontade capados em 5; sem Gnose; testCategories sem Gnose; `narratorRollConfig.mode = 'w5-split'`
- `src/components/session/storyteller/W5NarratorRollModal.tsx` — UI dedicada com pool total + dados de Fúria; banners Messy/Brutal
- `src/components/session/storyteller/StorytellerNarratorRollModal.tsx` — delega para W5 modal quando adapter.narratorRollConfig.mode === 'w5-split'
- `src/components/StorytellerEditionSelector.tsx` — seletor Clássico vs 5ª Edição (excludente)
- `src/components/AllowedSystemsSelector.tsx` — agora exige prop `edition` e filtra adapters por edição

## Sala Storyteller
- `StorytellerSession` passa `allowed_systems?.[0] || session.game_system` para o modal de rolagem. Como edição é excludente, qualquer sistema permitido na sala determina o motor.
- `getSessionEdition(allowed_systems)` e `getAdaptersByEdition(edition)` em `systemRegistry.ts`.

## Limitações MVP (iterar depois)
- Ficha e wizard de criação do W5 reusam os componentes do W20 (mesmo schema). Jogadores devem capar Rage/Vontade em 5 manualmente até termos steps próprios.
- Trackers de sessão reusam colunas `session_rage` / `session_willpower_current` do W20 (capadas em 5 via `getMax`).
- Colunas `session_w5_rage`, `session_w5_willpower_current`, `session_w5_harmony` foram criadas no DB mas ainda não usadas — reservadas para a próxima iteração (trackers próprios + Harmony).
- Sem teste pendente W5 para jogadores ainda — usa `VampirePendingTest` (clássico). Próximo release: split pool no lado do jogador também.
- V5/H5 fora de escopo deste release.
