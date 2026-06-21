---
name: Mago M5 (5ª Edição) — MVP
description: Mago 5ed (mago_m5) com motor de dados em pool dividido (dados de Paradoxo), Quiet Critical/Backlash automáticos, e sala Storyteller 5ed excludente espelhando o W5
type: feature
---

# Mago: A Ascensão (M5)

## Decisão arquitetural
- M5 é um **sistema separado** (`mago_m5`), coexiste com M20.
- `edition: '5ed'` — só entra em sala Storyteller 5ed (mesmo grupo de Lobisomem W5).
- Reaproveita as colunas existentes `session_quintessence`, `session_paradox`,
  `session_arete`, `session_willpower_current`, `session_health_damage` (sem
  colunas dedicadas — caps aplicados em UI).

## Regras 5ed (em `src/lib/magoM5/diceUtils.ts`)
- Pool de d10. 6+ = 1 sucesso.
- Pool dividido em normais + Paradoxo (`paradoxDice = min(currentParadox, totalDice)`).
- Pares de 10 = +2 sucessos.
- **Quiet Critical**: par crítico com ≥1 dos 10s vindo de Paradoxo.
- **Backlash**: falha com ≥1 `1` em dado de Paradoxo → +1 Paradoxo automático (cap 10).
- Dificuldade = nº de sucessos.

## Caps 5ed
- Arête 1–5 (fixo, vem da ficha)
- Quintessência 0–5
- Paradoxo 0–10
- Vontade 0–5

## Arquivos chave
- `src/lib/magoM5/diceUtils.ts` — motor `rollM5()` / `splitPool()`.
- `src/lib/storyteller/adapters/magoM5Adapter.ts` — trackers/categorias/`mode: 'm5-split'`.
- `src/components/session/storyteller/M5Trackers.tsx` — Quint/Paradoxo (+/-), Arête fixo, Vontade, Vitalidade.
- `src/components/session/storyteller/M5PendingTest.tsx` — split pool, Backlash automático.
- `src/components/session/storyteller/M5NarratorRollModal.tsx` — pool roxo com Paradoxo manual.

## Wizard & ficha
- Reutiliza os mesmos `StepMagoBasicInfo`/`Attributes`/`Spheres`/`Rotes`/`Backgrounds`/`MeritsFlaws` do M20.
- Em `CreateCharacter`, ao escolher `mago_m5` defaults são capados (arete=1, vontade=3, quint=0, paradox=0).
- `MagoCharacterSheet` reaproveitada (não diferencia visualmente M20 vs M5; sem polish).
- `EditMagoCharacterModal` filtra merits/flaws pelo `character.game_system` e aplica caps M5 nos pools (Arête/Vontade 5, Quint 5, Paradoxo 10).

## Sala Storyteller
- `StorytellerSession`: branch `mago_m5` em `magoParticipants`, `buildTrackerProps`, `sidePanelProps`, `pendingTestSharedProps` (passa `currentParadox`).
- `StorytellerNarratorRollModal` rota `m5-split` → `M5NarratorRollModal`.
- `StorytellerEventFeed` rota `mago_m5` para `VampireEventFeed`, que renderiza dados de Paradoxo em roxo + badges "Crítico Silencioso"/"Refluxo" quando `mode==='m5-split'`.
- `MagoNarratorSidebar` aplica caps M5 (Quint 5, Paradoxo 10, paradox crítico ≥8) quando `character.game_system==='mago_m5'`.
- Persistência: `narrator_roll` grava `mode: 'm5-split'`, `normal_dice`, `paradox_dice`, `is_quiet_critical`, `is_backlash`, `margin`.

## Gaps conhecidos (pós-MVP)
- i18n pendente (strings novas em PT-BR fixo: "Crítico Silencioso", "Refluxo").

