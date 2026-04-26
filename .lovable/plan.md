# Sala Storyteller — Modais unificados, contexto por personagem e catálogo único

## Escopo definitivo

A sala Storyteller (`/session/storyteller/:id`) suporta **APENAS** quatro sistemas WoD:

1. **Vampiro: A Máscara (V3)** — `vampiro_v3` ✅ ativo
2. **Lobisomem: O Apocalipse (W20)** — `lobisomem_w20` ✅ ativo
3. **Mago: A Ascensão (M20)** — `mago_m20` 🔜 stub (entra com Quintessência/Paradoxo nos pools)
4. **Metamorfos (W20)** — `metamorfos_w20` 🔜 stub (reusa 100% Lobisomem)

**Heróis Marcados** continua isolado em `/session/:id`. **Mortos-Vivos / Wraith não existe** — referências serão purgadas das memórias.

---

## Já feito (não mexer)

- Registry e adapters de Vampiro/Lobisomem/Mago(stub)/Metamorfos(stub).
- Página `StorytellerSession.tsx` substituiu Vampire/Werewolf Session.
- Rotas redirecionam para `/session/storyteller/:id`.
- Criação de sala e entrada de personagem já aceitam qualquer sistema da família Storyteller.
- Build estável (`TrackersComponent` restaurado).

---

## O que falta — esta passagem

### 1. Modal de pedir teste unificado (`StorytellerTestRequestModal`)

Substitui `VampireTestRequestModal` e `WerewolfTestRequestModal` no fluxo do narrador.

- Cria `src/components/session/storyteller/StorytellerTestRequestModal.tsx`.
- Adapters expõem `testCategories: TestCategoryDef[]` (já previsto em `types.ts` — adicionar campo).
- Comportamento ao escolher alvo(s):
  - **Mesmo sistema** → mostra todas as categorias daquele adapter (Vampiro: Atributo+Perícia, Vontade, Atributo Puro; Lobisomem: idem + Gnose, Fúria).
  - **Sistemas mistos** → mostra apenas categorias marcadas `crossSystem: true` no adapter (Atributo+Atributo, Vontade). Categorias específicas (Gnose, Fúria, Disciplina) ficam ocultas.
  - Opcional: botão "dividir por sistema" que dispara um evento por sistema com a categoria escolhida.
- Realtime: continua escrevendo em `session_events` (`event_type: 'test_request'`) — sem mudança de schema.

### 2. Modal de rolagem direta do narrador unificado (`StorytellerNarratorRollModal`)

Substitui `NarratorRollModal` (hoje hardcoded para Vampiro).

- Cria `src/components/session/storyteller/StorytellerNarratorRollModal.tsx`.
- Tabs: **Vampiro** | **Lobisomem** | **Mago** (disabled) | **Metamorfos** (disabled).
- Cada tab usa as regras do adapter:
  - Vampiro: pool d10 base 6, sem 10s explosivos.
  - Lobisomem: pool d10 base variável + opção de 10s explosivos + Fúria/Gnose como pools alternativos.
- Adapter ganha `narratorRollConfig: { defaultDifficulty, allowExploding10s, extraPools[] }`.
- Resultado é gravado em `session_events` (`event_type: 'narrator_roll'`) já existente.

### 3. Trackers contextuais por personagem

- `StorytellerSession` (lado narrador): para cada participante, lê `getSystemAdapter(participant.character.game_system)` e renderiza `adapter.trackers` no card. Hoje a sidebar inteira é por sistema da sala — passa a ser por sistema do personagem.
- `StorytellerSession` (lado jogador): renderiza `myAdapter.PlayerTrackersComponent` (já restaurado no build fix).
- **"Conjunto de pools"** = abstração que cobre Sangue (Vampiro), Gnose+Fúria (Lobisomem/Metamorfos) e futura **Quintessência+Paradoxo (Mago)**. O componente genérico `WoDPoolTracker` (ver §6) itera sobre `adapter.trackers` filtrando por `kind: 'pool'` vs `kind: 'health'` vs `kind: 'form'`.
- `NarratorTrackerAdjustModal` recebe o `adapter` do alvo e renderiza apenas seus trackers (não mais hardcode Vampiro).
- **Realtime garantido**: subscriptions em `session_participants` já existem; só a renderização vira dinâmica.

### 4. Ficha contextual aberta pelo narrador

A sidebar do narrador mostra apenas trackers + botão "Ver ficha". Esse botão já abre uma ficha — o objetivo é garantir que ela seja **a ficha do sistema do personagem**, não a do sistema da sala.

- `StorytellerSession`: ao clicar em "Ver ficha", abre `<adapter.CharacterSheet character={participant.character} readOnly />` — onde `adapter = getSystemAdapter(participant.character.game_system)`.
- Vampiro abre `VampiroCharacterSheet`, Lobisomem abre `LobisomemCharacterSheet`, Metamorfos (quando ativo) reusa o de Lobisomem.
- Remove qualquer hardcode em `VampireNarratorSidebar`/`WerewolfNarratorSidebar` que assuma o sistema da sessão.

### 5. Catálogo único de habilidades — `STORYTELLER_ABILITIES_BASE`

