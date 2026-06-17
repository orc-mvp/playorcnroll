---
name: Lobisomem W5 (5ª Edição) — MVP
description: Lobisomem 5ed (lobisomem_w5) com motor de dados em pool dividido, trackers W5 dedicados (Fúria/Vontade/Harmonia em colunas session_w5_*) e sala Storyteller 5ed excludente
type: feature
---

# Lobisomem: A Fera Sombria (W5)

## Decisão arquitetural
- W5 é um **sistema separado** (`lobisomem_w5`), coexiste com W20.
- Sistemas Storyteller têm `edition: 'classic' | '5ed'` — sala é excludente.
- Motor de dados em pool dividido (`narratorRollConfig.mode: 'w5-split'`).

## Regras 5ed (em `src/lib/lobisomemW5/diceUtils.ts`)
- Pool de d10. 6+ = 1 sucesso.
- Pool dividido em normais + Fúria (`rageDice = min(currentRage, totalDice)`).
- Pares de 10 = +2. **Messy Critical** se ≥1 dos 10s pareados é de Fúria.
- **Brutal Outcome**: falha com ≥1 `1` em dado de Fúria.
- 1s normais não subtraem. Sem explosivos.
- Dificuldade = sucessos necessários.

## Trackers W5 (colunas dedicadas)
- `session_w5_rage` (0-5), `session_w5_willpower_current` (0-5), `session_w5_harmony` (0-10, default 7).
- Reusa `session_health_damage` e `session_form` (genéricos).
- `W5Trackers` (`src/components/session/storyteller/W5Trackers.tsx`) — UI dedicada sem Gnose, com Harmonia.
- Adapter inicializa lazy com Rage=1, Vontade=3, Harmonia=7 (ou valor atual).
- Categoria de teste extra: "Teste de Harmonia".

## Arquivos chave
- `src/lib/lobisomemW5/diceUtils.ts` — motor `rollW5()` / `splitPool()`.
- `src/lib/storyteller/adapters/lobisomemW5Adapter.ts` — trackers próprios, `PlayerTrackersComponent = W5Trackers`, `PendingTestComponent = W5PendingTest`.
- `src/components/session/storyteller/W5Trackers.tsx` — Fúria/Vontade/Harmonia/Saúde/Forma.
- `src/components/session/storyteller/W5PendingTest.tsx` — split pool no lado do jogador (lê `currentRage` do `session_w5_rage`).
- `src/components/session/storyteller/W5NarratorRollModal.tsx` — narrador insere dados de Fúria manualmente.
- `src/components/StorytellerEditionSelector.tsx` — Clássico vs 5ed.

## Sala Storyteller
- `StorytellerSession` seleciona colunas `session_w5_*` e branchea trackerProps/sidePanel/currentRage para W5.
- `getSessionEdition(allowed_systems)` em `systemRegistry.ts`.

## Wizard, ficha e edição
## Wizard, ficha e edição
- `StepLobisomemBackgrounds`, `LobisomemCharacterSheet` e `EditLobisomemCharacterModal` aceitam o sistema e, em W5: ocultam Gnose e Renome, exibem Harmonia (0-10, default 7) e capam Rage/Vontade em 0-5.
- `CreateCharacter` inicializa defaults W5 (rage=1, willpower=3, harmony=7, gnosis=0) ao selecionar o sistema e persiste `harmony` (não grava `renown` em W5).
- `LobisomemCharacterSheet` recebe `game_system` via prop (passada em CharacterSheet, narrator sidebar e player side panel).

## Feed de eventos
- Sessões `lobisomem_w5` usam `WerewolfEventFeed` (rota em `StorytellerEventFeed`).
- `vampire_test_result` e `narrator_roll` com `mode='w5-split'` renderizam normais + Fúria com cores próprias e badges **Messy Critical** / **Brutal Outcome** + "X / Y sucessos".
- `StorytellerNarratorRollResult` carrega `mode`, `normalDice`, `rageDice`, `critBonus`, `isMessyCritical`, `isBrutalOutcome`, `margin`; `StorytellerSession` persiste no `event_data` apenas quando `mode='w5-split'`.
