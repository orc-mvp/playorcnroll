# Sala Storyteller unificada — Vampiro, Lobisomem, Mago, Metamorfos

## Escopo definitivo dos sistemas

A sala Storyteller suporta **APENAS** quatro sistemas do Mundo das Trevas:

1. **Vampiro: A Máscara (V3)** — `vampiro_v3` ✅ implementado
2. **Lobisomem: O Apocalipse (W20)** — `lobisomem_w20` ✅ implementado
3. **Mago: A Ascensão (M20)** — `mago_m20` 🔜 arquitetura preparada (stub, sem UI ainda)
4. **Metamorfos** — `metamorfos_w20` 🔜 arquitetura preparada (stub). Compartilha quase toda a ficha com Lobisomem (Fúria, Gnose, Dons, Formas), com pequenas diferenças de espécie.

**Heróis Marcados** continua intocado em sua sala própria (`/session/:id`).

**Mortos-Vivos / Wraith NÃO existe** neste projeto e nunca existiu. Toda referência a `mortos_vivos_w20` será removida (foi inventada por engano na refatoração anterior).

---

## Estado atual (já feito nas fases 1–3)

- ✅ Registry `src/lib/storyteller/systemRegistry.ts` + adapters de Vampiro e Lobisomem
- ✅ `StorytellerSession.tsx` substitui as páginas legadas
- ✅ Rota `/session/storyteller/:id` ativa, com redirects de `/session/vampire/:id` e `/session/werewolf/:id`
- ✅ `VampireSession.tsx` e `WerewolfSession.tsx` deletados
- ❌ Adapter `mortosVivosAdapter.ts` ainda existe — **será removido**
- ❌ Criação de sessão e entrada de personagem ainda usam IDs específicos por sistema — **será unificado**
- ❌ Trackers, modal de teste e visualização de ficha do narrador ainda não estão 100% contextuais por personagem
- ❌ i18n ainda presente em vários componentes da sessão — **será removido**

---

## Mudanças desta fase

### 1. Remoção do "Mortos-Vivos" fantasma
- Deletar `src/lib/storyteller/adapters/mortosVivosAdapter.ts`
- Remover `mortos_vivos_w20` de `StorytellerSystemId` em `types.ts`
- Remover entrada do `REGISTRY` e `STORYTELLER_SYSTEM_IDS` em `systemRegistry.ts`
- Remover qualquer label/ícone correspondente
- Atualizar memória `mem://architecture/storyteller-system-adapter` e `mem://features/storyteller-unified-session` para refletir os 4 sistemas reais
- Criar memória `mem://constraints/storyteller-systems-scope` fixando que NÃO existe Mortos-Vivos

### 2. Adapter de Metamorfos (stub)
- Criar `src/lib/storyteller/adapters/metamorfosAdapter.ts`
- Reaproveita 100% dos componentes do Lobisomem (sheet, side panel, trackers, test modal)
- `available: false` por enquanto (não aparece em `GAME_SYSTEMS`)
- Trackers idênticos ao Lobisomem: Gnose, Fúria, Vontade, Vitalidade
- Pronto para `available: true` no dia em que adicionarmos a ficha específica de Metamorfos

### 3. Criação de salas — usar conceito Storyteller
- Em `src/lib/gameSystems.ts`: manter `vampiro_v3` e `lobisomem_w20` como visíveis. Adicionar campo `family: 'storyteller' | 'pbta'` para agrupar.
- `CreateSession.tsx`: ao escolher Vampiro **ou** Lobisomem, a sessão é criada com `game_system` do sistema escolhido (mantém compatibilidade), mas a rota de destino sempre vai para `/session/storyteller/:id`. O narrador pode aceitar personagens de **qualquer** sistema da família Storyteller.
- Adicionar coluna opcional `session_family` (ou simplesmente derivar via `isStorytellerSystem`) — preferimos derivar para evitar migration.
- Memória: atualizar `mem://logic/session-routing-logic`.

### 4. Entrada de personagem — qualquer sistema Storyteller
- `JoinSession.tsx`: ao validar invite, se a sessão for família Storyteller, listar **todos** os personagens do usuário cujo `game_system` esteja em `STORYTELLER_SYSTEM_IDS` (hoje só vampiro/lobisomem). Heróis Marcados continua restrito.
- `SessionLobby.tsx`: idem na seleção de personagem.
- Mensagem de "criar personagem" passa a oferecer escolha de sistema (Vampiro ou Lobisomem) quando a sessão é Storyteller.
- Atualizar memória `mem://technical/vampiro-session-join-validation` para generalizar.

