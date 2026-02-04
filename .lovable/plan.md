
# Plano Atualizado: Corrigir Modal de Rolagem (Todos os Cenários)

## Resumo do Problema

O modal de rolagem fecha sozinho em **três cenários**:

1. **Race condition no useEffect** - Updates em `rolledTestIds` disparam re-fetch que interfere com o modal
2. **Extremo Positivo** - `handleHeroicMoveComplete()` e `handlePullGroup()` chamam `onClose()` automaticamente
3. **Toasts interferindo** - Toasts com z-index alto podem causar problemas de foco (menos provável, mas possível)

---

## Alterações Planejadas

### 1. PendingTestNotification.tsx - Proteção com Refs

Adicionar refs para evitar que atualizações de estado fechem o modal enquanto ele está aberto:

- Criar `isModalOpenRef` para bloquear fetches enquanto modal aberto
- Criar `rolledTestIdsRef` para tracking sem re-renders
- Remover `rolledTestIds` das dependências do useEffect
- Proteger subscribers de realtime contra updates quando modal aberto

### 2. TestRequestModal.tsx - Remover Fechamento Automático

Remover `onClose()` de:

| Função | Linha | Ação |
|--------|-------|------|
| `handleHeroicMoveComplete` | 312 | Remover `onClose()` |
| `handlePullGroup` | 300 | Remover `onClose()` |

Após usar Movimento Heroico ou Puxar Grupo, o jogador ainda poderá ver o resultado e fechar manualmente.

### 3. Session.tsx e SessionLobby.tsx - Corrigir Erro 406

Trocar `.single()` por `.maybeSingle()` nas queries de profiles para evitar erros quando perfil não existe.

---

## Fluxos Corrigidos

### Rolagem Normal (sem Extremo):
```
Jogador rola dados → Resultado aparece → Modal permanece aberto
    ↓
Jogador clica "Fechar" → Modal fecha
```

### Extremo Positivo (Individual):
```
Jogador rola dados → Extremo Positivo!
    ↓
Toast: "Movimento Heroico ganho!"
    ↓
Botão "Usar Movimento Heroico Agora" aparece
    ↓
Se clicar no botão → HeroicMoveModal abre
    ↓
Jogador escolhe opção → HeroicMoveModal fecha
    ↓
TestRequestModal reaparece (resultado visível) ← CORRIGIDO
    ↓
Jogador clica "Fechar" manualmente
```

### Extremo Positivo (Teste em Grupo):
```
Jogador rola dados → Extremo Positivo!
    ↓
Opções aparecem: "Puxar Grupo" ou "Manter para Si"
    ↓
Se "Puxar Grupo" → Evento criado + Toast
    ↓
Modal permanece aberto (resultado visível) ← CORRIGIDO
    ↓
Jogador clica "Fechar" manualmente
```

### Extremo Negativo:
```
Jogador rola dados → Extremo Negativo!
    ↓
Toast: "O Narrador pode criar uma Complicação"
    ↓
Modal permanece aberto (resultado visível) ← JÁ FUNCIONA (sem onClose)
    ↓
Jogador clica "Fechar" manualmente
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/dice/PendingTestNotification.tsx` | Adicionar refs, remover dependência do useEffect, proteger contra re-renders |
| `src/components/dice/TestRequestModal.tsx` | Remover `onClose()` de `handleHeroicMoveComplete` (linha 312) e `handlePullGroup` (linha 300) |
| `src/pages/Session.tsx` | Trocar `.single()` por `.maybeSingle()` |
| `src/pages/SessionLobby.tsx` | Trocar `.single()` por `.maybeSingle()` |

---

## Detalhes Técnicos

### PendingTestNotification.tsx - Código Principal

```typescript
// Adicionar imports
import { useState, useEffect, useRef } from 'react';

// Adicionar refs no início do componente
const isModalOpenRef = useRef(false);
const rolledTestIdsRef = useRef<Set<string>>(new Set());

// Modificar useEffect (remover rolledTestIds das dependências)
useEffect(() => {
  if (isModalOpenRef.current) return; // Bloquear se modal aberto
  
  const fetchPendingTests = async () => {
    // ... código existente ...
    
    // Merge com IDs locais
    rolledTestIdsRef.current.forEach(id => rolledIds.add(id));
    rolledTestIdsRef.current = rolledIds;
    setRolledTestIds(rolledIds);
  };
  
  // Proteger subscriber
  .on('postgres_changes', { ... }, (payload) => {
    if (isModalOpenRef.current) return; // Ignorar se modal aberto
    // ...
  })
}, [sessionId]); // ← SEM rolledTestIds

// Função para abrir teste
const handleOpenTest = (test: PendingTest) => {
  isModalOpenRef.current = true;
  setActiveTest(test);
};

// Função para fechar
const handleCloseModal = () => {
  if (activeTest) {
    rolledTestIdsRef.current.add(activeTest.id);
    setRolledTestIds(new Set(rolledTestIdsRef.current));
    setPendingTests(prev => prev.filter(t => t.id !== activeTest.id));
  }
  isModalOpenRef.current = false;
  setActiveTest(null);
};
```

### TestRequestModal.tsx - Remoção de onClose()

```typescript
// Linha 300 - handlePullGroup
toast({ title: t.tests.pullGroup + ' ativado! +1 sucesso coletivo' });
setShowPullGroupOption(false);
// REMOVER: onClose();

// Linha 310-313 - handleHeroicMoveComplete
const handleHeroicMoveComplete = () => {
  setShowHeroicModal(false);
  // REMOVER: onClose();
};
```

---

## Resultado Esperado

1. O modal **nunca fecha sozinho** após rolagem, independente do resultado
2. Extremos Positivos permitem usar Movimento Heroico e depois ver o resultado
3. "Puxar Grupo" funciona e mantém o modal aberto
4. Extremos Negativos mostram toast mas mantêm modal aberto
5. O botão "Fechar" é a **única forma** de fechar o modal
6. Erro 406 de profiles eliminado
