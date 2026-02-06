
# Plano: Atualização dos Trackers com Confirmação e Reorganização

## Objetivo
Reorganizar os trackers (Disciplinas no topo, depois Sangue, Força de Vontade e Vitalidade) e adicionar um modal de confirmação antes de qualquer alteração para sincronização em tempo real com todos os participantes da sala.

---

## Componentes Afetados

### 1. VampireTrackers.tsx (Painel do Jogador - Sidebar Direita)
**Função atual:** Exibe e permite edição dos trackers do jogador
**Mudanças:**
- Reorganizar ordem: Disciplinas → Sangue → Vontade → Vitalidade
- Adicionar modal de confirmação antes de salvar alterações

### 2. VampireNarratorSidebar.tsx (Coterie - Painel do Narrador)
**Função atual:** Exibe trackers resumidos dos jogadores para o Narrador
**Mudanças:**
- Tornar os trackers interativos (clicáveis pelo Narrador)
- Adicionar modal de confirmação antes de submeter alterações

### 3. VampiroCharacterSheet.tsx (Ficha do Personagem)
**Função atual:** Exibe e permite edição local dos trackers na ficha completa
**Mudanças:**
- Reorganizar seção Salvatérios: Disciplinas → Sangue → Vontade → Vitalidade
- Adicionar modal de confirmação para alterações (quando em contexto de sessão)

### 4. VampirePlayerPanel (Inline em VampireSession.tsx)
**Função atual:** Exibe informações básicas do personagem do jogador
**Mudanças:**
- Adicionar visualização resumida de disciplinas e trackers

---

## Novo Componente: TrackerChangeConfirmModal

```text
┌──────────────────────────────────────────────────────────┐
│  ⚠️ Confirmar Alteração                         [X]      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Você está prestes a alterar:                            │
│                                                          │
│  [Ícone Sangue] Sangue: 15 → 12 (-3)                     │
│                                                          │
│  Esta alteração será sincronizada em tempo real          │
│  com todos os participantes da sessão.                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  🔴 Narrador verá esta mudança                     │  │
│  │  👁️ Outros jogadores verão esta mudança            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [Cancelar]                        [✓ Confirmar]         │
└──────────────────────────────────────────────────────────┘
```

---

## Nova Ordem dos Trackers

```text
┌─────────────────────────────────────────────────┐
│ 1. DISCIPLINAS (somente leitura durante sessão) │
│    - Lista de disciplinas com níveis            │
├─────────────────────────────────────────────────┤
│ 2. SANGUE (Blood Pool)                          │
│    - Grid 5x10 (50 pontos)                      │
│    - Clique → Modal de confirmação              │
├─────────────────────────────────────────────────┤
│ 3. FORÇA DE VONTADE (Willpower)                 │
│    - Pontos atuais vs máximo                    │
│    - Clique → Modal de confirmação              │
├─────────────────────────────────────────────────┤
│ 4. VITALIDADE (Health Levels)                   │
│    - 7 níveis com penalidades                   │
│    - Seleção progressiva (existente)            │
│    - Clique → Modal de confirmação              │
└─────────────────────────────────────────────────┘
```

---

## Fluxo de Confirmação

```text
[Usuário clica em tracker]
        │
        ▼
[Alteração calculada localmente]
        │
        ▼
[Modal de confirmação abre]
   "Sangue: 15 → 12 (-3)"
   "Esta mudança será visível para todos"
        │
    ┌───┴───┐
    ▼       ▼
[Cancelar] [Confirmar]
    │           │
    ▼           ▼
[Reverte]  [Salva no banco]
           [Realtime sync]
           [Event logged]
```

---

## Detalhes Técnicos

### Estrutura do Modal de Confirmação

**Props:**
- `open: boolean` - Controle de visibilidade
- `trackerType: 'blood' | 'willpower' | 'health'` - Tipo de tracker
- `currentValue: number | boolean[]` - Valor atual
- `newValue: number | boolean[]` - Novo valor proposto
- `characterName: string` - Nome do personagem (para Narrador)
- `isNarrator: boolean` - Se é o Narrador fazendo a alteração
- `onConfirm: () => void` - Callback de confirmação
- `onCancel: () => void` - Callback de cancelamento

### Mensagens de Confirmação

**Para Jogadores:**
- "Esta alteração será visível para o Narrador e todos os jogadores."

**Para Narradores:**
- "Esta alteração será aplicada ao personagem {nome} e visível para o jogador."

### Tradução (i18n)

```typescript
// Novas chaves em vampiro
trackerChangeTitle: 'Confirmar Alteração',
trackerChangeDescription: 'Esta alteração será sincronizada com todos na sessão.',
trackerBloodChange: 'Sangue',
trackerWillpowerChange: 'Vontade',
trackerHealthChange: 'Vitalidade',
trackerVisibleToNarrator: 'O Narrador verá esta mudança',
trackerVisibleToPlayer: 'O jogador verá esta mudança',
trackerVisibleToAll: 'Todos os participantes verão esta mudança',
```

---

## Arquivos a Criar/Modificar

### Criar
1. `src/components/session/vampire/TrackerChangeConfirmModal.tsx`
   - Modal de confirmação reutilizável

### Modificar
1. `src/components/session/vampire/VampireTrackers.tsx`
   - Reorganizar ordem dos cards
   - Integrar modal de confirmação
   - Mover disciplinas para o topo

2. `src/components/session/vampire/VampireNarratorSidebar.tsx`
   - Tornar trackers da Coterie interativos
   - Adicionar capacidade de edição pelo Narrador
   - Integrar modal de confirmação

3. `src/components/character/vampiro/VampiroCharacterSheet.tsx`
   - Reorganizar seção Salvatérios
   - Mover Disciplinas para antes de Blood Pool

4. `src/pages/VampireSession.tsx`
   - Atualizar VampirePlayerPanel com disciplinas

5. `src/lib/i18n/translations.ts`
   - Adicionar novas chaves de tradução

---

## Comportamento do Modal

### Quando Abre
- Clique em qualquer ponto do tracker
- Valor proposto é calculado
- Estado local é mantido (não salvo ainda)

### Ações no Modal
- **Confirmar:** Salva no banco, dispara realtime sync, fecha modal
- **Cancelar:** Reverte para valor anterior, fecha modal
- **Fechar (X):** Mesmo que cancelar

### Estados Especiais
- Se alteração resulta em estado crítico (sangue = 0, vontade = 0):
  - Modal exibe aviso adicional em vermelho
  - "Atenção: Isso resultará em estado crítico!"

---

## Resultado Esperado

1. **Reorganização visual clara** - Disciplinas aparecem primeiro como referência, seguidas pelos trackers editáveis
2. **Confirmação explícita** - Usuários entendem que suas ações afetam todos
3. **Prevenção de erros** - Cliques acidentais não causam alterações imediatas
4. **Experiência consistente** - Mesmo comportamento na ficha, sidebar e painel do narrador
5. **Comunicação clara** - Mensagens indicam quem verá as alterações
