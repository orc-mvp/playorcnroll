## Mago 5ed (`mago_m5`) — Novo sistema espelhando W5

Vou criar `mago_m5` como sistema separado, coexistindo com `mago_m20`, seguindo exatamente o mesmo padrão arquitetural usado para `lobisomem_w5`. Sem polimento/i18n além do essencial.

### Regras 5ed adotadas (mapeadas a partir de V5/W5)
- Pool de d10. 6+ = sucesso. Pares de 10 = +2 (crítico).
- **Pool dividido**: dados normais + dados de **Paradoxo** (`paradoxDice = min(currentParadox, totalDice)`).
- **Quiet Crítico** (análogo ao Messy): par de 10s envolvendo ≥1 dado de Paradoxo.
- **Backlash** (análogo ao Brutal): falha com ≥1 `1` em dado de Paradoxo → +1 Paradoxo automático.
- Trackers 5ed: **Arête 1-5**, **Quintessência 0-5**, **Paradoxo 0-10** (default 0), **Vontade 0-5**, Vitalidade (7 níveis padrão).

### Arquivos a criar
1. `src/lib/magoM5/diceUtils.ts` — motor `rollM5()` / `splitPool()` (cópia adaptada de `lobisomemW5/diceUtils.ts`, troca Rage→Paradox, Messy→Quiet, Brutal→Backlash).
2. `src/lib/storyteller/adapters/magoM5Adapter.ts` — `edition: '5ed'`, trackers próprios (sem session_w5_*, usa colunas existentes `session_arete`, `session_quintessence`, `session_paradox`, `session_willpower_current`), `PlayerTrackersComponent = M5Trackers`, `PendingTestComponent = M5PendingTest`.
3. `src/components/session/storyteller/M5Trackers.tsx` — Arête (1-5)/Quint (0-5)/Paradoxo (0-10)/Vontade (0-5)/Saúde.
4. `src/components/session/storyteller/M5PendingTest.tsx` — split pool no lado do jogador, lê paradoxo atual; categorias: atributo+habilidade, atributo puro, vontade, **arête**, **quintessência**.
5. `src/components/session/storyteller/M5NarratorRollModal.tsx` — narrador insere dados de Paradoxo manualmente.

### Arquivos a editar
- `src/lib/gameSystems.ts` — registrar `mago_m5`.
- `src/lib/storyteller/systemRegistry.ts` — registrar adapter; `getSessionEdition` já cobre via `edition` do adapter.
- `src/components/StorytellerEditionSelector.tsx` — incluir mago_m5 quando família = mago.
- `src/components/AllowedSystemsSelector.tsx` / `SessionFamilySelector.tsx` se necessário para listar.
- `src/pages/CreateCharacter.tsx` — defaults M5 (arete=1, quintessence=0, paradox=0, willpower=3) ao selecionar sistema.
- `src/components/character/mago/EditMagoCharacterModal.tsx` e `MagoCharacterSheet.tsx` — receber `game_system` e em M5 capar Arête/Quint/Vontade em 5, ocultar Rotinas opcional? **Manter Rotinas e Esferas idênticas** ao M20 para não criar wizards novos.
- `src/components/character/mago/StepMagoSpheres.tsx` / `StepMagoBackgrounds.tsx` — apenas aceitam `gameSystem` opcional p/ defaults; sem mudança visual.
- `src/pages/StorytellerSession.tsx` — branchear edition/sidebar/painel para mago_m5 (modelo W5).
- `src/components/session/shared/StorytellerEventFeed.tsx` — rotear `mago_m5` para feed com renderização de Paradox dice (cor roxa, badges Quiet/Backlash). Vou reutilizar `WerewolfEventFeed` adicionando flag mode (já tem suporte a 'w5-split'); adapto para também aceitar `mode='m5-split'` com cores roxas — ou crio `MageEventFeed` thin wrapper.
- `src/components/session/storyteller/StorytellerNarratorRollModal.tsx` / `StorytellerSession.tsx` — persistir campos M5 quando `mode='m5-split'`.
- `src/components/session/mage/MagoNarratorSidebar.tsx` — aceitar M5 (badge "5ed", caps 0-5, Paradoxo 0-10).
- `src/components/session/mage/MagoPlayerSidePanel.tsx` — card "Trackers 5ed".

### Não incluso (fica para depois)
- Tradições/Convenções 5ed específicas, Hubris, Avatar mechanics aprofundadas.
- i18n completo (só strings indispensáveis em PT).
- Testes automatizados.

### Resultado esperado
Narrador cria sessão Storyteller marcando "Mago 5ed", jogador cria personagem mago_m5, entra na sala, narrador pede testes (incluindo Arête/Quint), sistema rola pool dividido com Paradox dice, Backlash incrementa Paradoxo automaticamente, feed mostra resultados.
