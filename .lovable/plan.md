# Lobisomem: O Apocalipse -- Novo Sistema de Jogo

## Resumo

Duplicar a estrutura do Vampiro para criar o sistema de Lobisomem: O Apocalipse. As principais difereneas sao: substituir Humanidade por Gnose e Furia, remover Pontos de Sangue e Virtudes, substituir Disciplinas por Dons (campo de texto livre por nivel), e adicionar controle de Formas (Hominideo, Glabro, Crinos, Hispo, Lupus) nos trackers da sessao.

---

## Escopo da Implementacao

### 1. Registro do Sistema de Jogo

- Adicionar `'lobisomem'` ao tipo `GameSystemId` em `gameSystems.ts`
- Criar entrada no array `GAME_SYSTEMS` com icone (ex: `Dog`), cor e features
- Atualizar `GameSystemSelector.tsx` com icone para o novo sistema
- Atualizar `sessionRoutes.ts` para rotear sessoes de lobisomem

### 2. Criacao de Personagem (5 etapas)

Novos componentes em `src/components/character/lobisomem/`:

- **StepLobisomemBasicInfo.tsx** -- Campos: Nome*, Jogador, Cronica, Natureza, Comportamento, Tribo*, Augurio*, Posto, Raca, Matilha, Totem, Conceito. Tribos e Augurios como selects com lista fixa.
- **StepLobisomemAttributes.tsx** -- Mesma estrutura do Vampiro (Fisicos, Sociais, Mentais + Habilidades com especializacoes). Reutiliza DotRating.
- **StepLobisomemGifts.tsx** -- Dons organizados por nivel (1-5). Cada nivel e um campo de texto livre para o jogador digitar o nome do Dom. Sem bolinhas, sem catalogo.
- **StepLobisomemBackgrounds.tsx** -- Antecedentes (mesma estrutura do Vampiro). Gnose e Furia como DotRating (1-10). Forca de Vontade como DotRating (1-10).
- **StepLobisomemMeritsFlaws.tsx** -- Reutiliza o mesmo catalogo global de merits_flaws (filtrando por `game_systems` contendo `lobisomem_w20`).

Atualizar `CreateCharacter.tsx` para incluir o fluxo do Lobisomem (6 steps: sistema + 5 acima).

### 3. Dados do Personagem

- Armazenar em `vampiro_data` (coluna JSONB generica que ja existe) com estrutura adaptada:

```text
lobisomem_data = {
  player, chronicle, nature, demeanor,
  tribe, auspice, rank, breed, pack, totem,
  attributes: { physical, social, mental },
  abilities: { talents, skills, knowledges },
  specializations: {},
  gnosis: number,
  rage: number,
  willpower: number,
  gifts: { 1: ["Nome do Dom"], 2: ["Nome"], ... },
  backgrounds: {},
  merits_flaws: [],
}
```

Nao precisa de migracao de banco, pois `vampiro_data` ja e JSONB flexivel e o campo `game_system` diferencia.

### 4. Ficha de Personagem

- **LobisomemCharacterSheet.tsx** -- Novo componente exibindo:
  - Header com icone de lobo, Nome, Tribo, Augurio, Posto, Raca
  - Atributos (grid 3 colunas)
  - Habilidades (grid 3 colunas com contadores)
  - Dons (lista por nivel, cada um com nome textual)
  - Antecedentes
  - Gnose, Furia, Forca de Vontade (dot displays)
  - Vitalidade (7 niveis de saude)
  - Merits & Flaws
  - XP Log
- **EditLobisomemCharacterModal.tsx** -- Modal de edicao com abas: Basico, Atributos, Habilidades, Dons, Antecedentes, Merits & Flaws

Atualizar `CharacterSheet.tsx` para detectar `game_system === 'lobisomem_w20'` e renderizar o componente correto.

### 5. Sala de Sessao

- **WerewolfSession.tsx** (`src/pages/WerewolfSession.tsx`) -- Duplicacao da VampireSession com adaptacoes:
  - Sem Blood Pool tracker
  - Trackers: Gnose, Furia, Forca de Vontade, Vitalidade, Forma Atual
  - Formas: Hominideo, Glabro, Crinos, Hispo, Lupus (select ou botoes)
