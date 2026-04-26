## Objetivo

1. **Habilitar Mago em /customization** com UX explícita.
2. **Renomear o seletor "Lobisomem" → "Lobisomem / Metamorfo"** (compartilham o mesmo `lobisomem_w20` no banco).
3. **Bloquear/filtrar por sistema** na criação **e** edição de personagens — Mago só vê M&F com `mago_m20`, Vampiro só com `vampiro_v3`, etc. Hoje os Steps de criação não filtram (mostram tudo); os Edit modais já filtram.
4. **Auto-limpeza** de M&F inválidas em fichas existentes na próxima abertura.
5. **Consolidar UI duplicada** entre Steps (criação) e Edit modais: extrair componentes compartilhados de **M&F**, **Atributos** e **Habilidades**.

---

## 1. Customization (`/customization`)

### 1.1 Default do form de M&F

- Estado inicial `formGameSystems` é `['vampiro_v3', 'lobisomem_w20']`. Mudar para `[]` (vazio) — o usuário escolhe explicitamente para qual(is) sistema(s) vai cadastrar. Validação `formGameSystems.length === 0` já existe e continuará rejeitando.
- Mesmo ajuste em `src/pages/MeritsFlaws.tsx` (rota legada `/merits-flaws` que reusa `Customization`, mas o arquivo `MeritsFlaws.tsx` tem o mesmo defeito; será atualizado em paralelo para manter consistência).

### 1.2 Renomear "Lobisomem" → "Lobisomem / Metamorfo"

- Como `lobisomem_w20` e `metamorfos_w20` são IDs separados em `GAME_SYSTEMS`, mas **ambos os personagens leem M&F com `lobisomem_w20**` (verificado em `EditMetamorfosCharacterModal.tsx:163` e `EditLobisomemCharacterModal.tsx:129`), a abordagem será:
  - **Esconder** `metamorfos_w20` do filtro e do form de M&F em `/customization` (ele não tem M&F próprias — usa as de Lobisomem).
  - **Renomear** o label de `lobisomem_w20` para `"Lobisomem / Metamorfo"` somente nos contextos de M&F (filtro de sistema e checkbox no modal).
- Resultado: criar uma M&F marcada como "Lobisomem / Metamorfo" disponibiliza para ambos os tipos de personagem automaticamente (sem mudança de schema).

### 1.3 Mago como opção visível

- Já presente como `mago_m20` em `GAME_SYSTEMS`. Após o ajuste do default vazio (1.1), o usuário sempre escolhe explicitamente. Adicionar tooltip/hint "Selecione ao menos um sistema" se nada estiver marcado, com i18n.

---

## 2. Filtrar M&F por sistema na criação de personagem (Steps)

Os Steps `StepVampiroMeritsFlaws.tsx`, `StepLobisomemMeritsFlaws.tsx`, `StepMagoMeritsFlaws.tsx` hoje fazem `select('*')` sem filtro — mostram TODAS as M&F. Adicionar `.contains('game_systems', [<systemId>])` em cada:

- Vampiro: `['vampiro_v3']`
- Lobisomem: `['lobisomem_w20']`
- Mago: `['mago_m20']`
- Metamorfo (criação reusa Step de Lobisomem): `['lobisomem_w20']` — passar via prop opcional, ou manter `lobisomem_w20` por padrão.

Ficará alinhado com os Edit modais que já filtram dessa forma.

---

## 3. Auto-limpeza de M&F inválidas em fichas Mago existentes

No load do `MagoCharacterSheet.tsx` e `EditMagoCharacterModal.tsx`:

- Após carregar `availableMeritsFlaws` (já filtradas por `mago_m20`) e o `magoData.merits_flaws` da ficha, comparar IDs.
- Se houver entradas em `magoData.merits_flaws` cujo ID **não** consta em `availableMeritsFlaws`, removê-las localmente E disparar um `update` no Supabase (`characters.vampiro_data.merits_flaws`) — silenciosamente, sem toast, mas com um console.info em DEV.
- Conforme requisito do projeto: essa atualização gera evento realtime automático via Supabase Realtime para `characters` (já em uso para outras edições da ficha).

---

## 4. Consolidação de componentes compartilhados (M&F + Atributos + Habilidades)

Criar novo diretório `src/components/character/storyteller/shared/` com:

### 4.1 `MeritsFlawsSelector.tsx`

