## Objetivo

1. Adicionar **busca por nome** e **filtros** (categoria + tipo Vantagem/Desvantagem) ao bloco "Vantagens & Desvantagens" do modal "Editar Personagem", funcionando para **todos os sistemas** (Vampiro, Lobisomem, Mago, Metamorfos) — e também aproveitado na criação.
2. Melhorar a **responsividade dos modais de edição** em desktop, sem prejudicar mobile.

## Como será feito

### 1. Busca + filtros no seletor compartilhado

O componente `src/components/character/storyteller/shared/MeritsFlawsSelector.tsx` já é usado por **todos** os fluxos de M&F (criação e edição de Vampiro/Lobisomem/Mago/Metamorfos). Toda a melhoria entra nele uma única vez.

Adicionar acima da lista um bloco de controles compacto:

- **Campo de busca** (`Input` com ícone de lupa) que filtra `name`, `description` e `prerequisites` (case-insensitive, com `toTitleCase` no nome).
- **Filtro de categoria** (`Select`) populado dinamicamente a partir das categorias presentes nos itens carregados do banco, com opção "Todas".
- **Filtro de tipo** (toggle/segmented com 3 opções: "Todos" / "Vantagens" / "Desvantagens"), baseado no sinal de `cost` (>0 = vantagem, <0 = desvantagem).
- **Contador** discreto: "X de Y" mostrando quantos itens estão visíveis após filtros.
- **Botão "Limpar filtros"** aparece só quando algum filtro está ativo.

Itens **já selecionados** continuam visíveis mesmo quando não batem com o filtro (linha separada no topo "Selecionadas"), para que o usuário nunca perca de vista o que está marcado enquanto explora a lista filtrada.

Os filtros são puramente client-side sobre o `available` já carregado — sem queries extras. A lógica de agrupamento por categoria existente continua funcionando após o filtro.

### 2. Responsividade dos modais "Editar Personagem"

Hoje os 4 modais (`EditVampiroCharacterModal`, `EditLobisomemCharacterModal`, `EditMagoCharacterModal`, `EditMetamorfosCharacterModal`) usam `max-w-2xl` (~672px), o que fica apertado em telas grandes e sobra muita lateral vazia no desktop.

Trocar a classe do `DialogContent` em cada um dos 4 modais para um valor responsivo:

```
w-[95vw] max-w-2xl md:max-w-3xl lg:max-w-5xl max-h-[90vh] flex flex-col
```

- Mobile: continua 95vw (sem mudança visível).
- Tablet (md): 768px.
- Desktop (lg+): até ~1024px, dando espaço confortável para a aba de M&F com busca + filtros + lista lado a lado com a barra de categorias.

A altura `max-h-[90vh]` é mantida (padrão do projeto em Core memory).

### 3. i18n

Conforme a regra de projeto ("só implemente o i18n onde for indispensável"), adicionar apenas as poucas chaves novas realmente visíveis ao usuário em `pt-BR` e `en`:

- `meritsFlaws.searchPlaceholder` — "Buscar vantagem ou desvantagem..." / "Search merit or flaw..."
- `meritsFlaws.filterCategory` — "Categoria" / "Category"
- `meritsFlaws.filterType` — "Tipo" / "Type"
- `meritsFlaws.allCategories` — "Todas" / "All"
- `meritsFlaws.allTypes` / `merits` / `flaws` — "Todos" / "Vantagens" / "Desvantagens"
- `meritsFlaws.clearFilters` — "Limpar filtros" / "Clear filters"
- `meritsFlaws.shownCount` — "{shown} de {total}" / "{shown} of {total}"
- `meritsFlaws.selectedHeader` — "Selecionadas" / "Selected"

## Arquivos afetados

- `src/components/character/storyteller/shared/MeritsFlawsSelector.tsx` — adiciona busca, filtros, seção "Selecionadas" no topo, contador.
- `src/components/character/vampiro/EditVampiroCharacterModal.tsx` — ajusta classe do `DialogContent`.
- `src/components/character/lobisomem/EditLobisomemCharacterModal.tsx` — idem.
- `src/components/character/mago/EditMagoCharacterModal.tsx` — idem.
- `src/components/character/metamorfos/EditMetamorfosCharacterModal.tsx` — idem.
- `src/lib/i18n/translations.ts` — novas chaves em `meritsFlaws` (pt-BR + en).

## Fora de escopo

- Não mexer nos steps de **criação** (já recebem a busca/filtros de graça por usarem o mesmo componente, mas nenhuma mudança visual além disso).
- Não alterar a query do Supabase nem o schema de `merits_flaws`.
- Não tocar nos fluxos de M&F custom do narrador (Personalização).
