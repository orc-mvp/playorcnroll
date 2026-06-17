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
- `StepLobisomemBackgrounds`, `LobisomemCharacterSheet` e `EditLobisomemCharacterModal` aceitam o sistema e, em W5: ocultam Gnose e Renome, exibem Harmonia (0-10, default 7) e capam Rage/Vontade em 0-5.
- `CreateCharacter` inicializa defaults W5 (rage=1, willpower=3, harmony=7, gnosis=0) ao selecionar o sistema e persiste `harmony` (não grava `renown` em W5).
- `LobisomemCharacterSheet` recebe `game_system` via prop (passada em CharacterSheet, narrator sidebar e player side panel).
- **Dons**: formato passou a ser `{ name, description }` por item (com fallback retro p/ string). `StepLobisomemGifts` e os edit modals (Lobisomem + Metamorfos) têm campos nome + descrição; sheet, side panel e sidebar do narrador exibem descrição abaixo do nome quando presente. Helper em `src/lib/lobisomem/giftUtils.ts`.

## Feed de eventos
- Sessões `lobisomem_w5` usam `WerewolfEventFeed` (rota em `StorytellerEventFeed`).
- `vampire_test_result` e `narrator_roll` com `mode='w5-split'` renderizam normais + Fúria com cores próprias e badges **Messy Critical** / **Brutal Outcome** + "X / Y sucessos".
- `StorytellerNarratorRollResult` carrega `mode`, `normalDice`, `rageDice`, `critBonus`, `isMessyCritical`, `isBrutalOutcome`, `margin`; `StorytellerSession` persiste no `event_data` apenas quando `mode='w5-split'`.

## Sidebar do Narrador (W5)
- `WerewolfNarratorSidebar` aceita W5 (`session_w5_*`): mostra Harmonia (0-10) no slot da Gnose, Fúria/Vontade capadas em 0-5, badge "5ed", e abre `NarratorTrackerAdjustModal` com `maxValue` correto. Grava em `session_w5_rage|willpower_current|harmony` via novos cases (`w5_rage|w5_willpower|w5_harmony`) no `confirmChange`.
- `StorytellerSession` inclui `lobisomem_w5` no filtro `werewolfParticipants` para passar W5 ao sidebar.
- `LobisomemCharacterSheet` agora aceita `sessionTrackers.harmony` (sobrepõe ao valor da ficha).

## Painel do Jogador (W5)
- `LobisomemPlayerSidePanel` detecta `game_system='lobisomem_w5'` e troca o card de Renome por um card "Trackers 5ed" com Fúria (0-5, vermelho), Vontade (0-5) e Harmonia (0-10, esmeralda).

## Pendente do jogador (W5)
- `W5PendingTest` adicionou o tipo `harmony` (pool = harmony rating, sem dados de Fúria misturados).
- **Brutal Outcome automático**: após rolagem com `isBrutalOutcome`, decrementa `session_w5_harmony` em 1 (mínimo 0) e registra `tracker_update` com `reason='brutal_outcome'` no feed.
