
# Plano: Melhorias no Modal de Teste e Feed de Eventos

## Resumo das Mudanças

Este plano aborda quatro problemas identificados:
1. O modal de rolagem fecha antes de mostrar o resultado ao jogador
2. Os resultados dos testes não aparecem no feed de eventos
3. O evento "Teste solicitado" não mostra quais jogadores devem rolar
4. Nenhum evento mostra em qual cena foi realizado

---

## Alterações Planejadas

### 1. Corrigir Modal de Rolagem (TestRequestModal)

**Problema**: O modal pode estar fechando antes do jogador ver o resultado completo.

**Solução**: 
- Garantir que o modal permaneça aberto após a rolagem mostrando claramente os valores
- Adicionar uma exibição mais proeminente do resultado (valores dos dados, total, sucesso/falha)
- O botão "Fechar" só fecha quando o jogador decidir

**Arquivo**: `src/components/dice/TestRequestModal.tsx`

---

### 2. Incluir scene_id nos Eventos de Rolagem

**Problema**: Quando um jogador rola dados, o evento `dice_rolled` não inclui o `scene_id`, impossibilitando mostrar em qual cena a rolagem ocorreu.

**Solução**:
- Passar o `sceneId` como prop para o `TestRequestModal`
- Incluir `scene_id` ao inserir o evento `dice_rolled`
- Fazer o mesmo para eventos `pull_group`

**Arquivos**: 
- `src/components/dice/TestRequestModal.tsx`
- `src/components/dice/PendingTestNotification.tsx`
- `src/pages/Session.tsx`

---

### 3. Mostrar Jogadores no Evento "Teste Solicitado"

**Problema**: O evento `test_requested` contém apenas IDs de personagens no campo `players`, mas o feed não exibe os nomes.

**Solução**:
- Modificar `NarratorSidebar.tsx` para incluir `player_names` no `event_data` ao criar o teste
- Atualizar o `EventFeed.tsx` para exibir os nomes dos jogadores no evento

**Arquivos**:
- `src/components/session/NarratorSidebar.tsx`
- `src/components/session/EventFeed.tsx`

---

### 4. Exibir Nome da Cena em Todos os Eventos

**Problema**: O feed não mostra em qual cena cada evento ocorreu.

**Solução**:
- Incluir `scene_name` no `event_data` de todos os eventos
- Atualizar o EventFeed para exibir a cena como badge ou texto secundário
- Eventos que já incluem `scene_id` precisam também ter o nome

**Arquivos**:
- `src/components/session/NarratorSidebar.tsx` (scene_created, test_requested)
- `src/components/dice/TestRequestModal.tsx` (dice_rolled, pull_group)
- `src/components/session/EventFeed.tsx` (exibição)

---

## Detalhes Técnicos

### TestRequestModal.tsx - Mudanças de Props

```typescript
interface TestRequestModalProps {
  testId: string;
  sessionId: string;
  sceneId: string;      // NOVO
  sceneName: string;    // NOVO
  attribute: string;
  attributeType: AttributeType;
  difficulty: number;
  context?: string;
  characterId: string;
  isGroupTest: boolean;
  onClose: () => void;
}
```

### Evento dice_rolled - Estrutura Atualizada

```typescript
await supabase.from('session_events').insert({
  session_id: sessionId,
  scene_id: sceneId,    // NOVO
  event_type: 'dice_rolled',
  event_data: {
    character_id: characterId,
    character_name: characterName,
    attribute,
    attribute_type: attributeType,
    difficulty,
    dice1: result.dice1,
    dice2: result.dice2,
    total: result.total,
    result: result.result,
    has_positive_extreme: result.hasPositiveExtreme,
    has_negative_extreme: result.hasNegativeExtreme,
    is_group_test: isGroupTest,
    scene_name: sceneName,  // NOVO
  },
});
```

### Evento test_requested - Estrutura Atualizada

```typescript
await supabase.from('session_events').insert({
  session_id: session.id,
  scene_id: currentScene.id,
  event_type: 'test_requested',
  event_data: {
    test_id: test.id,
    attribute: selectedAttribute,
    difficulty: difficulty,
    players: selectedPlayers,
    player_names: playerNames,  // NOVO - array de nomes
    context: context.trim() || null,
    scene_name: currentScene.name,  // NOVO
  },
});
```

### EventFeed.tsx - Formato de Exibição

Para cada evento, adicionar badge com nome da cena:
```tsx
{/* Scene badge */}
{(event.event_data as any).scene_name && (
  <Badge variant="outline" className="text-xs">
    <BookOpen className="w-3 h-3 mr-1" />
    {(event.event_data as any).scene_name}
  </Badge>
)}
```

Para `test_requested`:
```typescript
test_requested: {
  label: (data, lang) => {
    const isGroup = Array.isArray(data.players) && data.players.length > 1;
    const attrName = getAttributeName(data.attribute, lang, t);
    const playerNames = data.player_names?.join(', ') || '';
    return lang === 'pt-BR'
      ? `Teste ${isGroup ? 'em grupo ' : ''}de ${attrName} para ${playerNames}`
      : `${isGroup ? 'Group ' : ''}${attrName} test for ${playerNames}`;
  },
},
```

---

## Fluxo de Dados

```text
Narrador solicita teste
    ↓
NarratorSidebar cria evento test_requested
    - Inclui: player_names, scene_name
    ↓
Jogador vê notificação de teste pendente
    ↓
Jogador clica → TestRequestModal abre
    - Recebe: sceneId, sceneName via props
    ↓
Jogador rola dados → Modal permanece aberto
    ↓
Evento dice_rolled criado
    - Inclui: scene_id, scene_name, character_name
    ↓
Feed exibe todos os detalhes com cena
```

---

## Componentes Afetados

| Arquivo | Alteração |
|---------|-----------|
| `TestRequestModal.tsx` | Adicionar props sceneId/sceneName, incluir no evento |
| `PendingTestNotification.tsx` | Passar sceneId/sceneName para o modal |
| `NarratorSidebar.tsx` | Incluir player_names e scene_name nos eventos |
| `EventFeed.tsx` | Exibir nomes dos jogadores e badge de cena |
| `Session.tsx` | Passar currentScene para PendingTestNotification |

---

## Resultado Esperado

1. **Modal de Rolagem**: Permanece aberto mostrando claramente os valores (ex: "4 + 3 = 7 → Sucesso")
2. **Feed - Teste Solicitado**: "Teste de Agressão para João, Maria" + badge "Cena 2"
3. **Feed - Rolagem**: "João (Agressão): 4+3=7 → Sucesso" + badge "Cena 2"
4. **Todas as informações visíveis** até o jogador fechar manualmente
