# Unificação dos Edit Modals e Fichas Storyteller

## Objetivo

Hoje só a **criação** usa blocos compartilhados (`AttributesEditor`, `AbilitiesEditor`). Os **Edit modals** e as **Fichas** de Vampiro, Lobisomem (W20/W5), Mago (M20/M5) e Metamorfos renderizam atributos, habilidades, merits/flaws e backgrounds manualmente — código duplicado e divergente.

Vamos componentizar tudo e injetar **labels específicas por sistema** (ex.: 5ed → Compostura/Determinação, Mago 5ed → Essências renomeadas, etc.).

## Arquitetura

### 1. Configuração por sistema (novo)

Criar `src/lib/storyteller/traitOverrides.ts`:

```ts
export interface TraitOverrides {
  attributes?: Record<string, BilingualLabel>;  // key → label
  abilities?: Record<string, BilingualLabel>;
  // hooks pra outros blocos (backgrounds, virtues, etc.) virem depois
}

export function getTraitOverrides(system: GameSystem, edition?: '20th'|'5ed'): TraitOverrides
```

Mapas: W5/M5 → Compostura/Determinação; M5 → Essências (Dinâmica/Estática/Primordial/Questionadora); espaço para futuras divergências por sistema.

### 2. Componentes compartilhados — ampliar

- `AttributesEditor`: aceitar `overrides?: TraitOverrides['attributes']` (substitui o atual `edition` prop, que vira só um helper de conveniência).
- `AbilitiesEditor`: idem com `overrides?: TraitOverrides['abilities']`.
- Criar `BackgroundsEditor` (novo) — usado pelos 4 sistemas, com lista de backgrounds vindas do adapter.
- Criar `TraitDisplay` (novo, read-only) — versão somente leitura dos blocos acima, usada nas **Fichas**.

### 3. Edit modals — refatorar para usar os blocos

Arquivos afetados:

- `EditVampiroCharacterModal.tsx`
- `EditLobisomemCharacterModal.tsx` (W20 + W5 — já compartilham)
- `EditMagoCharacterModal.tsx` (M20 + M5 — já compartilham)
- `EditMetamorfosCharacterModal.tsx`

Cada um passa `overrides` derivadas de `getTraitOverrides(system, edition)`.

### 4. Fichas (read-only) — refatorar

- `VampiroCharacterSheet.tsx`
- `LobisomemCharacterSheet.tsx`
- `MagoCharacterSheet.tsx`
- (Metamorfos reutiliza Lobisomem)

Usar `TraitDisplay` para atributos/habilidades em vez de renderizar manualmente.

### 5. Blocos sem mexer agora

- Disciplinas (Vampiro), Dons (Lobisomem), Esferas/Rotinas (Mago), Formas (Metamorfos) — são intrínsecos do sistema, não vale forçar componentização. Ficam como estão.
- Merits/Flaws já usam `MeritsFlawsSelector` compartilhado.

## Ordem de execução

1. Criar `traitOverrides.ts` + estender `AttributesEditor`/`AbilitiesEditor` com `overrides`.
2. Criar `BackgroundsEditor` e `TraitDisplay` (read-only).
3. Refatorar os 4 Edit modals (atributos + habilidades + backgrounds).
4. Refatorar as 3 Fichas (Vampiro, Lobisomem, Mago).
5. Verificar build + smoke visual via Playwright em uma ficha de cada sistema.

## Pontos a confirmar

- **Backgrounds**: cada sistema tem lista diferente (Vampiro: Aliados, Recursos…; Lobisomem: Ancestrais, Pureza Racial…; Mago: Avatar, Biblioteca…). Quer um `BackgroundsEditor` único alimentado por config do adapter, ou prefere manter cada um manual e só componentizar atributos/habilidades por enquanto? - **não vamos mexer nisso agora**
- **Escopo de "demais itens"**: você quer que eu inclua **Virtudes** (Vampiro) e **Renome** (Lobisomem)  nessa unificação ou só Atributos + Habilidades nesta rodada? Sim. Vamos incluir somente isso (em Mago as Essencias são um seletor, igual algúrio para lobisomem, então não precisa ajustar).