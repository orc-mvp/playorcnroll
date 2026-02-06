
# Plano: Suporte para Alteração Permanente de Humanidade/Trilha na Sessão

## Objetivo
Adicionar um tracker de Humanidade/Trilha editável na sessão de Vampiro, com um modal de confirmação especial que alerta sobre a natureza **permanente** da alteração (diferente de Blood/Willpower/Health que são temporários de sessão).

---

## Diferença Crítica: Alteração Permanente

| Tracker | Onde Salva | Natureza |
|---------|-----------|----------|
| Sangue | `session_participants.session_blood_pool` | Temporário de sessão |
| Vontade | `session_participants.session_willpower_current` | Temporário de sessão |
| Vitalidade | `session_participants.session_health_damage` | Temporário de sessão |
| **Humanidade** | `characters.vampiro_data.humanity` | **PERMANENTE** |

A alteração de Humanidade modifica diretamente a ficha do personagem no banco de dados.

---

## Componentes a Modificar

### 1. TrackerChangeConfirmModal.tsx
**Mudanças:**
- Adicionar `'humanity'` ao tipo `TrackerType`
- Adicionar nova prop `isPermanent: boolean`
- Exibir alerta visual diferenciado para alterações permanentes
- Mensagem especial: "Esta é uma alteração PERMANENTE na ficha do personagem"

### 2. VampireTrackers.tsx
**Mudanças:**
- Adicionar seção de Humanidade após Willpower e antes de Health
- Implementar lógica de clique para solicitar alteração
- Salvar alteração no `characters.vampiro_data.humanity` (não em session_participants)
- Emitir evento para o feed

### 3. VampireNarratorSidebar.tsx
**Mudanças:**
- Adicionar exibição de Humanidade na Coterie
- Permitir que Narrador altere Humanidade de jogadores
- Integrar com modal de confirmação permanente

### 4. VampireEventFeed.tsx
**Mudanças:**
- Já suporta `tracker_type: 'humanity'` (verificado no código)
- Adicionar indicador visual de "alteração permanente" no evento

### 5. translations.ts
**Novas chaves:**
- `trackerHumanityChange`: 'Humanidade'
- `trackerPermanentWarning`: 'ATENÇÃO: Esta é uma alteração PERMANENTE na ficha do personagem!'
- `trackerPermanentDescription`: 'A Humanidade será modificada definitivamente, não apenas para esta sessão.'

---

## Novo Layout do Modal para Alteração Permanente

```text
┌──────────────────────────────────────────────────────────┐
│  ⚠️ Confirmar Alteração PERMANENTE              [X]      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  🚨 ALTERAÇÃO PERMANENTE                           │  │
│  │  Esta mudança afetará a ficha do personagem       │  │
│  │  permanentemente, não apenas esta sessão.          │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [Ícone Lua] Humanidade: 7 → 6 (-1)                      │
│                                                          │
│  Esta alteração será sincronizada em tempo real          │
│  com todos os participantes da sessão.                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  🔴 Narrador verá esta mudança                     │  │
│  │  👁️ Outros jogadores verão esta mudança            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [Cancelar]                      [⚠️ Confirmar Alteração]│
└──────────────────────────────────────────────────────────┘
```

---

## Nova Seção de Humanidade no VampireTrackers

```text
┌─────────────────────────────────────────────────┐
│ 🌙 Humanidade                      ⚡ PERMANENTE │
├─────────────────────────────────────────────────┤
│                                                 │
│  ○ ○ ○ ○ ○ ● ● ● ● ●   (7/10)                  │
│                                                 │
│  Clique para alterar (mudança permanente)       │
└─────────────────────────────────────────────────┘
```

---

## Fluxo Técnico da Alteração Permanente

```text
[Clique em ponto de Humanidade]
         │
         ▼
[Calcular novo valor]
         │
         ▼
[Abrir Modal com isPermanent=true]
         │
     ┌───┴───┐
     ▼       ▼
[Cancelar] [Confirmar]
     │           │
     ▼           ▼
[Reverte]  [1. Atualizar characters.vampiro_data]
           [2. Emitir evento tracker_change]
           [3. Atualizar estado local]
           [4. Toast de confirmação]
```

---

## Detalhes Técnicos

### Função de Salvamento Permanente

```typescript
const saveHumanityPermanently = async (characterId: string, newHumanity: number) => {
  // 1. Buscar vampiro_data atual
  const { data: char } = await supabase
    .from('characters')
    .select('vampiro_data')
    .eq('id', characterId)
    .single();
  
  // 2. Atualizar humanity no objeto
  const updatedData = {
    ...char.vampiro_data,
    humanity: newHumanity,
  };
  
  // 3. Salvar de volta
  await supabase
    .from('characters')
    .update({ vampiro_data: updatedData })
    .eq('id', characterId);
};
```

### TrackerType Expandido

```typescript
export type TrackerType = 'blood' | 'willpower' | 'health' | 'humanity';
```

### Estrutura do Evento no Feed

```typescript
{
  event_type: 'tracker_change',
  event_data: {
    tracker_type: 'humanity',
    character_id: 'uuid',
    character_name: 'Marcus',
    old_value: 7,
    new_value: 6,
    is_narrator_change: false,
    is_permanent: true, // Nova flag
  }
}
```

---

## Arquivos a Modificar

1. `src/components/session/vampire/TrackerChangeConfirmModal.tsx`
   - Adicionar 'humanity' ao TrackerType
   - Adicionar prop isPermanent
   - Renderizar alerta de permanência

2. `src/components/session/vampire/VampireTrackers.tsx`
   - Adicionar card de Humanidade
   - Implementar requestHumanityChange
   - Implementar saveHumanityPermanently
   - Integrar com confirmação

3. `src/components/session/vampire/VampireNarratorSidebar.tsx`
   - Adicionar Humanidade na exibição da Coterie
   - Permitir alteração pelo Narrador

4. `src/components/session/vampire/VampireEventFeed.tsx`
   - Adicionar indicador visual de "permanente" para eventos de humanity

5. `src/lib/i18n/translations.ts`
   - Adicionar chaves de tradução para permanência

---

## Resultado Esperado

1. **Humanidade visível na sessão** - Players e Narrador podem ver a Humanidade atual
2. **Alteração com confirmação especial** - Modal destaca clareza que é permanente
3. **Evento no feed** - Alterações de Humanidade aparecem no feed com badge "PERMANENTE"
4. **Consistência com ficha** - Após alterar, a ficha do personagem reflete o novo valor
5. **Sincronização em tempo real** - Todos veem a alteração imediatamente