**Decisão sua**: vamos **somar tudo** num catálogo único na criação/edição. Sem filtragem por sistema na hora de criar a ficha. O importante é não faltar nada que impeça o jogador de montar.

- Cria `src/lib/storyteller/traits.ts` com:
  - `STORYTELLER_ATTRIBUTES` (9 atributos — já são iguais entre Vampiro e Lobisomem).
  - `STORYTELLER_ABILITIES_BASE`: união de Talentos/Perícias/Conhecimentos de Vampiro **e** Lobisomem (Manha + Instinto Primitivo + Briga + Esquiva + ...). Valor 0 default.
  - Quando Mago entrar, suas habilidades únicas (Cosmologia, Ocultismo expandido, etc.) são apenas **somadas** ao mesmo objeto.
- Componentes de criação (`StepVampiroAttributes`, `StepLobisomemAttributes`) passam a importar do catálogo único — eliminam ~150 linhas duplicadas cada.
- **Na sala de jogo**: `WoDCharacterSheet` (ver §6) e `PlayerSidePanel` exibem **apenas habilidades com graduação ≥ 1** para não virar lista gigante. Isso resolve o "lista enorme" sem prejudicar criação.

### 6. Componentização compartilhada (refactor de redução)

Cria `src/components/storyteller/`:

- `TraitGroupEditor.tsx` — usado em Atributos, Habilidades e Antecedentes (Vampiro e Lobisomem hoje têm 3 cópias quase idênticas).
- `WoDPoolTracker.tsx` — tracker genérico de pool (Sangue, Gnose, Fúria, futuro Quintessência/Paradoxo). Iterado a partir de `adapter.trackers`.
- `WoDHealthTracker.tsx` — 7 níveis de vitalidade (idêntico entre os 4 sistemas).
- `WoDCharacterSheet.tsx` — ficha modular com slots `<PowersSection>` (Disciplinas/Dons/Esferas) injetado pelo adapter. Lobisomem e Vampiro passam a ser ~80% reuso.

A refatoração das fichas em si fica numa **passagem 2** (ver "Faseamento" abaixo) para não inflar o diff desta.

### 7. Limpeza de memórias

- Atualizar `mem://index.md` removendo qualquer linha com "Mortos-Vivos" / `mortos_vivos_w20`.
- Criar `mem://constraints/storyteller-systems-scope` fixando os 4 sistemas reais.
- Atualizar `mem://architecture/storyteller-system-adapter`, `mem://features/storyteller-unified-session`, `mem://logic/session-routing-logic`, `mem://features/wod-test-request-system`, `mem://features/wod-narrator-dice-rolls` refletindo modais unificados e catálogo único.

### 8. i18n na camada de sessão — **NÃO mexer**

Decisão: i18n é acabamento, não obrigatório. Mantemos como está nos componentes da sessão. Se um arquivo for tocado por outro motivo desta passagem e a remoção for trivial, removo; caso contrário, fica. **Nada de esforço dedicado a i18n.**

---

## Faseamento da execução

**Passagem A (esta) — modais e contexto, baixo risco:**
1. Adicionar `testCategories` e `narratorRollConfig` em `types.ts` e nos adapters Vampiro/Lobisomem.
2. Criar `StorytellerTestRequestModal` e `StorytellerNarratorRollModal`.
3. Trocar uso em `StorytellerSession.tsx`.
4. Tornar `NarratorTrackerAdjustModal` e o card da sidebar do narrador dinâmicos por adapter do personagem.
5. Garantir botão "Ver ficha" abre `adapter.CharacterSheet` do personagem clicado.
6. Criar `src/lib/storyteller/traits.ts` com `STORYTELLER_ABILITIES_BASE` (união) e refatorar `StepVampiroAttributes`/`StepLobisomemAttributes` para consumir.
7. Em `WoDCharacterSheet`/`PlayerSidePanel`/sheets existentes, filtrar exibição para habilidades com graduação ≥ 1.
8. Limpeza de memórias (passo 7 acima).

**Passagem B (futura, sob aprovação) — componentização pesada das fichas:**
- Extrair `TraitGroupEditor`, `WoDPoolTracker`, `WoDHealthTracker`, `WoDCharacterSheet` modular.
- Migrar `VampiroCharacterSheet` e `LobisomemCharacterSheet` para o shell comum.

Estimativa Passagem A: ~12 arquivos editados, ~3 criados, **~−400 linhas líquidas**.

---

## Garantias

- ✅ Toda mudança em `session_participants`/`session_events` continua via Supabase Realtime + fallback 4s.
- ✅ Schema do banco **não muda** (sem migration).
- ✅ Sessões abertas não quebram — adapters resolvem rotas/IDs antigos.
- ✅ Heróis Marcados intocado.
- ✅ Mago/Metamorfos seguem stubs (`available: false`) — visíveis no registry, escondidos no `GameSystemSelector`.

## Pós-aprovação imediato

1. Executar Passagem A inteira numa mensagem.
2. Validar build (`tsc --noEmit`) ao final.
3. Atualizar memórias afetadas.
4. Apresentar diff e aguardar aprovação para Passagem B (componentização das fichas).