### 5. Trackers contextuais por personagem na sala
- `StorytellerNarratorSidebar.tsx` (novo): para cada participante, busca `getSystemAdapter(participant.character.game_system)` e renderiza `adapter.trackers` com seus respectivos `getMax`/`getCurrent`. Vampiro mostra Sangue+Vontade+Vitalidade+Humanidade; Lobisomem mostra Gnose+Fúria+Vontade+Vitalidade+Forma.
- `StorytellerTrackers.tsx` (novo): componente jogador que usa o adapter do **próprio** personagem.
- Modal de ajuste do narrador (`NarratorTrackerAdjustModal`) recebe `adapter` e renderiza apenas trackers válidos do sistema do alvo.
- Realtime: subscriptions já existentes em `session_participants` continuam — apenas a renderização passa a ser dinâmica.

### 6. Modal de pedir teste — narrador vê tudo
- `StorytellerTestRequestModal.tsx`: agrupa todos os tipos de teste de todos os adapters disponíveis. Quando o narrador escolhe alvo(s):
  - Se todos os alvos compartilham o mesmo sistema → mostra apenas testes daquele sistema (Atributos+Perícias para vampiro, +Gnose/Fúria para lobisomem).
  - Se alvos de sistemas diferentes → permite apenas testes "comuns" (Vontade, Atributo+Atributo genérico) **ou** divide automaticamente em múltiplos eventos (1 por sistema).
- Adapters expõem novo campo `testCategories: TestCategoryDef[]` para o registry.
- Memória: atualizar `mem://features/wod-test-request-system` e `mem://logic/wod-tipos-testes`.

### 7. Rolagem direta do narrador
- `NarratorRollModal` ganha tabs ou seletor de sistema, expondo todos os tipos de rolagem (Vampiro: pool d10 com dificuldade 6; Lobisomem: pool d10 com dificuldade variável + Fúria/Gnose). Mago/Metamorfos disabled enquanto stubs.
- Atualizar memória `mem://features/wod-narrator-dice-rolls`.

### 8. Visualização da ficha do jogador (do lado do narrador)
- `StorytellerSession.tsx` já passa a ficha pelo adapter; garantir que ao narrador clicar em "Ver ficha" do participante, abre `<adapter.CharacterSheet character={participant.character} readOnly />` correspondente ao sistema **daquele** personagem (Vampiro abre `VampiroCharacterSheet`, Lobisomem abre `LobisomemCharacterSheet`).
- Sem qualquer hardcode do sistema da sala.

### 9. Simplificação — remoção de i18n na camada de sessão
Escopo cirúrgico (não tocamos em dashboard, login, customização, calendário):

- Remover `useI18n` e substituir por strings pt-BR diretas em:
  - `src/pages/StorytellerSession.tsx`, `Session.tsx` (Heróis Marcados), `SessionLobby.tsx`, `JoinSession.tsx`, `CreateSession.tsx`
  - Tudo em `src/components/session/**`
  - Modais de personagem usados dentro da sessão (`CharacterSheetModal`, `EditCharacterModal`, etc.)
- **Manter** `useI18n` em: dashboard, auth, perfil, customização, calendário, navegação, listagem de personagens.
- Não removemos `LanguageContext` — apenas paramos de consumir nos arquivos acima. `translations.ts` perde as chaves órfãs no fim.
- Atualizar memória `mem://technical/i18n-architecture-safety-fallback` para registrar essa nova política ("100% i18n na camada institucional, pt-BR direto na camada de jogo WoD").

### 10. Refatorações pequenas que caem por consequência
- `sessionRoutes.ts`: simplifica para apenas `isStorytellerSystem(gs) ? '/session/storyteller/:id' : '/session/:id'`.
- `GameSystemSelector.tsx`: passa a marcar Vampiro+Lobisomem como "Família Storyteller" (badge informativo) e Mago/Metamorfos como "Em breve".
- Limpeza de imports órfãos e dead code descobertos durante a remoção de i18n.

---

## Execução

Toda a mudança em **uma única passagem** (sem fases extras), porque os pedaços são fortemente acoplados (remover Mortos-Vivos, criar Metamorfos, contextualizar trackers, remover i18n da sessão).

Estimativa: ~25 arquivos editados, ~3 deletados, ~3 criados. Saldo aproximado: **−1.500 linhas líquidas**.

## Garantias

- ✅ Toda alteração de estado em `session_participants`, `session_events`, `tests` continua usando Supabase Realtime + fallback de polling 4s (mem `real-time-sync-fallback`).
- ✅ Novos campos de UI nascem em pt-BR direto (regras do Mundo das Trevas), conforme nova política.
- ✅ Sessões em andamento não quebram: rotas antigas seguem redirecionando.
- ✅ Heróis Marcados intocado.

## Pós-aprovação imediato

1. Salvar memória `mem://constraints/storyteller-systems-scope` (proibindo Mortos-Vivos).
2. Atualizar `mem://index.md` removendo menções a Mortos-Vivos.
3. Executar todas as mudanças acima.