- Props: `gameSystem: 'vampiro_v3' | 'lobisomem_w20' | 'mago_m20'`, `selected: SelectedMF[]`, `onChange: (next: SelectedMF[]) => void`, `freebieBudget?: number` (mostra contador de pontos quando informado), `compact?: boolean` (variante usada em modal de edição).
- Faz o fetch interno com `.contains('game_systems', [gameSystem])`, ordena, agrupa por categoria, render do mesmo padrão visual atual (cards com checkbox + badges).
- **Substitui** a UI duplicada em:
  - `StepVampiroMeritsFlaws.tsx`
  - `StepLobisomemMeritsFlaws.tsx`
  - `StepMagoMeritsFlaws.tsx`
  - Bloco de M&F dentro de `EditVampiroCharacterModal.tsx`, `EditLobisomemCharacterModal.tsx`, `EditMagoCharacterModal.tsx`, `EditMetamorfosCharacterModal.tsx`.

### 4.2 `AttributesEditor.tsx`

- Props: `value: { physical, social, mental }`, `onChange`, `mode: 'creation' | 'edit'`, `prioritiesOverride?` (Vampiro tem priorização 7/5/3 na criação; passar pontos disponíveis quando `mode === 'creation'`).
- Renderiza as 3 categorias × 3 atributos usando `STORYTELLER_ATTRIBUTES` do catálogo único.
- **Substitui** os blocos manuais em `StepVampiroAttributes`, `StepLobisomemAttributes`, `StepMagoAttributes`, e nas abas "Atributos" dos 4 modais de edição.

### 4.3 `AbilitiesEditor.tsx`

- Props: `value: { talents, skills, knowledges }`, `onChange`, `specializations?`, `onSpecializationsChange?`, `mode: 'creation' | 'edit'`, `pointsPerCategory?` (criação Vampiro usa 13/9/5).
- Usa `STORYTELLER_ABILITIES` do catálogo único.
- **Substitui** os blocos análogos em todos os Steps e Edit modais WoD.

### 4.4 Estimativa de ganho

- Vampiro Edit modal: ~1086 → ~700 linhas
- Lobisomem Edit: ~628 → ~430
- Mago Edit: ~652 → ~440
- Metamorfo Edit: ~743 → ~530
- Steps M&F (3 arquivos): ~500 linhas eliminadas em favor de `<MeritsFlawsSelector />`
- Steps Atributos/Habilidades: redução semelhante

Total: ~1500 linhas eliminadas, sem mudar nenhum comportamento do usuário.

---

---

## 6. Arquivos afetados (resumo)

**Editados:**

- `src/pages/Customization.tsx` — default vazio, label "Lobisomem / Metamorfo", esconder `metamorfos_w20`
- `src/pages/MeritsFlaws.tsx` — mesmos ajustes (consistência)
- `src/components/character/vampiro/StepVampiroMeritsFlaws.tsx` — usa `<MeritsFlawsSelector />`
- `src/components/character/lobisomem/StepLobisomemMeritsFlaws.tsx` — idem
- `src/components/character/mago/StepMagoMeritsFlaws.tsx` — idem
- `src/components/character/vampiro/StepVampiroAttributes.tsx` — usa `<AttributesEditor />`
- `src/components/character/lobisomem/StepLobisomemAttributes.tsx` — idem
- `src/components/character/mago/StepMagoAttributes.tsx` — idem
- `src/components/character/vampiro/EditVampiroCharacterModal.tsx` — usa os 3 componentes compartilhados nas abas equivalentes
- `src/components/character/lobisomem/EditLobisomemCharacterModal.tsx` — idem
- `src/components/character/mago/EditMagoCharacterModal.tsx` — idem + auto-limpeza
- `src/components/character/metamorfos/EditMetamorfosCharacterModal.tsx` — idem
- `src/components/character/mago/MagoCharacterSheet.tsx` — auto-limpeza no load

**Criados:**

- `src/components/character/storyteller/shared/MeritsFlawsSelector.tsx`
- `src/components/character/storyteller/shared/AttributesEditor.tsx`
- `src/components/character/storyteller/shared/AbilitiesEditor.tsx`

**Não tocados:** schema do banco (zero migração), RLS, edge functions, fluxo de Heróis Marcados.

---

## 7. Fora de escopo (esclarecer se quiser incluir)

- Steps de Habilidades dos Steps de criação são bem variados em layout (tabs, especializações, etc.). Vou usar `<AbilitiesEditor />` onde a estrutura bate; onde houver divergência forte, mantenho o Step com TODO claro para iteração futura.
- Não vou consolidar Steps de Backgrounds, Disciplinas, Esferas, Dons, Virtudes, Renome, Formas — esses são específicos de cada sistema e não duplicados.
- Não vou refazer o fluxo de criação para reusar Edit modais (opção 3 da pergunta) — descartado conforme sua escolha.