- **WerewolfTrackers.tsx** -- Componente de trackers adaptado:
  - Gnose (pool similar ao Blood Pool)
  - Furia (pool similar)
  - Vontade (current/max como no Vampiro)
  - Vitalidade (7 niveis)
  - Forma atual (5 opcoes com botoes)
- Novos campos no `session_participants`:
  - `session_gnosis` (integer, default 0)
  - `session_rage` (integer, default 0)
  - `session_form` (text, default 'hominid')
  - Reutilizar `session_willpower_current` e `session_health_damage` que ja existem
- Rota: `/session/werewolf/:sessionId`
- Adaptar test request modal, pending test, event feed e narrator sidebar para o contexto de Lobisomem (sem Virtue test, sem Humanity test; incluir Gnosis e Rage como tipos de teste)

### 6. Migracao de Banco

Uma unica migracao SQL para:

- Adicionar colunas `session_gnosis`, `session_rage`, `session_form` na tabela `session_participants`

### 7. Internacionalizacao (i18n)

Novo namespace `lobisomem` em `translations.ts` com todas as chaves:

- tribe, auspice, rank, breed, pack, totem
- Nomes de tribos (13 tribos)
- Nomes de augurios (5 augurios)
- Nomes de racas (3 racas: Hominideo, Impuro, Lupino)
- Nomes de formas (5 formas)
- gnosis, rage, gifts, etc.
- Labels de trackers e testes

### 8. Atualizacoes em Arquivos Existentes

- `gameSystems.ts` -- Novo sistema
- `GameSystemSelector.tsx` -- Icone do lobo
- `sessionRoutes.ts` -- Rota werewolf
- `App.tsx` -- Nova rota `/session/werewolf/:sessionId`
- `CreateCharacter.tsx` -- Fluxo de criacao do lobisomem
- `CharacterSheet.tsx` -- Renderizacao da ficha
- `translations.ts` -- Namespace lobisomem
- `diceUtils.ts` -- Tipos de teste adicionais (gnosis, rage)
- `CreateSession.tsx` -- O sistema ja lista sistemas disponiveis via `GAME_SYSTEMS`
- `Dashboard.tsx` / `MyCharacters.tsx` -- Icone do lobo para personagens lobisomem

---

## Detalhes Tecnicos

### Estrutura de Arquivos Novos

```text
src/components/character/lobisomem/
  StepLobisomemBasicInfo.tsx
  StepLobisomemAttributes.tsx
  StepLobisomemGifts.tsx
  StepLobisomemBackgrounds.tsx
  StepLobisomemMeritsFlaws.tsx
  LobisomemCharacterSheet.tsx
  EditLobisomemCharacterModal.tsx

src/components/session/werewolf/
  WerewolfTrackers.tsx
  WerewolfEventFeed.tsx
  WerewolfNarratorSidebar.tsx
  WerewolfTestRequestModal.tsx
  WerewolfPendingTest.tsx
  MobileWerewolfPendingTestDrawer.tsx
  WerewolfManagePlayersModal.tsx

src/pages/
  WerewolfSession.tsx

src/lib/lobisomem/
  diceUtils.ts (estende/adapta o vampiro)
  tribes.ts (lista de tribos, augurios, racas)
```

### Tipos de Teste do Lobisomem

- `attribute_ability` (Atributo + Habilidade)
- `attribute_only` (So Atributo)
- `willpower` (Forca de Vontade)
- `gnosis` (Gnose)
- `rage` (Furia)

### Formas e Modificadores

As formas alteram atributos fisicos. Isso sera armazenado como metadado visual inicialmente, sem aplicacao automatica de modificadores (pode ser adicionado depois).

### Sequencia de Implementacao

1. Migracao de banco (colunas novas em session_participants)
2. gameSystems.ts + i18n translations
3. Componentes de criacao de personagem
4. Ficha de personagem + modal de edicao
5. Sala de sessao (pagina + trackers + feed + sidebar)
6. Rotas e integracao final
7. Testes end-to-end